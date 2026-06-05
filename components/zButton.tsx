import React from 'react'
import { cn } from '@/lib/utils'
import { prop } from '@/lib/prop'
import './zButton.css'

type ZColorSwitchPropsT = 'isNeutral' | 'isPurple' | 'isPink' | 'isRed'
type ZButtonSizePropsT = 'isExtraSmall' | 'isSmall' | 'isMedium' | 'isLarge' | 'isExtraLarge' | 'isIcon'
type ZButtonKindPropsT = 'isGhost' | 'isOutlined' | 'isSolid'

type ZButtonOtherPropsT = {
	isHidden?: boolean
	isDisabled?: boolean
	isLoading?: boolean
	label?: string
}

type ZButtonPropsT = Omit<React.ButtonHTMLAttributes<HTMLButtonElement>, 'color'> &
	Omit<ComponentPropsT, 'color'> &
	ZeroOrOneTruePropT<ZColorSwitchPropsT> &
	ZeroOrOneTruePropT<ZButtonSizePropsT> &
	ZeroOrOneTruePropT<ZButtonKindPropsT> &
	ZButtonOtherPropsT

const CUSTOM_PROPS = [
	'isNeutral',
	'isPurple',
	'isPink',
	'isRed',
	'isExtraSmall',
	'isSmall',
	'isMedium',
	'isLarge',
	'isExtraLarge',
	'isIcon',
	'isGhost',
	'isOutlined',
	'isSolid',
	'isHidden',
	'isDisabled',
	'isLoading',
	'label',
	'className',
	'children',
	'testId',
	'type',
	'as'
]

const getColorClass = prop.classNameSwitch({
	isPurple: 'isPurple',
	isPink: 'isPink',
	isRed: 'isRed',
	isNeutral: 'isNeutral',
	default: 'isNeutral'
})

const getSizeClass = prop.classNameSwitch({
	isExtraSmall: 'isExtraSmall',
	isSmall: 'isSmall',
	isMedium: 'isMedium',
	isLarge: 'isLarge',
	isExtraLarge: 'isExtraLarge',
	isIcon: 'isIcon',
	default: 'isMedium'
})

const getKindClass = prop.classNameSwitch({
	isGhost: 'isGhost',
	isOutlined: 'isOutlined',
	isSolid: 'isSolid',
	default: 'isOutlined'
})

const getStyleClass = prop.classNamesBuilder({
	isDisabled: 'isDisabled',
	isHidden: 'isHidden',
	isLoading: 'isLoading'
})

const getSplitProps = prop.splitter(CUSTOM_PROPS)

const ZButton = React.forwardRef<HTMLButtonElement, ZButtonPropsT>((props, ref) => {
	const [customProps, otherProps] = getSplitProps(props)
	const colorClass = getColorClass(customProps)
	const sizeClass = getSizeClass(customProps)
	const kindClass = getKindClass(customProps)
	const styleClass = getStyleClass(customProps)
	const classNames = cn('zButton', kindClass, colorClass, sizeClass, styleClass, customProps.className)
	const buttonProps = otherProps as React.ButtonHTMLAttributes<HTMLButtonElement>
	const isButtonDisabled = props.disabled || customProps.isDisabled || customProps.isLoading
	const buttonType = customProps.type ?? 'button'
	const buttonContent = customProps.label ?? props.children

	return (
		<button
			{...buttonProps}
			ref={ref}
			className={classNames}
			data-testid={customProps.testId}
			disabled={isButtonDisabled}
			type={buttonType}
		>
			{customProps.isLoading ? <span className="zButtonSpinner" aria-hidden /> : null}
			{buttonContent}
		</button>
	)
})

ZButton.displayName = 'ZButton'

export { ZButton }
export type { ZButtonPropsT }
