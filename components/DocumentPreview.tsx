'use client'

import './DocumentPreview.css'
import { useRouter } from 'next/navigation'
import { JSX, useEffect, useState } from 'react'
import { renderMarkdown } from '@/app/actions/renderMarkdown'
import { ZButton } from '@/components/zButton'
import { CaretLeftIcon } from '@phosphor-icons/react'
import { listWorkspace, restoreWorkspace } from '@/lib/localWorkspace'
import type { LocalDocumentT } from '@/lib/localWorkspace'
import { resolveDocumentHref } from '@/lib/documentLinks'

type DocumentPreviewPropsT = {
	documentId: string
}

export const DocumentPreview = (props: DocumentPreviewPropsT): JSX.Element => {
	const router = useRouter()
	const [document, setDocument] = useState<LocalDocumentT | null | undefined>(undefined)
	const [workspaceDocuments, setWorkspaceDocuments] = useState<LocalDocumentT[]>([])
	const [previewHtml, setPreviewHtml] = useState('')

	useEffect(() => {
		let isCurrent = true
		const load = async (): Promise<void> => {
			const workspace = await restoreWorkspace(false)
			if (workspace === null) {
				router.replace('/')
				return
			}

			const workspaceState = await listWorkspace()
			const nextDocument = workspaceState.documents.find((candidate) => candidate._id === props.documentId) ?? null
			if (!isCurrent) return
			setWorkspaceDocuments(workspaceState.documents)
			setDocument(nextDocument)
			if (nextDocument !== null) setPreviewHtml(await renderMarkdown(nextDocument.content))
		}
		void load()
		return () => {
			isCurrent = false
		}
	}, [props.documentId, router])

	const handlePreviewClick = (event: React.MouseEvent<HTMLDivElement>): void => {
		if (document === null || document === undefined) return
		const target = event.target
		if (!(target instanceof Element)) return
		const anchor = target.closest('a')
		if (!(anchor instanceof HTMLAnchorElement)) return

		const rawHref = anchor.getAttribute('href') ?? ''
		const resolved = resolveDocumentHref(document.path, rawHref)
		if (resolved === null) return

		event.preventDefault()
		const linkedDocument = workspaceDocuments.find((candidate) => candidate.path === resolved.path)
		if (linkedDocument === undefined) return
		const anchorSuffix = resolved.anchor ? `#${resolved.anchor}` : ''
		router.push(`/documents/${linkedDocument._id}/preview${anchorSuffix}`)
	}

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
			<div className="DocumentPreviewContent" onClick={handlePreviewClick}><div className="Prose" dangerouslySetInnerHTML={{ __html: previewHtml }} /></div>
		</div>
	)
}
