import { DocumentPreview } from '@/components/DocumentPreview'
import type { Id } from '@/convex/_generated/dataModel'
import { JSX } from 'react'

type DocumentPreviewPagePropsT = {
	params: Promise<{ id: string }>
}

const DocumentPreviewPage = async (props: DocumentPreviewPagePropsT): Promise<JSX.Element> => {
	const params = await props.params
	const documentId = params.id as Id<'documents'>

	return <DocumentPreview documentId={documentId} />
}

export default DocumentPreviewPage
