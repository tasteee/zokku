'use client'

import { JSX, useEffect, useState } from 'react'
import { DocumentEditor } from '@/components/DocumentEditor'
import { getDocumentIdFromLocation } from '@/lib/documentRoutes'

const DocumentEditorPage = (): JSX.Element => {
	const [documentId, setDocumentId] = useState('')

	useEffect(() => {
		setDocumentId(getDocumentIdFromLocation())
	}, [])

	if (!documentId) return <div className="HomeEmpty"><p className="HomeEmptyBody">Opening document…</p></div>
	return <DocumentEditor documentId={documentId} />
}

export default DocumentEditorPage
