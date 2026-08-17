import { DocumentPreview } from '@/components/DocumentPreview'
import { JSX } from 'react'

type DocumentPreviewPagePropsT = {
	params: Promise<{ id: string }>
}

const DocumentPreviewPage = async (props: DocumentPreviewPagePropsT): Promise<JSX.Element> => {
	const params = await props.params
	return <DocumentPreview documentId={params.id} />
}

export default DocumentPreviewPage
