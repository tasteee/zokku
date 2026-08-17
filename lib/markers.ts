export type MarkerDefinitionT = {
	element?: string
	classes?: string
	attributes?: Record<string, string>
	isAriaHidden?: boolean
	consumeLine?: boolean
	marker?: string
}

const big: MarkerDefinitionT = {
	element: 'p',
	classes: 'zText isLarge'
}

const small: MarkerDefinitionT = {
	element: 'p',
	classes: 'zText isSmall'
}

const muted: MarkerDefinitionT = {
	element: 'p',
	classes: 'zText isMuted'
}

const eyebrow: MarkerDefinitionT = {
	element: 'p',
	classes: 'zText isSmall isSmallCaps zEyebrow'
}

const note: MarkerDefinitionT = {
	element: 'p',
	classes: 'zNoteCallout callout callout-note'
}

const tip: MarkerDefinitionT = {
	element: 'p',
	classes: 'callout callout-tip'
}

const warning: MarkerDefinitionT = {
	element: 'p',
	classes: 'callout callout-warning'
}

const important: MarkerDefinitionT = {
	element: 'p',
	classes: 'callout callout-important'
}

const center: MarkerDefinitionT = {
	element: 'p',
	classes: 'zText isCenteredBlock'
}

const caption: MarkerDefinitionT = {
	element: 'p',
	classes: 'zTextCaption'
}

const todo: MarkerDefinitionT = {
	element: 'p',
	classes: 'zTodo'
}

/**
 * Zokku extensions intentionally follow the GitHub/Obsidian callout shape.
 * Because remark parses the contents of `> ...` as ordinary paragraphs,
 * these markers are matched after Markdown has already handled the blockquote.
 *
 * Preferred syntax:
 *
 * > [!NOTE]
 * > Supporting information.
 *
 * Standard Markdown owns headings (#), rules (---), blockquotes (>), and
 * fenced code blocks (```bash). Zokku does not define competing markers.
 */
export const customMarkers: Record<string, MarkerDefinitionT> = {
	'[!BIG]': big,
	'[!SMALL]': small,
	'[!MUTED]': muted,
	'[!EYEBROW]': eyebrow,
	'[!NOTE]': note,
	'[!TIP]': tip,
	'[!WARNING]': warning,
	'[!IMPORTANT]': important,
	'[!CENTER]': center,
	'[!CAPTION]': caption,
	'[!TODO]': todo,

	// Transitional aliases for existing local documents. New documents should
	// use the blockquote-directive syntax above. Deliberately no legacy H1-H6,
	// LINE, BASH, or QUOTE aliases: standard Markdown replaces those directly.
	'!BIG': big,
	'!SMALL': small,
	'!MUTED': muted,
	'!CAPS': eyebrow,
	'!EYEBROW': eyebrow,
	'!NOTE': note,
	'!TIP': tip,
	'!WARNING': warning,
	'!IMPORTANT': important,
	'!CENTER': center,
	'!CAPTION': caption,
	'!TODO': todo
}

const SPACER_REGEX = /^\!SPACER(\d+)/

export const matchDynamicMarkerDefinition = (value: string): MarkerDefinitionT | null => {
	const spacerMatch = value.match(SPACER_REGEX)
	if (!spacerMatch) return null

	const units = Number.parseInt(spacerMatch[1], 10)

	return {
		marker: spacerMatch[0],
		classes: `zSpacer-${units}`,
		element: 'div',
		isAriaHidden: true,
		consumeLine: true
	}
}
