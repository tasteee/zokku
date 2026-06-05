'use client'

import { useMutation } from 'convex/react'
import { useRouter } from 'next/navigation'
import { api } from '@/convex/_generated/api'

const DocumentsPage = (): JSX.Element => {
	const createDocument = useMutation(api.documents.create)
	const router = useRouter()

	const handleCreate = async (): Promise<void> => {
		const documentId = await createDocument()
		router.push(`/documents/${documentId}`)
	}

	return (
		<div className="HomeEmpty">
			<h1 className="HomeEmptyTitle">No document open</h1>
			<p className="HomeEmptyBody">Select a document from the sidebar, or create a new one to start writing.</p>
			<button className="HomeEmptyButton" onClick={handleCreate}>
				New document
			</button>
		</div>
	)
}

export default DocumentsPage
