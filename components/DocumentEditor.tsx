'use client'

import './DocumentEditor.css'
import { useQuery, useMutation } from 'convex/react'
import { useRouter } from 'next/navigation'
import { useState, useEffect, useRef, useCallback, CSSProperties, JSX } from 'react'
import { api } from '@/convex/_generated/api'
import type { Id } from '@/convex/_generated/dataModel'
import { renderMarkdown, exportHtml } from '@/app/actions/renderMarkdown'
import { ZButton } from '@/components/zButton'
import { CaretLeftIcon, ChatCircleTextIcon } from '@phosphor-icons/react'
import { MarkdownEditor } from '@/components/MarkdownEditor'
import { ClaudeChat } from '@/components/ClaudeChat'
import { PreviewSettings } from '@/components/PreviewSettings'
import { $previewSettings, loadPreviewSettings, savePreviewSettings, getPreviewSurfaceStyle } from '@/components/previewSettings'
import type { PreviewSettingsT, PreviewThemeT, PreviewFontT, PreviewScaleT } from '@/components/previewSettings'

type DocumentEditorPropsT = {
	documentId: Id<'documents'>
}

type SaveState = 'saved' | 'saving' | 'unsaved'

const AUTOSAVE_DELAY_MS = 1000
const PREVIEW_DEBOUNCE_MS = 300

import { useDatass } from 'datass'

export const DocumentEditor = (props: DocumentEditorPropsT): JSX.Element => {
	// const { user } = useUser()
	const document = useQuery(api.documents.get, { id: props.documentId })
	const updateDocument = useMutation(api.documents.update)
	const removeDocument = useMutation(api.documents.remove)
	const generateUploadUrl = useMutation(api.images.generateUploadUrl)
	const getImageUrl = useMutation(api.images.getImageUrl)
	const router = useRouter()

	const title = useDatass.string('')

	const [content, setContent] = useState('')
	const [previewHtml, setPreviewHtml] = useState('')
	const [saveState, setSaveState] = useState<SaveState>('saved')
	const [isConfirmingDelete, setIsConfirmingDelete] = useState(false)

	const previewTheme = $previewSettings.use.lookup('theme') as PreviewThemeT
	const previewFont = $previewSettings.use.lookup('font') as PreviewFontT
	const previewScale = $previewSettings.use.lookup('scale') as PreviewScaleT
	const previewBaseFontSize = $previewSettings.use.lookup('baseFontSize') as number

	const previewSettings: PreviewSettingsT = {
		theme: previewTheme,
		font: previewFont,
		scale: previewScale,
		baseFontSize: previewBaseFontSize
	}

	const isUserAllowed = true

	const saveTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null)
	const isMountedRef = useRef(false)

	const [splitPercent, setSplitPercent] = useState(50)
	const [chatPercent, setChatPercent] = useState(30)
	const [isChatOpen, setIsChatOpen] = useState(false)
	const [mobilePaneView, setMobilePaneView] = useState<'editor' | 'preview'>('editor')
	const editorLayoutRef = useRef<HTMLDivElement | null>(null)
	const isDraggingRef = useRef(false)
	const isDraggingChatRef = useRef(false)

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

	const handleChatResizePointerDown = (event: React.PointerEvent<HTMLDivElement>): void => {
		isDraggingChatRef.current = true
		event.currentTarget.setPointerCapture(event.pointerId)
	}

	const handleChatResizePointerMove = (event: React.PointerEvent<HTMLDivElement>): void => {
		const isNotDragging = !isDraggingChatRef.current
		if (isNotDragging) return

		const layoutElement = editorLayoutRef.current
		if (layoutElement === null) return

		const layoutRect = layoutElement.getBoundingClientRect()
		const offsetFromRight = layoutRect.right - event.clientX
		const rawPercent = (offsetFromRight / layoutRect.width) * 100
		const clampedPercent = Math.min(60, Math.max(15, rawPercent))
		setChatPercent(clampedPercent)
	}

	const handleChatResizePointerUp = (event: React.PointerEvent<HTMLDivElement>): void => {
		isDraggingChatRef.current = false
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

	// Hydrate preview settings from localStorage after mount so the server
	// and first client render agree on the default before applying choices.
	useEffect(() => {
		const storedSettings = loadPreviewSettings()
		$previewSettings.set.replace(storedSettings)
	}, [])

	const handlePreviewSettingsChange = (nextSettings: PreviewSettingsT): void => {
		$previewSettings.set.replace(nextSettings)
		savePreviewSettings(nextSettings)
	}

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

	const handleContentChange = (nextContent: string): void => {
		setContent(nextContent)
		scheduleSave(title.state, nextContent)
	}

	const handleExport = async (): Promise<void> => {
		const html = await exportHtml(title.state, content, previewSettings)
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

	const handleImageUpload = async (blob: Blob): Promise<string | null> => {
		const uploadUrl = await generateUploadUrl()

		const uploadResponse = await fetch(uploadUrl, {
			method: 'POST',
			headers: { 'Content-Type': blob.type },
			body: blob
		})

		if (!uploadResponse.ok) return null

		const uploadResult = await uploadResponse.json() as { storageId: string }
		const imageUrl = await getImageUrl({ storageId: uploadResult.storageId })
		return imageUrl
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

	const gridTemplateColumns = isChatOpen ? `${splitPercent}% auto 1fr auto ${chatPercent}%` : `${splitPercent}% auto 1fr`
	const previewSurfaceStyle = getPreviewSurfaceStyle(previewSettings)

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
					{isUserAllowed && (
						<button
							className="ClaudeChatTrigger"
							data-active={isChatOpen ? 'true' : 'false'}
							onClick={() => setIsChatOpen(!isChatOpen)}
						>
							{/* only show this button if the user is shane@tasteee.ink or shanecolcleasure@gmail.com */}
							<>
								<ChatCircleTextIcon size={14} weight="bold" />
								Ask Claude
							</>
						</button>
					)}
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

			<div ref={editorLayoutRef} className="EditorLayout" data-mobile-view={mobilePaneView} style={{ gridTemplateColumns } as CSSProperties}>
				<div className="EditorPane">
					<MarkdownEditor value={content} onChange={handleContentChange} onImageUpload={handleImageUpload} />
				</div>

				<div
					className="EditorResizeHandle"
					onPointerDown={handleResizePointerDown}
					onPointerMove={handleResizePointerMove}
					onPointerUp={handleResizePointerUp}
				/>

				<div className="PreviewPane">
					<div className="PreviewPaneLabel">
						<span className="PreviewPaneLabelText">Preview</span>
						<PreviewSettings settings={previewSettings} onChange={handlePreviewSettingsChange} />
					</div>
					<div
						className="PreviewPaneContent"
						data-preview-theme={previewSettings.theme}
						data-preview-font={previewSettings.font}
						data-preview-scale={previewSettings.scale}
						style={previewSurfaceStyle}
					>
						<div className="Prose" dangerouslySetInnerHTML={{ __html: previewHtml }} />
					</div>
				</div>

				{isChatOpen && (
					<>
						<div
							className="EditorResizeHandle"
							onPointerDown={handleChatResizePointerDown}
							onPointerMove={handleChatResizePointerMove}
							onPointerUp={handleChatResizePointerUp}
						/>
						<ClaudeChat documentTitle={title.state} documentContent={content} onClose={() => setIsChatOpen(false)} />
					</>
				)}
			</div>

			<div className="EditorMobileToggle" role="group" aria-label="Switch pane">
				<button
					className="EditorMobileToggleButton"
					data-active={mobilePaneView === 'editor' ? 'true' : 'false'}
					onClick={() => setMobilePaneView('editor')}
				>
					Editor
				</button>
				<button
					className="EditorMobileToggleButton"
					data-active={mobilePaneView === 'preview' ? 'true' : 'false'}
					onClick={() => setMobilePaneView('preview')}
				>
					Preview
				</button>
			</div>
		</div>
	)
}
