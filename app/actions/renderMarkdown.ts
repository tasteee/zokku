import { unified } from 'unified'
import remarkParse from 'remark-parse'
import remarkGfm from 'remark-gfm'
import remarkRehype from 'remark-rehype'
import rehypeSlug from 'rehype-slug'
import rehypeStringify from 'rehype-stringify'
import { codeToTokensBase } from 'shiki'
import type { ThemeRegistrationAny } from '@shikijs/types'
import { customMarkers, matchDynamicMarkerDefinition, STAT_MARKER_REGEX } from '@/lib/markers'
import type { MarkerDefinitionT } from '@/lib/markers'
import { codeTheme } from '@/lib/codeTheme'
import { lightCodeTheme } from '@/lib/lightCodeTheme'
import type { PreviewThemeT } from '@/components/previewSettings'

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
type ShikiTokenT = { content: string; color?: string; fontStyle?: number }
type Text = { type: 'text'; value: string }
type Code = { type: 'code'; value: string; lang?: string | null; meta?: string | null }
type Paragraph = { type: 'paragraph'; children: MdastNode[]; data?: Record<string, unknown> }
type Root = { type: 'root'; children: MdastNode[] }
type MdastNode = Root | Paragraph | { type: string; children?: MdastNode[]; data?: Record<string, unknown> }

type ParagraphLineT = { children: MdastNode[]; separator: 'soft' | 'hard' }
type StatRowT = { type: 'statRow'; data: Record<string, unknown>; children: MdastNode[] }

const STAT_ROW_TYPE = 'statRow'

const asMdastNode = (node: unknown): MdastNode => node as MdastNode

const lineSeparatorNode = (separator: 'soft' | 'hard'): MdastNode =>
	asMdastNode(separator === 'hard' ? { type: 'break' } : { type: 'text', value: '\n' })

const startsStatLine = (children: MdastNode[]): boolean => {
	const first = children[0]
	return first?.type === 'text' && STAT_MARKER_REGEX.test((first as Text).value)
}

/* A paragraph holds every line up to the next blank line, so consecutive stat markers arrive as
   one paragraph. Split it back apart at the line breaks that begin a new stat, and only there —
   a stat's own value and label lines must stay together. */
const splitStatLines = (node: Paragraph): Paragraph[] => {
	const lines: ParagraphLineT[] = [{ children: [], separator: 'soft' }]
	for (const child of node.children) {
		if (child.type === 'break') {
			lines.push({ children: [], separator: 'hard' })
			continue
		}
		if (child.type !== 'text') {
			lines[lines.length - 1].children.push(child)
			continue
		}
		const parts = (child as Text).value.split('\n')
		for (const [index, part] of parts.entries()) {
			if (index > 0) lines.push({ children: [], separator: 'soft' })
			if (part.length > 0) lines[lines.length - 1].children.push(asMdastNode({ type: 'text', value: part }))
		}
	}

	const groups: ParagraphLineT[][] = []
	for (const line of lines) {
		if (line.children.length === 0) continue
		if (groups.length === 0 || startsStatLine(line.children)) groups.push([line])
		else groups[groups.length - 1].push(line)
	}
	if (groups.length < 2) return [node]

	return groups.map((group) => ({
		type: 'paragraph',
		children: group.flatMap((line, index) => (index === 0 ? line.children : [lineSeparatorNode(line.separator), ...line.children]))
	}))
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

const applyParagraphMarker = (node: Paragraph): void => {
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
}

const isInlineStat = (node: MdastNode): boolean => {
	const data = (node as { data?: Record<string, unknown> }).data
	const className = (data?.hProperties as Record<string, unknown> | undefined)?.className
	return typeof className === 'string' && className.split(/\s+/).includes('isInline')
}

/* A blockquote holding nothing but inline stats joins the surrounding row, so the `>` form of the
   marker lines up the same way the bare form does. */
const unwrapQuotedStats = (node: MdastNode): MdastNode[] | null => {
	if (node.type !== 'blockquote') return null
	const children = (node.children ?? []) as MdastNode[]
	if (children.length !== 1 || children[0].type !== STAT_ROW_TYPE) return null
	return (children[0] as StatRowT).children
}

/* Adjacent inline stats share one flex row so they sit side by side and wrap together. */
const groupInlineStats = (children: MdastNode[]): MdastNode[] => {
	const grouped: MdastNode[] = []
	for (const child of children) {
		const stats = isInlineStat(child) ? [child] : unwrapQuotedStats(child)
		if (!stats) {
			grouped.push(child)
			continue
		}
		const previous = grouped[grouped.length - 1]
		if (previous?.type === STAT_ROW_TYPE) {
			(previous as StatRowT).children.push(...stats)
			continue
		}
		grouped.push(asMdastNode({
			type: STAT_ROW_TYPE,
			data: { hName: 'div', hProperties: { className: 'zStatRow' } },
			children: stats
		}))
	}
	return grouped
}

const transformParent = (node: MdastNode): void => {
	const children = node.children as MdastNode[] | undefined
	if (!children) return
	const expanded: MdastNode[] = []
	for (const child of children) {
		if (child.type === 'paragraph') {
			const paragraphs = splitStatLines(child as Paragraph)
			for (const paragraph of paragraphs) applyParagraphMarker(paragraph)
			expanded.push(...(paragraphs as MdastNode[]))
			continue
		}
		transformParent(child)
		expanded.push(child)
	}
	;(node as { children: MdastNode[] }).children = groupInlineStats(expanded)
}

const remarkCustomParagraphs = () => (tree: Root): void => {
	transformParent(tree as MdastNode)
}

const getCodeFilename = (meta: string | null | undefined): string => {
	if (!meta) return ''
	const filenameMatch = meta.match(/(?:^|\s)(?:filename|file|title)=("([^"]+)"|'([^']+)'|(\S+))/)
	if (filenameMatch) return filenameMatch[2] ?? filenameMatch[3] ?? filenameMatch[4] ?? ''
	const firstToken = meta.trim().split(/\s+/)[0]
	return firstToken.includes('.') || firstToken.includes('/') || firstToken.includes('\\') ? firstToken : ''
}

const codeHandler = (state: HandlerStateT, node: Code): HastElementT => {
	const properties: Record<string, unknown> = {}
	const language = node.lang ? node.lang.split(/\s+/) : []
	const filename = getCodeFilename(node.meta)
	if (language.length > 0) properties.className = [`language-${language[0]}`]
	if (filename) properties.dataFilename = filename
	let codeEl: HastElementT = { type: 'element', tagName: 'code', properties, children: [{ type: 'text', value: node.value ?? '' }] }
	if (node.meta) codeEl.data = { meta: node.meta }
	state.patch(node, codeEl)
	codeEl = state.applyData(node, codeEl)
	const preEl: HastElementT = { type: 'element', tagName: 'pre', properties: {}, children: [codeEl] }
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
	const tokens = result.tokens.filter((line, index) => !(index === result.tokens.length - 1 && line.length === 0))
	const children: (HastElementT | HastTextNodeT)[] = tokens.flatMap((line, index) => {
		const lineEl: HastElementT = {
			type: 'element', tagName: 'span', properties: { className: ['line'] },
			children: line.map((token): HastElementT => ({ type: 'element', tagName: 'span', properties: { className: ['token'], style: tokenStyle(token) }, children: [{ type: 'text', value: token.content }] }))
		}
		return index === tokens.length - 1 ? [lineEl] : [lineEl, { type: 'text', value: '\n' }]
	})
	return { bg: result.bg, fg: result.fg, lang, children }
}

const getCodeTheme = (previewTheme: PreviewThemeT): ThemeRegistrationAny => previewTheme === 'light' ? lightCodeTheme as unknown as ThemeRegistrationAny : codeTheme as unknown as ThemeRegistrationAny

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

const rehypeHighlightCodeBlocks = (previewTheme: PreviewThemeT) => () => async (tree: HastNodeT): Promise<void> => {
	await visitAsync(tree, 'element', async (node) => {
		if (node.tagName !== 'pre') return
		const codeNode = node.children.find((child): child is HastElementT => (child as HastElementT).type === 'element' && (child as HastElementT).tagName === 'code')
		if (!codeNode) return
		const highlighted = await highlightCode(toText(codeNode).replace(/\r?\n$/, ''), getCodeLanguage(codeNode), previewTheme)
		const filename = codeNode.properties?.dataFilename as string | undefined
		node.properties = { ...node.properties, className: ['zCodeBlock'], style: `--code-bg: ${highlighted.bg}; --code-fg: ${highlighted.fg};` }
		const filenameEl: HastElementT = { type: 'element', tagName: 'div', properties: { className: ['zCodeFilename'] }, children: [{ type: 'text', value: filename ?? '' }] }
		const highlightedCodeEl: HastElementT = { type: 'element', tagName: 'code', properties: { className: ['zCode', `language-${highlighted.lang}`], 'data-language': highlighted.lang }, children: highlighted.children }
		node.children = [...(filename ? [filenameEl] : []), highlightedCodeEl]
	})
}

const rehypeStripTodos = () => (tree: HastNodeT): void => {
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

export const renderMarkdown = async (content: string, previewTheme: PreviewThemeT = 'dark'): Promise<string> => String(await createProcessor(false, previewTheme).process(content))

export const renderMarkdownForExport = async (content: string, previewTheme: PreviewThemeT): Promise<string> => String(await createProcessor(true, previewTheme).process(content))
