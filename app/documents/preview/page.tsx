'use client'

import { JSX, useEffect, useState } from 'react'
import { DocumentPreview } from '@/components/DocumentPreview'
import { getDocumentIdFromLocation } from '@/lib/documentRoutes'

const DocumentPreviewPage = (): JSX.Element => {
	const [documentId, setDocumentId] = useState('')

	useEffect(() => {
		setDocumentId(getDocumentIdFromLocation())
	}, [])

	if (!documentId) return <div className="HomeEmpty"><p className="HomeEmptyBody">Opening preview…</p></div>
	return <DocumentPreview documentId={documentId} />
}

export default DocumentPreviewPage
