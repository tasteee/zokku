import './ZokkuBrand.css'

import { JSX } from 'react'
import { Link } from 'wouter'

type ZokkuBrandPropsT = {
	isCompact?: boolean
}

export const ZokkuBrand = (props: ZokkuBrandPropsT): JSX.Element => {
	const className = props.isCompact ? 'zokkuBrand isCompact' : 'zokkuBrand'

	return (
		<Link className={className} href="/" aria-label="Zokku home">
			<span className="zokkuBrandMark" aria-hidden="true" />
			<span>Zokku</span>
		</Link>
	)
}
