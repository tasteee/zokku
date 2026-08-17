import './DocumentsHeader.css'
import { JSX } from 'react'
import { ZButton } from '@/components/zButton'

type DocumentsHeaderPropsT = {
	onSignOut: () => void
}

export const DocumentsHeader = (props: DocumentsHeaderPropsT): JSX.Element => {
	return (
		<header className="documentsHeader">
			<span className="documentsHeaderBrand">
				<span className="documentsHeaderBrandDot" />
				Zokku
			</span>

			<div className="documentsHeaderActions">
				<ZButton isSmall isOutlined isNeutral onClick={props.onSignOut}>
					Change workspace
				</ZButton>
			</div>
		</header>
	)
}
