import { DocumentEditor } from '@/components/DocumentEditor'
import { JSX } from 'react'

type DocumentPagePropsT = {
	params: Promise<{ id: string }>
}

const DocumentPage = async (props: DocumentPagePropsT): Promise<JSX.Element> => {
	const params = await props.params
	return <DocumentEditor documentId={params.id} />
}

export default DocumentPage
