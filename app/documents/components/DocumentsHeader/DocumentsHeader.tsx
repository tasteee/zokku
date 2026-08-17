import './DocumentsHeader.css'

import { JSX } from 'react'
import { ZButton } from '@/components/zButton'
import { ZokkuBrand } from '@/components/ZokkuBrand'

type DocumentsHeaderPropsT = {
	onSignOut: () => void
}

export const DocumentsHeader = (props: DocumentsHeaderPropsT): JSX.Element => {
	return (
		<header className="documentsHeader">
			<div className="documentsHeaderBrand">
				<ZokkuBrand />
			</div>

			<div className="documentsHeaderActions">
				<ZButton isSmall isOutlined isNeutral onClick={props.onSignOut}>
					Change workspace
				</ZButton>
			</div>
		</header>
	)
}
