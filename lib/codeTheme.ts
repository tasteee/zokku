import type { BundledTheme } from 'shiki'

// Using the 'type' field accepted by shiki's ThemeRegistrationRaw
export const codeTheme = {
	name: 'zest-code-theme',
	type: 'dark' as const,
	colors: {
		'editor.background': '#0F1110',
		'editor.foreground': '#9D9F9E'
	},
	tokenColors: [
		{
			scope: ['comment', 'punctuation.definition.comment'],
			settings: { foreground: '#3A3C3B', fontStyle: 'italic' }
		},
		{
			scope: ['storage.type.class.jsdoc', 'punctuation.definition.block.tag.jsdoc'],
			settings: { foreground: '#8878A8', fontStyle: 'italic' }
		},
		{
			scope: ['variable.other.jsdoc'],
			settings: { foreground: '#0F973C', fontStyle: 'italic' }
		},
		{
			scope: ['entity.name.type.instance.jsdoc'],
			settings: { foreground: '#C8B0E0', fontStyle: 'italic' }
		},
		{
			scope: ['keyword', 'keyword.control', 'storage.type', 'storage.modifier'],
			settings: { foreground: '#A898C8' }
		},
		{
			scope: [
				'keyword.operator.new',
				'keyword.operator.delete',
				'keyword.operator.expression.typeof',
				'keyword.operator.expression.instanceof',
				'keyword.operator.expression.void',
				'keyword.operator.expression.in',
				'keyword.operator.expression.of',
				'keyword.operator.expression.as',
				'keyword.operator.expression.is',
				'keyword.operator.expression.keyof',
				'keyword.operator.expression.satisfies'
			],
			settings: { foreground: '#A898C8' }
		},
		{
			scope: ['variable.language.this', 'variable.language.super'],
			settings: { foreground: '#A898C8', fontStyle: 'italic' }
		},
		{
			scope: [
				'keyword.operator',
				'keyword.operator.arithmetic',
				'keyword.operator.assignment',
				'keyword.operator.comparison',
				'keyword.operator.logical',
				'keyword.operator.ternary',
				'keyword.operator.optional',
				'keyword.operator.spread',
				'keyword.operator.rest',
				'keyword.operator.type',
				'storage.type.function.arrow'
			],
			settings: { foreground: '#515352' }
		},
		{
			scope: [
				'punctuation',
				'punctuation.separator',
				'punctuation.terminator',
				'punctuation.accessor',
				'punctuation.definition.block',
				'punctuation.definition.parameters',
				'punctuation.definition.dict',
				'punctuation.definition.dictionary',
				'punctuation.definition.object',
				'punctuation.definition.array',
				'punctuation.section.embedded',
				'punctuation.definition.tag',
				'punctuation.definition.template-expression',
				'meta.brace.curly',
				'meta.brace.square',
				'meta.brace.round'
			],
			settings: { foreground: '#515352' }
		},
		{
			scope: [
				'entity.name.type',
				'entity.name.class',
				'entity.name.interface',
				'entity.other.inherited-class',
				'support.type',
				'entity.name.type.alias',
				'entity.name.type.enum',
				'entity.name.type.module',
				'support.type.primitive',
				'keyword.type',
				'entity.name.type.predefined',
				'support.class'
			],
			settings: { foreground: '#C8B0E0' }
		},
		{
			scope: ['meta.type.parameters entity.name.type', 'entity.name.type.type-parameter'],
			settings: { foreground: '#8878A8', fontStyle: 'italic' }
		},
		{
			scope: ['meta.decorator', 'entity.name.function.decorator', 'punctuation.decorator'],
			settings: { foreground: '#D078A8', fontStyle: 'bold italic' }
		},
		{
			scope: ['entity.name.function', 'meta.function entity.name.function'],
			settings: { foreground: '#B0EDB8' }
		},
		{
			scope: ['meta.function-call entity.name.function', 'meta.function-call.generic entity.name.function'],
			settings: { foreground: '#4FD168', fontStyle: 'bold' }
		},
		{
			scope: ['support.function', 'support.function.builtin'],
			settings: { foreground: '#4FD168', fontStyle: 'bold' }
		},
		{
			scope: ['variable', 'variable.other'],
			settings: { foreground: '#93E49E' }
		},
		{
			scope: ['variable.parameter'],
			settings: { foreground: '#0F973C', fontStyle: 'italic' }
		},
		{
			scope: ['variable.other.property', 'meta.object-literal.key', 'meta.object.member', 'meta.object-literal.key string'],
			settings: { foreground: '#C8A878' }
		},
		{
			scope: ['variable.other.constant', 'support.constant'],
			settings: { foreground: '#E0C898' }
		},
		{
			scope: [
				'constant.language',
				'constant.language.boolean',
				'constant.language.null',
				'constant.language.undefined',
				'constant.language.nan'
			],
			settings: { foreground: '#838584' }
		},
		{
			scope: ['variable.other.enummember'],
			settings: { foreground: '#C8A878' }
		},
		{
			scope: ['string', 'string.quoted'],
			settings: { foreground: '#515352' }
		},
		{
			scope: ['constant.character.escape'],
			settings: { foreground: '#838584' }
		},
		{
			scope: ['string.regexp', 'constant.regexp'],
			settings: { foreground: '#838584' }
		},
		{
			scope: [
				'keyword.operator.quantifier.regexp',
				'keyword.operator.or.regexp',
				'punctuation.definition.group.regexp',
				'keyword.operator.negation.regexp'
			],
			settings: { foreground: '#A898C8' }
		},
		{
			scope: ['constant.numeric'],
			settings: { foreground: '#A89068' }
		},
		{
			scope: ['entity.name.tag.html.tsx', 'entity.name.tag.html.jsx', 'entity.name.tag'],
			settings: { foreground: '#A898C8' }
		},
		{
			scope: ['support.class.component', 'entity.name.tag.tsx', 'entity.name.tag.jsx'],
			settings: { foreground: '#C8B0E0' }
		},
		{
			scope: ['entity.other.attribute-name'],
			settings: { foreground: '#C8A878' }
		},
		{
			scope: ['string.quoted.double.html', 'string.quoted.single.html'],
			settings: { foreground: '#515352' }
		}
	]
} satisfies Record<string, unknown>
