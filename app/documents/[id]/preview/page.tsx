import { DocumentPreview } from '@/components/DocumentPreview'
import type { Id } from '@/convex/_generated/dataModel'
import { JSX } from 'react'

// This will eventually become gated by a documents
// visibility setting, being public or private.
// For now, it requires auth to get this far,
// so it is technically all documents are private
// by default.

type DocumentPreviewPagePropsT = {
	params: Promise<{ id: string }>
}

const DocumentPreviewPage = async (props: DocumentPreviewPagePropsT): Promise<JSX.Element> => {
	const params = await props.params
	const documentId = params.id as Id<'documents'>

	return <DocumentPreview documentId={documentId} />
}

export default DocumentPreviewPage
