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

const subheading: MarkerDefinitionT = {
	element: 'p',
	classes: 'zSubheading'
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

export const customMarkers: Record<string, MarkerDefinitionT> = {
	'[!BIG]': big,
	'[!SMALL]': small,
	'[!MUTED]': muted,
	'[!EYEBROW]': eyebrow,
	'[!SUBHEADING]': subheading,
	'[!NOTE]': note,
	'[!TIP]': tip,
	'[!WARNING]': warning,
	'[!IMPORTANT]': important,
	'[!CENTER]': center,
	'[!CAPTION]': caption,
	'[!TODO]': todo,

	// Transitional aliases for existing local documents.
	'!BIG': big,
	'!SMALL': small,
	'!MUTED': muted,
	'!CAPS': eyebrow,
	'!EYEBROW': eyebrow,
	'!SUBHEADING': subheading,
	'!NOTE': note,
	'!TIP': tip,
	'!WARNING': warning,
	'!IMPORTANT': important,
	'!CENTER': center,
	'!CAPTION': caption,
	'!TODO': todo
}

const SPACER_REGEX = /^\!SPACER(\d+)/
const EYEBROW_FULL_REGEX = /^\[!EYEBROW\s+FULL\]/i
const STAT_REGEX = /^\[!STAT((?:\s+(?:TOP|BOTTOM|FULL|INLINE))*)\]/i

export const STAT_MARKER_REGEX = /^\[!STAT(?:\s+(?:TOP|BOTTOM|FULL|INLINE))*\]/i

export const matchDynamicMarkerDefinition = (value: string): MarkerDefinitionT | null => {
	const eyebrowFullMatch = value.match(EYEBROW_FULL_REGEX)
	if (eyebrowFullMatch) {
		return {
			marker: eyebrowFullMatch[0],
			classes: 'zText isSmall isSmallCaps zEyebrow isFullRule',
			element: 'p'
		}
	}

	const statMatch = value.match(STAT_REGEX)
	if (statMatch) {
		const modifiers = (statMatch[1] ?? '').toUpperCase().split(/\s+/).filter(Boolean)
		const position = modifiers.includes('TOP') ? 'isLabelTop' : 'isLabelBottom'
		const inline = modifiers.includes('FULL') ? '' : ' isInline'
		return {
			marker: statMatch[0],
			classes: `zStat ${position}${inline}`,
			element: 'p'
		}
	}

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
