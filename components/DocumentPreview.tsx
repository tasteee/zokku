'use client'

import './DocumentPreview.css'
import '@/components/PreviewSettings.css'
import { useRouter } from 'next/navigation'
import { JSX, useEffect, useRef, useState } from 'react'
import { renderMarkdown } from '@/app/actions/renderMarkdown'
import { CaretLeftIcon } from '@phosphor-icons/react'
import { listWorkspace, resolveWorkspaceMediaInHtml, restoreWorkspace } from '@/lib/localWorkspace'
import type { LocalDocumentT } from '@/lib/localWorkspace'
import { resolveDocumentHref } from '@/lib/documentLinks'
import { beginAppTransition } from '@/lib/appTransition'
import { getEditorHref, getPreviewHref } from '@/lib/documentRoutes'
import { getPreviewSurfaceStyle, loadPreviewSettings } from '@/components/previewSettings'
import type { PreviewSettingsT } from '@/components/previewSettings'

type DocumentPreviewPropsT = { documentId: string }

export const DocumentPreview = (props: DocumentPreviewPropsT): JSX.Element => {
	const router = useRouter()
	const [document, setDocument] = useState<LocalDocumentT | null | undefined>(undefined)
	const [workspaceDocuments, setWorkspaceDocuments] = useState<LocalDocumentT[]>([])
	const [previewHtml, setPreviewHtml] = useState('')
	const [previewSettings] = useState<PreviewSettingsT>(loadPreviewSettings)
	const previewMediaUrlsRef = useRef<string[]>([])

	useEffect(() => {
		let isCurrent = true
		void (async () => {
			const workspace = await restoreWorkspace(false)
			if (workspace === null) { router.replace('/'); return }
			const workspaceState = await listWorkspace()
			const nextDocument = workspaceState.documents.find((candidate) => candidate._id === props.documentId) ?? null
			if (!isCurrent) return
			setWorkspaceDocuments(workspaceState.documents)
			setDocument(nextDocument)
			if (nextDocument === null) return

			const renderedHtml = await renderMarkdown(nextDocument.content, previewSettings.theme)
			const resolved = await resolveWorkspaceMediaInHtml(renderedHtml, nextDocument.path)
			if (!isCurrent) {
				for (const url of resolved.objectUrls) URL.revokeObjectURL(url)
				return
			}
			for (const url of previewMediaUrlsRef.current) URL.revokeObjectURL(url)
			previewMediaUrlsRef.current = resolved.objectUrls
			setPreviewHtml(resolved.html)
		})()
		return () => { isCurrent = false }
	}, [props.documentId, router, previewSettings.theme])

	useEffect(() => () => {
		for (const url of previewMediaUrlsRef.current) URL.revokeObjectURL(url)
	}, [])

	const handlePreviewClick = (event: React.MouseEvent<HTMLDivElement>): void => {
		if (document === null || document === undefined) return
		const target = event.target
		if (!(target instanceof Element)) return
		const anchor = target.closest('a')
		if (!(anchor instanceof HTMLAnchorElement)) return
		const resolved = resolveDocumentHref(document.path, anchor.getAttribute('href') ?? '')
		if (resolved === null) return
		event.preventDefault()
		const linkedDocument = workspaceDocuments.find((candidate) => candidate.path === resolved.path)
		if (linkedDocument === undefined) return
		beginAppTransition(() => router.push(getPreviewHref(linkedDocument._id, resolved.anchor)))
	}

	if (document === null) return <div className="HomeEmpty"><z-heading size="lg">Document not found</z-heading><p className="HomeEmptyBody">The Markdown file may have been moved or deleted.</p><z-button accent="dom" onClick={() => beginAppTransition(() => router.push('/documents/'))}>Back to documents</z-button></div>
	if (document === undefined) return <div className="HomeEmpty"><p className="HomeEmptyBody">Loading local preview…</p></div>

	return <div className="DocumentPreviewShell">
		<div className="Topbar">
			<z-button kind="ghost" size="sm" onClick={() => beginAppTransition(() => router.push(getEditorHref(props.documentId)))} title="Back to editor" aria-label="Back to editor"><CaretLeftIcon size={18} weight="bold" /></z-button>
			<span className="TopbarTitle">{document.title || 'Untitled'}</span>
		</div>
		<div className="DocumentPreviewContent proseRoot" data-preview-theme={previewSettings.theme} data-preview-font="sans" data-preview-scale="compact" style={getPreviewSurfaceStyle(previewSettings)} onClick={handlePreviewClick}><div className="Prose" dangerouslySetInnerHTML={{ __html: previewHtml }} /></div>
	</div>
}
