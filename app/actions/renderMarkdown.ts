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
import { icons as mingcuteIcons } from '@iconify-json/mingcute'
import { getIconData, iconToHTML, iconToSVG, replaceIDs } from '@iconify/utils'
import { customMarkers, matchDynamicMarkerDefinition } from '@/lib/markers'
import type { MarkerDefinitionT } from '@/lib/markers'
import { codeTheme } from '@/lib/codeTheme'
import { lightCodeTheme } from '@/lib/lightCodeTheme'
import type { PreviewSettingsT, PreviewThemeT } from '@/components/previewSettings'

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

type Text = { type: 'text'; value: string }
type Code = { type: 'code'; value: string; lang?: string | null; meta?: string | null }
type Paragraph = { type: 'paragraph'; children: MdastNode[]; data?: Record<string, unknown> }
type Root = { type: 'root'; children: MdastNode[] }
type MdastNode = Root | Paragraph | { type: string; children?: MdastNode[]; data?: Record<string, unknown> }

const INLINE_ICON_REGEX = /:icon\[([a-z0-9]+(?:-[a-z0-9]+)*)\]:/g
const INVALID_ICON_FALLBACK = 'question-fill'

const renderIconSvg = (name: string): string | null => {
	const iconData = getIconData(mingcuteIcons, name)
	if (iconData === null) return null

	const rendered = iconToSVG(iconData, { height: '1em', width: '1em' })
	return iconToHTML(replaceIDs(rendered.body), {
		...rendered.attributes,
		'aria-hidden': 'true',
		focusable: 'false'
	})
}

const renderInlineIcon = (name: string): string => {
	const requestedSvg = renderIconSvg(name)
	if (requestedSvg !== null) {
		return `<span class="zInlineIcon" data-icon="mingcute:${name}" aria-hidden="true">${requestedSvg}</span>`
	}

	const fallbackSvg = renderIconSvg(INVALID_ICON_FALLBACK)
	if (fallbackSvg === null) return ''

	return `<span class="zInlineIcon isInvalid" data-icon="mingcute:${INVALID_ICON_FALLBACK}" data-invalid-icon="${name}" aria-hidden="true">${fallbackSvg}</span>`
}

const expandInlineIcons = (content: string): string => {
	return content.replace(INLINE_ICON_REGEX, (_fullMatch, name: string): string => renderInlineIcon(name))
}

const visitParagraphs = (node: MdastNode, visitor: (node: Paragraph) => void): void => {
	if (node.type === 'paragraph') visitor(node as Paragraph)
	for (const child of node.children ?? []) visitParagraphs(child as MdastNode, visitor)
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
				if (dynamicDefinition.consumeLine) node.children = []
				else firstText.value = firstText.value.slice(dynamicDefinition.marker!.length).trimStart()
				applyMarkerDefinition(node, dynamicDefinition)
				return
			}

			for (const [marker, definition] of Object.entries(customMarkers)) {
				if (!firstText.value.startsWith(marker)) continue
				if (definition.consumeLine) node.children = []
				else firstText.value = firstText.value.slice(marker.length).trimStart()
				applyMarkerDefinition(node, definition)
				return
			}
		})
	}
}

const getCodeFilename = (meta: string | null | undefined): string => {
	if (!meta) return ''

	const filenameMatch = meta.match(/(?:^|\s)(?:filename|file|title)=("([^"]+)"|'([^']+)'|(\S+))/)
	if (filenameMatch) return filenameMatch[2] ?? filenameMatch[3] ?? filenameMatch[4] ?? ''

	const firstToken = meta.trim().split(/\s+/)[0]
	const looksLikeFilename = firstToken.includes('.') || firstToken.includes('/') || firstToken.includes('\\')
	return looksLikeFilename ? firstToken : ''
}

const codeHandler = (state: HandlerStateT, node: Code): HastElementT => {
	const properties: Record<string, unknown> = {}
	const language = node.lang ? node.lang.split(/\s+/) : []
	const filename = getCodeFilename(node.meta)

	if (language.length > 0) properties.className = [`language-${language[0]}`]
	if (filename) properties.dataFilename = filename

	let codeEl: HastElementT = {
		type: 'element',
		tagName: 'code',
		properties,
		children: [{ type: 'text', value: node.value ?? '' }]
	}

	if (node.meta) codeEl.data = { meta: node.meta }
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
		return !(isLastLine && line.length === 0)
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

		if (index === nonEmptyTokens.length - 1) return [lineEl]
		return [lineEl, { type: 'text', value: '\n' }]
	})

	return { bg: result.bg, fg: result.fg, lang, children: lineElements }
}

const getCodeTheme = (previewTheme: PreviewThemeT): ThemeRegistrationAny => {
	if (previewTheme === 'light') return lightCodeTheme as unknown as ThemeRegistrationAny
	return codeTheme as unknown as ThemeRegistrationAny
}

const highlightCode = async (code: string, lang: string, previewTheme: PreviewThemeT) => {
	const theme = getCodeTheme(previewTheme)
	const background = (theme as { colors?: { 'editor.background'?: string } }).colors?.['editor.background'] ?? '#0F1110'
	const foreground = (theme as { colors?: { 'editor.foreground'?: string } }).colors?.['editor.foreground'] ?? '#9D9F9E'

	try {
		const result = await codeToTokensBase(code, { lang: lang as never, theme })
		return tokensToCodeBlock({ bg: background, fg: foreground, tokens: result as unknown as ShikiTokenT[][] }, lang)
	} catch {
		const result = await codeToTokensBase(code, { lang: 'text', theme })
		return tokensToCodeBlock({ bg: background, fg: foreground, tokens: result as unknown as ShikiTokenT[][] }, 'text')
	}
}

const visitAsync = async (node: HastNodeT, type: string, visitor: (node: HastElementT) => Promise<void>): Promise<void> => {
	if (node.type === type) await visitor(node as HastElementT)
	for (const child of (node as HastElementT).children ?? []) await visitAsync(child as HastNodeT, type, visitor)
}

const rehypeHighlightCodeBlocks = (previewTheme: PreviewThemeT) => {
	return () => {
		return async (tree: HastNodeT): Promise<void> => {
			await visitAsync(tree, 'element', async (node) => {
				if (node.tagName !== 'pre') return

				const codeNode = node.children.find(
					(child): child is HastElementT =>
						(child as HastElementT).type === 'element' && (child as HastElementT).tagName === 'code'
				)
				if (!codeNode) return

				const code = toText(codeNode).replace(/\r?\n$/, '')
				const lang = getCodeLanguage(codeNode)
				const filename = codeNode.properties?.dataFilename as string | undefined
				const highlighted = await highlightCode(code, lang, previewTheme)

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
}

const rehypeStripTodos = () => {
	return (tree: HastNodeT): void => {
		const stripChildren = (node: HastElementT): void => {
			node.children = node.children.filter((child) => {
				if ((child as HastElementT).type !== 'element') return true
				const childEl = child as HastElementT
				const classNames = (childEl.properties?.className as string[]) ?? []
				if (classNames.includes('zTodo')) return false
				stripChildren(childEl)
				return true
			})
		}
		stripChildren(tree as HastElementT)
	}
}

const createProcessor = (stripTodos: boolean, previewTheme: PreviewThemeT) => {
	const processor = unified()
		.use(remarkParse)
		.use(remarkGfm)
		.use(remarkCustomParagraphs)
		.use(remarkRehype, { allowDangerousHtml: true, handlers: { code: codeHandler as never } })
		.use(rehypeHighlightCodeBlocks(previewTheme) as never)
		.use(rehypeSlug)

	if (stripTodos) processor.use(rehypeStripTodos as never)
	return processor.use(rehypeStringify, { allowDangerousHtml: true })
}

export const renderMarkdown = async (content: string, previewTheme: PreviewThemeT = 'dark'): Promise<string> => {
	const result = await createProcessor(false, previewTheme).process(expandInlineIcons(content))
	return String(result)
}

const renderMarkdownForExport = async (content: string, previewTheme: PreviewThemeT): Promise<string> => {
	const result = await createProcessor(true, previewTheme).process(expandInlineIcons(content))
	return String(result)
}

const escapeHtml = (text: string): string => {
	return text.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;')
}

const FIXED_STEP_RATIOS = [0.579, 0.694, 0.833, 1] as const
const SCALE_STEP_RATIOS: Record<PreviewSettingsT['scale'], readonly number[]> = {
	compact: [1.2, 1.44, 1.728, 2.074, 2.488],
	default: [1.25, 1.563, 1.953, 2.441, 3.052],
	spacious: [1.333, 1.777, 2.369, 3.157, 4.209]
}

const buildSurfaceStyle = (settings: PreviewSettingsT): string => {
	const base = settings.baseFontSize
	const scaleRatios = SCALE_STEP_RATIOS[settings.scale]
	const vars: string[] = [`--base-font-size: ${base}px`]

	for (const [index, ratio] of FIXED_STEP_RATIOS.entries()) vars.push(`--font-size-${index}: ${(base * ratio).toFixed(3)}px`)
	for (const [index, ratio] of scaleRatios.entries()) vars.push(`--font-size-${index + 4}: ${(base * ratio).toFixed(3)}px`)
	return vars.join('; ')
}

export const exportHtml = async (title: string, content: string, settings: PreviewSettingsT): Promise<string> => {
	const bodyHtml = await renderMarkdownForExport(content, settings.theme)
	const baseCss = await readFile(join(process.cwd(), 'app', 'base.css'), 'utf-8')
	const mainCss = await readFile(join(process.cwd(), 'app', 'main.css'), 'utf-8')
	const previewCss = await readFile(join(process.cwd(), 'components', 'PreviewSettings.css'), 'utf-8')
	const circularCss = await readFile(join(process.cwd(), 'components', 'Circular.css'), 'utf-8')
	const globalsCss = `${baseCss}\n${mainCss}\n${previewCss}\n${circularCss}`
	const surfaceAttributes = `data-preview-theme="${settings.theme}" data-preview-font="${settings.font}" data-preview-scale="${settings.scale}"`
	const surfaceStyle = buildSurfaceStyle(settings)

	return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <title>${escapeHtml(title)}</title>
  <link rel="preconnect" href="https://fonts.googleapis.com" />
  <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin />
  <link rel="stylesheet" href="https://fonts.googleapis.com/css2?family=DM+Mono:ital,wght@0,400;0,500&family=DM+Sans:ital,opsz,wght@0,9..40,300;0,9..40,400;0,9..40,500;0,9..40,600;0,9..40,700;0,9..40,900&family=Fraunces:ital,opsz,wght@0,9..144,300;0,9..144,400;0,9..144,500;0,9..144,600;0,9..144,700;1,9..144,300;1,9..144,400;1,9..144,500;1,9..144,600;1,9..144,700&display=swap" />
  <style>${globalsCss}</style>
  <style>
    :root { --font-fraunces: 'Fraunces'; }
    body { padding: 3rem clamp(1.5rem, 8vw, 6rem); }
    .Prose { max-width: 52rem; margin: 0 auto; padding-bottom: 64px; }
  </style>
</head>
<body ${surfaceAttributes} style="${surfaceStyle}">
<div class="Prose">${bodyHtml}</div>
</body>
</html>`
}
