type CommonColorPropNamesT = 'isNeutral' | 'isPrimary' | 'isPurple' | 'isPink'
type CommonSizePropNamesT = 'isSmall' | 'isMedium' | 'isLarge'
type CommonKindPropNamesT = 'isGhost' | 'isOutlined' | 'isSolid'

type FontWeightPropNamesT = 'isThin' | 'isNormal' | 'isBold' | 'isVeryBold'
type FontStylePropNamesT = 'isItalic' | 'isUnderlined'
type FontSizePropNamesT = 'isExtraSmall' | CommonSizePropNamesT | 'isExtraLarge'

declare namespace FontT {
	export type ColorPropNames = CommonColorPropNamesT
	export type SizePropNames = FontSizePropNamesT
	export type WeightPropNames = FontWeightPropNamesT
	export type StylePropNames = FontStylePropNamesT
}
