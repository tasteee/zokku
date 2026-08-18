import './DocumentsHeader.css'

import { JSX } from 'react'
import { ZokkuBrand } from '@/components/ZokkuBrand'

export const DocumentsHeader = (): JSX.Element => {
	return (
		<header className="documentsHeader">
			<div className="documentsHeaderBrand">
				<ZokkuBrand />
			</div>
		</header>
	)
}
