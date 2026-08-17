export const lightCodeTheme = {
	name: 'zokku-light-code-theme',
	type: 'light' as const,
	colors: {
		'editor.background': '#FBFBFD',
		'editor.foreground': '#2F3047'
	},
	tokenColors: [
		{
			scope: ['comment', 'punctuation.definition.comment'],
			settings: { foreground: '#8A8B9E', fontStyle: 'italic' }
		},
		{
			scope: ['keyword', 'keyword.control', 'storage.type', 'storage.modifier'],
			settings: { foreground: '#5A32A3', fontStyle: 'bold' }
		},
		{
			scope: ['keyword.operator', 'punctuation', 'punctuation.separator', 'punctuation.terminator'],
			settings: { foreground: '#72738A' }
		},
		{
			scope: ['entity.name.type', 'entity.name.class', 'entity.name.interface', 'support.type', 'keyword.type'],
			settings: { foreground: '#00004E' }
		},
		{
			scope: ['entity.name.function', 'meta.function-call entity.name.function', 'support.function', 'support.function.builtin'],
			settings: { foreground: '#235AE4' }
		},
		{
			scope: ['variable', 'variable.other'],
			settings: { foreground: '#3F4059' }
		},
		{
			scope: ['variable.parameter'],
			settings: { foreground: '#68697F', fontStyle: 'italic' }
		},
		{
			scope: ['variable.other.property', 'meta.object-literal.key', 'entity.other.attribute-name'],
			settings: { foreground: '#9A4E12' }
		},
		{
			scope: ['string', 'string.quoted'],
			settings: { foreground: '#176B53' }
		},
		{
			scope: ['constant.character.escape', 'string.regexp', 'constant.regexp'],
			settings: { foreground: '#A13D6C' }
		},
		{
			scope: ['constant.numeric'],
			settings: { foreground: '#B13C74' }
		},
		{
			scope: ['constant.language', 'constant.language.boolean', 'constant.language.null', 'constant.language.undefined'],
			settings: { foreground: '#7C3FA0', fontStyle: 'bold' }
		},
		{
			scope: ['entity.name.tag', 'entity.name.tag.html.tsx', 'entity.name.tag.html.jsx'],
			settings: { foreground: '#235AE4' }
		},
		{
			scope: ['support.class.component', 'entity.name.tag.tsx', 'entity.name.tag.jsx'],
			settings: { foreground: '#5A32A3' }
		},
		{
			scope: ['meta.decorator', 'entity.name.function.decorator', 'punctuation.decorator'],
			settings: { foreground: '#A13D6C', fontStyle: 'italic' }
		}
	]
} satisfies Record<string, unknown>
