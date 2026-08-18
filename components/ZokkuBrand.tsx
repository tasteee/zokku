import './ZokkuBrand.css'

import { JSX } from 'react'

type ZokkuBrandPropsT = {
	isCompact?: boolean
}

export const ZokkuBrand = (props: ZokkuBrandPropsT): JSX.Element => {
	const className = props.isCompact ? 'zokkuBrand isCompact' : 'zokkuBrand'

	return (
		<span className={className}>
			<span className="zokkuBrandMark" aria-hidden="true" />
			<span>Zokku</span>
		</span>
	)
}
