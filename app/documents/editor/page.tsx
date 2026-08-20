import { JSX } from 'react'
import { useSearch } from 'wouter'
import { DocumentEditor } from '@/components/DocumentEditor'

const DocumentEditorPage = (): JSX.Element => {
	// Read reactively: following a link between documents keeps this route and
	// only swaps `?id=`, so a mount-only read would leave the old one open.
	const documentId = new URLSearchParams(useSearch()).get('id') ?? ''

	if (!documentId) return <div className="HomeEmpty"><p className="HomeEmptyBody">Opening document…</p></div>
	return <DocumentEditor documentId={documentId} />
}

export default DocumentEditorPage
