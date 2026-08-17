'use client'

import './DocumentPreview.css'
import { useRouter } from 'next/navigation'
import { JSX, useEffect, useState } from 'react'
import { renderMarkdown } from '@/app/actions/renderMarkdown'
import { ZButton } from '@/components/zButton'
import { CaretLeftIcon } from '@phosphor-icons/react'
import { getDocument, restoreWorkspace, type LocalDocumentT } from '@/lib/localWorkspace'

type DocumentPreviewPropsT = {
	documentId: string
}

export const DocumentPreview = (props: DocumentPreviewPropsT): JSX.Element => {
	const router = useRouter()
	const [document, setDocument] = useState<LocalDocumentT | null | undefined>(undefined)
	const [previewHtml, setPreviewHtml] = useState('')

	useEffect(() => {
		let isCurrent = true
		const load = async (): Promise<void> => {
			const workspace = await restoreWorkspace(false)
			if (workspace === null) {
				router.replace('/')
				return
			}
			const nextDocument = await getDocument(props.documentId)
			if (!isCurrent) return
			setDocument(nextDocument)
			if (nextDocument !== null) setPreviewHtml(await renderMarkdown(nextDocument.content))
		}
		void load()
		return () => {
			isCurrent = false
		}
	}, [props.documentId, router])

	if (document === null) {
		return <div className="HomeEmpty"><h1 className="HomeEmptyTitle">Document not found</h1><p className="HomeEmptyBody">The Markdown file may have been moved or deleted.</p><ZButton label="Back to documents" onClick={() => router.push('/documents')} /></div>
	}
	if (document === undefined) return <div className="HomeEmpty"><p className="HomeEmptyBody">Loading local preview…</p></div>

	return (
		<div className="DocumentPreviewShell">
			<div className="Topbar">
				<button className="TopbarBackButton" onClick={() => router.push(`/documents/${props.documentId}`)} title="Back to editor"><CaretLeftIcon size={18} weight="bold" /></button>
				<span className="TopbarTitle">{document.title || 'Untitled'}</span>
			</div>
			<div className="DocumentPreviewContent"><div className="Prose" dangerouslySetInnerHTML={{ __html: previewHtml }} /></div>
		</div>
	)
}
