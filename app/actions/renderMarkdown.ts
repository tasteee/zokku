'use server'

import { readFile } from 'node:fs/promises'
import { join } from 'node:path'
import { unified } from 'unified'
import remarkParse from 'remark-parse'
import remarkGfm from 'remark-gfm'
import remarkRehype from 'remark-rehype'
import rehypeSlug from 'rehype-slug'
import rehypeStringify from 'rehype-stringify'
import { codeToTokensBase } from 'shiki'
import type { ThemeRegistrationAny } from '@shikijs/types'
import { customMarkers, matchDynamicMarkerDefinition } from '@/lib/markers'
import type { MarkerDefinitionT } from '@/lib/markers'
import { codeTheme } from '@/lib/codeTheme'

// ─── Minimal hast-compatible types ───────────────────────────

type HastTextNodeT = { type: 'text'; value: string }
type HastElementT = {
	type: 'element'
	tagName: string
	properties: Record<string, unknown>
	children: (HastElementT | HastTextNodeT)[]
	data?: Record<string, unknown>
}
type HastNodeT = HastElementT | HastTextNodeT | { type: string; children?: HastNodeT[] }

type HandlerStateT = {
	patch: (mdast: unknown, hast: HastElementT) => void
	applyData: (mdast: unknown, hast: HastElementT) => HastElementT
}

type ShikiTokenT = {
	content: string
	color?: string
	fontStyle?: number
}

// ─── Minimal mdast-compatible types ─────────────────────────

type Text = { type: 'text'; value: string }
type Code = { type: 'code'; value: string; lang?: string | null; meta?: string | null }
type Paragraph = { type: 'paragraph'; children: MdastNode[]; data?: Record<string, unknown> }
type Root = { type: 'root'; children: MdastNode[] }
type MdastNode = Root | Paragraph | { type: string; children?: MdastNode[]; data?: Record<string, unknown> }

// ─── Custom paragraph markers ─────────────────────────────────

const visitParagraphs = (node: MdastNode, visitor: (node: Paragraph) => void): void => {
	if (node.type === 'paragraph') visitor(node as Paragraph)
	for (const child of node.children ?? []) {
		visitParagraphs(child as MdastNode, visitor)
	}
}

const applyMarkerDefinition = (node: Paragraph, definition: MarkerDefinitionT): void => {
	const existingProperties = (node.data?.hProperties as Record<string, unknown>) ?? {}
	const hProperties: Record<string, unknown> = { ...existingProperties, ...definition.attributes }

	if (definition.classes) hProperties.className = definition.classes
	if (definition.isAriaHidden) hProperties['aria-hidden'] = 'true'

	node.data = {
		...node.data,
		hName: definition.element ?? 'p',
		hProperties: hProperties as Record<string, string | number | boolean | (string | number)[] | null | undefined>
	}
}

const remarkCustomParagraphs = () => {
	return (tree: Root): void => {
		visitParagraphs(tree as MdastNode, (node) => {
			const firstText = node.children.find((child): child is Text => child.type === 'text')
			if (!firstText) return

			const dynamicDefinition = matchDynamicMarkerDefinition(firstText.value)
			if (dynamicDefinition) {
				if (dynamicDefinition.consumeLine) {
					node.children = []
				} else {
					firstText.value = firstText.value.slice(dynamicDefinition.marker!.length).trimStart()
				}
				applyMarkerDefinition(node, dynamicDefinition)
				return
			}

			for (const [marker, definition] of Object.entries(customMarkers)) {
				if (!firstText.value.startsWith(marker)) continue

				if (definition.consumeLine) {
					node.children = []
				} else {
					firstText.value = firstText.value.slice(marker.length).trimStart()
				}
				applyMarkerDefinition(node, definition)
				return
			}
		})
	}
}

// ─── Code block filename extraction ───────────────────────────

const getCodeFilename = (meta: string | null | undefined): string => {
	if (!meta) return ''

	const filenameMatch = meta.match(/(?:^|\s)(?:filename|file|title)=("([^"]+)"|'([^']+)'|(\S+))/)
	if (filenameMatch) return filenameMatch[2] ?? filenameMatch[3] ?? filenameMatch[4] ?? ''

	const firstToken = meta.trim().split(/\s+/)[0]
	const looksLikeFilename = firstToken.includes('.') || firstToken.includes('/') || firstToken.includes('\\')
	if (looksLikeFilename) return firstToken

	return ''
}

// ─── Code block hast handler (captures filename from meta) ────

const codeHandler = (state: HandlerStateT, node: Code): HastElementT => {
	const properties: Record<string, unknown> = {}
	const language = node.lang ? node.lang.split(/\s+/) : []
	const filename = getCodeFilename(node.meta)

	if (language.length > 0) {
		properties.className = [`language-${language[0]}`]
	}

	if (filename) {
		properties.dataFilename = filename
	}

	let codeEl: HastElementT = {
		type: 'element',
		tagName: 'code',
		properties,
		children: [{ type: 'text', value: node.value ?? '' }]
	}

	if (node.meta) {
		codeEl.data = { meta: node.meta }
	}

	state.patch(node, codeEl)
	codeEl = state.applyData(node, codeEl)

	const preEl: HastElementT = {
		type: 'element',
		tagName: 'pre',
		properties: {},
		children: [codeEl]
	}

	state.patch(node, preEl)
	return preEl
}

// ─── Shiki highlighting ───────────────────────────────────────

const getCodeLanguage = (codeNode: HastElementT): string => {
	const classNames = (codeNode.properties?.className as string[]) ?? []
	const languageClass = classNames.find((cls) => String(cls).startsWith('language-'))
	return languageClass ? String(languageClass).replace(/^language-/, '') : 'text'
}

const toText = (node: HastNodeT): string => {
	if (node.type === 'text') return (node as HastTextNodeT).value
	return ((node as HastElementT).children ?? []).map(toText).join('')
}

const tokenStyle = (token: ShikiTokenT): string => {
	const styles: string[] = []
	if (token.color) styles.push(`color: ${token.color}`)
	if (token.fontStyle !== undefined && token.fontStyle & 1) styles.push('font-style: italic')
	if (token.fontStyle !== undefined && token.fontStyle & 2) styles.push('font-weight: 700')
	if (token.fontStyle !== undefined && token.fontStyle & 4) styles.push('text-decoration: underline')
	return styles.join('; ')
}

const tokensToCodeBlock = (result: { bg: string; fg: string; tokens: ShikiTokenT[][] }, lang: string) => {
	const nonEmptyTokens = result.tokens.filter((line, index) => {
		const isLastLine = index === result.tokens.length - 1
		const isEmpty = line.length === 0
		return !(isLastLine && isEmpty)
	})

	const lineElements: (HastElementT | HastTextNodeT)[] = nonEmptyTokens.flatMap((line, index) => {
		const lineEl: HastElementT = {
			type: 'element',
			tagName: 'span',
			properties: { className: ['line'] },
			children: line.map(
				(token): HastElementT => ({
					type: 'element',
					tagName: 'span',
					properties: { className: ['token'], style: tokenStyle(token) },
					children: [{ type: 'text', value: token.content }]
				})
			)
		}

		const isLastLine = index === nonEmptyTokens.length - 1
		if (isLastLine) return [lineEl]
		return [lineEl, { type: 'text', value: '\n' }]
	})

	return { bg: result.bg, fg: result.fg, lang, children: lineElements }
}

const highlightCode = async (code: string, lang: string) => {
	const theme = codeTheme as unknown as ThemeRegistrationAny
	try {
		const result = await codeToTokensBase(code, { lang: lang as never, theme })
		return tokensToCodeBlock(
			{
				bg: (theme as { colors?: { 'editor.background'?: string } }).colors?.['editor.background'] ?? '#0F1110',
				fg: (theme as { colors?: { 'editor.foreground'?: string } }).colors?.['editor.foreground'] ?? '#9D9F9E',
				tokens: result as unknown as ShikiTokenT[][]
			},
			lang
		)
	} catch {
		const result = await codeToTokensBase(code, { lang: 'text', theme })
		return tokensToCodeBlock(
			{
				bg: (theme as { colors?: { 'editor.background'?: string } }).colors?.['editor.background'] ?? '#0F1110',
				fg: (theme as { colors?: { 'editor.foreground'?: string } }).colors?.['editor.foreground'] ?? '#9D9F9E',
				tokens: result as unknown as ShikiTokenT[][]
			},
			'text'
		)
	}
}

const visitAsync = async (node: HastNodeT, type: string, visitor: (node: HastElementT) => Promise<void>): Promise<void> => {
	if (node.type === type) await visitor(node as HastElementT)
	for (const child of (node as HastElementT).children ?? []) {
		await visitAsync(child as HastNodeT, type, visitor)
	}
}

const rehypeHighlightCodeBlocks = () => {
	return async (tree: HastNodeT): Promise<void> => {
		await visitAsync(tree, 'element', async (node) => {
			const isPreTag = node.tagName !== 'pre'
			if (isPreTag) return

			const codeNode = node.children.find(
				(child): child is HastElementT =>
					(child as HastElementT).type === 'element' && (child as HastElementT).tagName === 'code'
			)
			if (!codeNode) return

			const code = toText(codeNode).replace(/\r?\n$/, '')
			const lang = getCodeLanguage(codeNode)
			const filename = codeNode.properties?.dataFilename as string | undefined
			const highlighted = await highlightCode(code, lang)

			node.properties = {
				...node.properties,
				className: ['zCodeBlock'],
				style: `--code-bg: ${highlighted.bg}; --code-fg: ${highlighted.fg};`
			}

			const filenameEl: HastElementT = {
				type: 'element',
				tagName: 'div',
				properties: { className: ['zCodeFilename'] },
				children: [{ type: 'text', value: filename ?? '' }]
			}

			const highlightedCodeEl: HastElementT = {
				type: 'element',
				tagName: 'code',
				properties: { className: ['zCode', `language-${highlighted.lang}`], 'data-language': highlighted.lang },
				children: highlighted.children as (HastElementT | HastTextNodeT)[]
			}

			node.children = [...(filename ? [filenameEl] : []), highlightedCodeEl]
		})
	}
}

// ─── Public API ───────────────────────────────────────────────

const rehypeStripTodos = () => {
	return (tree: HastNodeT): void => {
		const stripChildren = (node: HastElementT): void => {
			node.children = node.children.filter((child) => {
				const isElement = (child as HastElementT).type === 'element'
				if (!isElement) return true

				const childEl = child as HastElementT
				const classNames = (childEl.properties?.className as string[]) ?? []
				const isTodo = classNames.includes('zTodo')
				if (isTodo) return false

				stripChildren(childEl)
				return true
			})
		}

		stripChildren(tree as HastElementT)
	}
}

export const renderMarkdown = async (content: string): Promise<string> => {
	const result = await unified()
		.use(remarkParse)
		.use(remarkGfm)
		.use(remarkCustomParagraphs)
		.use(remarkRehype, { handlers: { code: codeHandler as never } })
		.use(rehypeHighlightCodeBlocks as never)
		.use(rehypeSlug)
		.use(rehypeStringify)
		.process(content)

	return String(result)
}

const renderMarkdownForExport = async (content: string): Promise<string> => {
	const result = await unified()
		.use(remarkParse)
		.use(remarkGfm)
		.use(remarkCustomParagraphs)
		.use(remarkRehype, { handlers: { code: codeHandler as never } })
		.use(rehypeHighlightCodeBlocks as never)
		.use(rehypeSlug)
		.use(rehypeStripTodos as never)
		.use(rehypeStringify)
		.process(content)

	return String(result)
}

const escapeHtml = (text: string): string => {
	return text.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;')
}

export const exportHtml = async (title: string, content: string): Promise<string> => {
	const bodyHtml = await renderMarkdownForExport(content)

	const globalsCssPath = join(process.cwd(), 'app', 'globals.css')
	const globalsCss = await readFile(globalsCssPath, 'utf-8')

	return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <title>${escapeHtml(title)}</title>
  <link rel="preconnect" href="https://fonts.googleapis.com" />
  <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin />
  <style>
${globalsCss}
  </style>
  <style>
    body { padding: 3rem clamp(1.5rem, 8vw, 6rem); }
    .Prose { max-width: 52rem; margin: 0 auto; padding-bottom: 64px; }
  </style>
</head>
<body>
<div class="Prose">${bodyHtml}</div>
</body>
</html>`
}
