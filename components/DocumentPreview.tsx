'use client'

import { useQuery } from 'convex/react'
import { useRouter } from 'next/navigation'
import { useState, useEffect, JSX } from 'react'
import { api } from '@/convex/_generated/api'
import type { Id } from '@/convex/_generated/dataModel'
import { renderMarkdown } from '@/app/actions/renderMarkdown'
import { ZButton } from '@/components/zButton'
import { CaretLeftIcon } from '@phosphor-icons/react'

type DocumentPreviewPropsT = {
	documentId: Id<'documents'>
}

export const DocumentPreview = (props: DocumentPreviewPropsT): JSX.Element => {
	const document = useQuery(api.documents.get, { id: props.documentId })
	const router = useRouter()

	const [previewHtml, setPreviewHtml] = useState('')

	useEffect(() => {
		const isLoaded = document !== undefined && document !== null
		if (!isLoaded) return

		const renderContent = async (): Promise<void> => {
			const html = await renderMarkdown(document.content)
			setPreviewHtml(html)
		}

		renderContent()
	}, [document])

	const isDocumentMissing = document === null

	if (isDocumentMissing) {
		return (
			<div className="HomeEmpty">
				<h1 className="HomeEmptyTitle">Document not found</h1>
				<p className="HomeEmptyBody">This document may have been deleted.</p>
				<ZButton label="Back to documents" onClick={() => router.push('/documents')} />
			</div>
		)
	}

	const isLoading = document === undefined

	if (isLoading) {
		return (
			<div className="HomeEmpty">
				<p className="HomeEmptyBody">Loading...</p>
			</div>
		)
	}

	return (
		<div className="DocumentPreviewShell">
			<div className="Topbar">
				<button
					className="TopbarBackButton"
					onClick={() => router.push(`/documents/${props.documentId}`)}
					title="Back to editor"
				>
					<CaretLeftIcon size={18} weight="bold" />
				</button>
				<span className="TopbarTitle">{document.title || 'Untitled'}</span>
			</div>
			<div className="DocumentPreviewContent">
				<div className="Prose" dangerouslySetInnerHTML={{ __html: previewHtml }} />
			</div>
		</div>
	)
}
