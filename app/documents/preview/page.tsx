import { JSX } from 'react'
import { useSearch } from 'wouter'
import { DocumentPreview } from '@/components/DocumentPreview'

const DocumentPreviewPage = (): JSX.Element => {
	// Read reactively: following a link between documents keeps this route and
	// only swaps `?id=`, so a mount-only read would leave the old one open.
	const documentId = new URLSearchParams(useSearch()).get('id') ?? ''

	if (!documentId) return <div className="HomeEmpty"><p className="HomeEmptyBody">Opening preview…</p></div>
	return <DocumentPreview documentId={documentId} />
}

export default DocumentPreviewPage
