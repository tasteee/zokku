export const lightCodeTheme = {
	name: 'zokku-light-code-theme',
	type: 'light' as const,
	colors: {
		'editor.background': '#f7f8fa',
		'editor.foreground': '#484861'
	},
	tokenColors: [
		{ scope: ['comment', 'punctuation.definition.comment'], settings: { foreground: '#7b7c8f', fontStyle: 'italic' } },
		{ scope: ['keyword', 'keyword.control', 'storage.type', 'storage.modifier'], settings: { foreground: '#6b2fb8' } },
		{ scope: ['entity.name.type', 'entity.name.class', 'entity.name.interface', 'support.type', 'keyword.type'], settings: { foreground: '#00004e' } },
		{ scope: ['entity.name.function', 'support.function', 'support.function.builtin'], settings: { foreground: '#235ae4' } },
		{ scope: ['variable', 'variable.other'], settings: { foreground: '#265d57' } },
		{ scope: ['variable.parameter'], settings: { foreground: '#5e6175', fontStyle: 'italic' } },
		{ scope: ['variable.other.property', 'entity.other.attribute-name'], settings: { foreground: '#8a4b08' } },
		{ scope: ['string', 'string.quoted'], settings: { foreground: '#3f6f3a' } },
		{ scope: ['constant.numeric'], settings: { foreground: '#9a3f75' } },
		{ scope: ['constant.language', 'constant.language.boolean', 'constant.language.null', 'constant.language.undefined'], settings: { foreground: '#8c2d55' } },
		{ scope: ['entity.name.tag'], settings: { foreground: '#235ae4' } },
		{ scope: ['keyword.operator', 'punctuation', 'punctuation.separator', 'punctuation.terminator'], settings: { foreground: '#67687d' } }
	]
} satisfies Record<string, unknown>
