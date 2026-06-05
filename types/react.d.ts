type ComponentPropsT = React.HTMLAttributes<HTMLElement> & {
	as?: React.ElementType
	children?: React.ReactNode
	className?: string
	style?: React.CSSProperties
	asChild?: boolean
}

type CommonPropsT = {
	id?: string
	isHidden?: boolean
	className?: string
	testid?: string
	['data-testid']?: string
	style?: React.CSSProperties
}
