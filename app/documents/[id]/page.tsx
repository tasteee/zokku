import { DocumentEditor } from '@/components/DocumentEditor'
import type { Id } from '@/convex/_generated/dataModel'

type DocumentPagePropsT = {
	params: Promise<{ id: string }>
}

const DocumentPage = async (props: DocumentPagePropsT): Promise<JSX.Element> => {
	const params = await props.params
	const documentId = params.id as Id<'documents'>

	return <DocumentEditor documentId={documentId} />
}

export default DocumentPage
