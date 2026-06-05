export type MarkerDefinitionT = {
	element?: string
	classes?: string
	attributes?: Record<string, string>
	isAriaHidden?: boolean
	consumeLine?: boolean
	marker?: string
}

export const customMarkers: Record<string, MarkerDefinitionT> = {
	'!BIG': {
		element: 'p',
		classes: 'zText isLarge'
	},
	'!SMALL': {
		element: 'p',
		classes: 'zText isSmall'
	},
	'!CAPS': {
		element: 'p',
		classes: 'zText isSmall isSmallCaps'
	},
	'!NOTE': {
		element: 'p',
		classes: 'zNoteCallout callout callout-note'
	},
	'!LINE': {
		element: 'hr',
		classes: 'zDivider'
	},
	'!TIP': {
		element: 'p',
		classes: 'callout callout-tip'
	},
	'!WARNING': {
		element: 'p',
		classes: 'callout callout-warning'
	},
	'!CENTER': {
		element: 'p',
		classes: 'zText isCenteredBlock'
	},
	'!CAPTION': {
		element: 'p',
		classes: 'zTextCaption'
	},
	'!H1': {
		element: 'h1',
		classes: 'zTextH1'
	},
	'!H2': {
		element: 'h2',
		classes: 'zTextH2'
	},
	'!H3': {
		element: 'h3',
		classes: 'zTextH3'
	},
	'!H4': {
		element: 'h4',
		classes: 'zTextH4'
	},
	'!H5': {
		element: 'h5',
		classes: 'zTextH5'
	},
	'!H6': {
		element: 'h6',
		classes: 'zTextH6'
	},
	'!BASH': {
		element: 'pre',
		classes: 'zCodeBash',
		attributes: {
			'data-language': 'bash'
		}
	},
	'!QUOTE': {
		element: 'blockquote',
		classes: 'zQuote'
	},
	'!TODO': {
		element: 'p',
		classes: 'zTodo'
	}
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
