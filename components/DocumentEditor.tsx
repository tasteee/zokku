'use client'

import { useQuery, useMutation } from 'convex/react'
import { useRouter } from 'next/navigation'
import { useState, useEffect, useRef, useCallback, CSSProperties, JSX } from 'react'
import { api } from '@/convex/_generated/api'
import type { Id } from '@/convex/_generated/dataModel'
import { renderMarkdown, exportHtml } from '@/app/actions/renderMarkdown'
import { ZButton } from '@/components/zButton'
import { CaretLeftIcon } from '@phosphor-icons/react'

type DocumentEditorPropsT = {
	documentId: Id<'documents'>
}

type SaveState = 'saved' | 'saving' | 'unsaved'

const AUTOSAVE_DELAY_MS = 1000
const PREVIEW_DEBOUNCE_MS = 300

import { datass, useDatass } from 'datass'

export const DocumentEditor = (props: DocumentEditorPropsT): JSX.Element => {
	const document = useQuery(api.documents.get, { id: props.documentId })
	const updateDocument = useMutation(api.documents.update)
	const removeDocument = useMutation(api.documents.remove)
	const router = useRouter()

	const title = useDatass.string('')

	const [content, setContent] = useState('')
	const [previewHtml, setPreviewHtml] = useState('')
	const [saveState, setSaveState] = useState<SaveState>('saved')
	const [isConfirmingDelete, setIsConfirmingDelete] = useState(false)

	const saveTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null)
	const isMountedRef = useRef(false)

	const [splitPercent, setSplitPercent] = useState(50)
	const editorLayoutRef = useRef<HTMLDivElement | null>(null)
	const isDraggingRef = useRef(false)

	const handleResizePointerDown = (event: React.PointerEvent<HTMLDivElement>): void => {
		isDraggingRef.current = true
		event.currentTarget.setPointerCapture(event.pointerId)
	}

	const handleResizePointerMove = (event: React.PointerEvent<HTMLDivElement>): void => {
		const isNotDragging = !isDraggingRef.current
		if (isNotDragging) return

		const layoutElement = editorLayoutRef.current
		if (layoutElement === null) return

		const layoutRect = layoutElement.getBoundingClientRect()
		const offsetX = event.clientX - layoutRect.left
		const rawPercent = (offsetX / layoutRect.width) * 100
		const clampedPercent = Math.min(80, Math.max(20, rawPercent))
		setSplitPercent(clampedPercent)
	}

	const handleResizePointerUp = (event: React.PointerEvent<HTMLDivElement>): void => {
		isDraggingRef.current = false
		event.currentTarget.releasePointerCapture(event.pointerId)
	}

	// Hydrate local state from Convex on first load
	useEffect(() => {
		const isLoaded = document !== undefined && document !== null
		if (!isLoaded || isMountedRef.current) return

		isMountedRef.current = true
		title.set(document.title)
		setContent(document.content)
	}, [document])

	// Update preview whenever content changes, debounced to avoid a server
	// round-trip on every keystroke (renderMarkdown is a server action).
	useEffect(() => {
		const previewTimer = setTimeout(async () => {
			const html = await renderMarkdown(content)
			setPreviewHtml(html)
		}, PREVIEW_DEBOUNCE_MS)

		return () => clearTimeout(previewTimer)
	}, [content])

	const scheduleSave = useCallback(
		(nextTitle: string, nextContent: string): void => {
			if (saveTimerRef.current !== null) clearTimeout(saveTimerRef.current)

			setSaveState('unsaved')

			saveTimerRef.current = setTimeout(async () => {
				setSaveState('saving')
				await updateDocument({ id: props.documentId, title: nextTitle, content: nextContent })
				setSaveState('saved')
			}, AUTOSAVE_DELAY_MS)
		},
		[props.documentId, updateDocument]
	)

	const handleTitleChange = (event: React.ChangeEvent<HTMLInputElement>): void => {
		const nextTitle = event.target.value
		title.set(nextTitle)
		scheduleSave(nextTitle, content)
	}

	const handleContentChange = (event: React.ChangeEvent<HTMLTextAreaElement>): void => {
		const nextContent = event.target.value
		setContent(nextContent)
		scheduleSave(title.state, nextContent)
	}

	const handleExport = async (): Promise<void> => {
		const html = await exportHtml(title.state, content)
		const blob = new Blob([html], { type: 'text/html' })
		const url = URL.createObjectURL(blob)
		const anchor = globalThis.document.createElement('a')
		const safeFilename = (title.state || 'document').replace(/[^a-z0-9\-_\s]/gi, '').trim() || 'document'
		anchor.href = url
		anchor.download = `${safeFilename}.html`
		anchor.click()
		URL.revokeObjectURL(url)
	}

	const handleDeleteClick = (): void => {
		const isFirstClick = !isConfirmingDelete
		if (isFirstClick) {
			setIsConfirmingDelete(true)
			return
		}

		handleConfirmDelete()
	}

	const handleConfirmDelete = async (): Promise<void> => {
		await removeDocument({ id: props.documentId })
		router.push('/documents')
	}

	const handleDeleteBlur = (): void => {
		setIsConfirmingDelete(false)
	}

	const saveLabel = saveState === 'saving' ? 'Saving...' : saveState === 'unsaved' ? 'Unsaved' : 'Saved'
	const deleteLabel = isConfirmingDelete ? 'Sure?' : 'Delete'
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
		<div className="EditorShell">
			<div className="Topbar">
				<button className="TopbarBackButton" onClick={() => router.push('/documents')} title="All documents">
					<CaretLeftIcon size={18} weight="bold" />
				</button>
				<input
					className="TopbarTitle"
					type="text"
					value={title.state}
					onChange={handleTitleChange}
					placeholder="Untitled"
					spellCheck={false}
				/>
				<span className="TopbarSaveState" data-saving={saveState === 'saving' ? 'true' : 'false'}>
					{saveLabel}
				</span>
				<div className="TopbarActions">
					<ZButton isSmall isGhost label="Preview" onClick={() => router.push(`/documents/${props.documentId}/preview`)} />
					<ZButton isSmall isGhost label="Export HTML" onClick={handleExport} />
					<ZButton
						isRed
						isSmall
						isGhost
						label={deleteLabel}
						data-confirm={isConfirmingDelete ? 'true' : 'false'}
						onClick={handleDeleteClick}
						onBlur={handleDeleteBlur}
					/>
				</div>
			</div>

			<div
				ref={editorLayoutRef}
				className="EditorLayout"
				style={{ gridTemplateColumns: `${splitPercent}% auto 1fr` } as CSSProperties}
			>
				<div className="EditorPane">
					<div className="EditorPaneLabel">Markdown</div>
					<div className="EditorPaneContent">
						<textarea
							className="EditorTextarea"
							value={content}
							onChange={handleContentChange}
							placeholder="Start writing..."
							spellCheck={false}
						/>
					</div>
				</div>

				<div
					className="EditorResizeHandle"
					onPointerDown={handleResizePointerDown}
					onPointerMove={handleResizePointerMove}
					onPointerUp={handleResizePointerUp}
				/>

				<div className="PreviewPane">
					<div className="PreviewPaneLabel">Preview</div>
					<div className="PreviewPaneContent">
						<div className="Prose" dangerouslySetInnerHTML={{ __html: previewHtml }} />
					</div>
				</div>
			</div>
		</div>
	)
}
