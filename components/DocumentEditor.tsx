'use client'

import './DocumentEditor.css'

import { CSSProperties, JSX, useCallback, useEffect, useRef, useState } from 'react'
import { useRouter } from 'next/navigation'
import { ArrowSquareOut, CaretLeftIcon, Check, Export, MoonStars, SpinnerGap, Sun, Trash } from '@phosphor-icons/react'
import { useDatass } from 'datass'
import { renderMarkdown } from '@/app/actions/renderMarkdown'
import { exportLinkedHtml } from '@/app/actions/exportLinkedHtml'
import { ZButton } from '@/components/zButton'
import { ZokkuBrand } from '@/components/ZokkuBrand'
import { MarkdownEditor } from '@/components/MarkdownEditor'
import { PreviewSettings } from '@/components/PreviewSettingsPanel'
import { $previewSettings, getPreviewSurfaceStyle, loadPreviewSettings, savePreviewSettings } from '@/components/previewSettings'
import type { PreviewFontT, PreviewScaleT, PreviewSettingsT, PreviewThemeT } from '@/components/previewSettings'
import { getDocument, listWorkspace, removeDocument, restoreWorkspace, saveDocument } from '@/lib/localWorkspace'
import type { LocalDocumentT } from '@/lib/localWorkspace'
import { resolveDocumentHref } from '@/lib/documentLinks'
import { getExportDocuments } from '@/lib/localDocumentExport'

type DocumentEditorPropsT = {
	documentId: string
}

type SaveStateT = 'saved' | 'saving' | 'unsaved'
type ThemeTransitionT = 'idle' | 'out' | 'in'

const AUTOSAVE_DELAY_MS = 700
const PREVIEW_DEBOUNCE_MS = 250

const blobToDataUrl = (blob: Blob, onProgress: (percent: number) => void): Promise<string> => {
	return new Promise((resolve, reject) => {
		const reader = new FileReader()
		reader.onloadstart = () => onProgress(10)
		reader.onprogress = (event) => {
			if (!event.lengthComputable) return
			onProgress(Math.max(10, Math.round((event.loaded / event.total) * 90)))
		}
		reader.onload = () => {
			onProgress(100)
			resolve(String(reader.result))
		}
		reader.onerror = () => reject(reader.error)
		reader.readAsDataURL(blob)
	})
}

export const DocumentEditor = (props: DocumentEditorPropsT): JSX.Element => {
	const router = useRouter()
	const title = useDatass.string('')
	const [content, setContent] = useState('')
	const [documentPath, setDocumentPath] = useState('')
	const [workspaceDocuments, setWorkspaceDocuments] = useState<LocalDocumentT[]>([])
	const [previewHtml, setPreviewHtml] = useState('')
	const [saveState, setSaveState] = useState<SaveStateT>('saved')
	const [themeTransition, setThemeTransition] = useState<ThemeTransitionT>('idle')
	const [isConfirmingDelete, setIsConfirmingDelete] = useState(false)
	const [isLoading, setIsLoading] = useState(true)
	const [isMissing, setIsMissing] = useState(false)
	const [splitPercent, setSplitPercent] = useState(50)
	const [mobilePaneView, setMobilePaneView] = useState<'editor' | 'preview'>('editor')
	const activeIdRef = useRef(props.documentId)
	const saveTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null)
	const themeTimersRef = useRef<ReturnType<typeof setTimeout>[]>([])
	const editorLayoutRef = useRef<HTMLDivElement | null>(null)
	const isDraggingRef = useRef(false)

	const previewTheme = $previewSettings.use.lookup('theme') as PreviewThemeT
	const previewFont = $previewSettings.use.lookup('font') as PreviewFontT
	const previewScale = $previewSettings.use.lookup('scale') as PreviewScaleT
	const previewBaseFontSize = $previewSettings.use.lookup('baseFontSize') as number
	const previewSettings: PreviewSettingsT = { theme: previewTheme, font: previewFont, scale: previewScale, baseFontSize: previewBaseFontSize }

	useEffect(() => {
		let isCurrent = true
		const load = async (): Promise<void> => {
			const workspace = await restoreWorkspace(false)
			if (workspace === null) {
				router.replace('/')
				return
			}

			const workspaceState = await listWorkspace()
			const document = workspaceState.documents.find((candidate) => candidate._id === props.documentId) ?? null
			if (!isCurrent) return
			setWorkspaceDocuments(workspaceState.documents)

			if (document === null) {
				setIsMissing(true)
				setIsLoading(false)
				return
			}

			activeIdRef.current = document._id
			title.set(document.title)
			setContent(document.content)
			setDocumentPath(document.path)
			setIsLoading(false)
		}
		void load()
		return () => {
			isCurrent = false
		}
	}, [props.documentId, router])

	useEffect(() => {
		const storedSettings = loadPreviewSettings()
		$previewSettings.set.replace(storedSettings)
	}, [])

	useEffect(() => {
		const timer = window.setTimeout(() => {
			void renderMarkdown(content, previewTheme).then(setPreviewHtml)
		}, PREVIEW_DEBOUNCE_MS)
		return () => window.clearTimeout(timer)
	}, [content, previewTheme])

	const scheduleSave = useCallback((nextTitle: string, nextContent: string): void => {
		if (saveTimerRef.current !== null) clearTimeout(saveTimerRef.current)
		setSaveState('unsaved')
		saveTimerRef.current = setTimeout(async () => {
			setSaveState('saving')
			const previousId = activeIdRef.current
			const nextId = await saveDocument(previousId, nextTitle, nextContent)
			activeIdRef.current = nextId

			if (nextId !== previousId) {
				const savedDocument = await getDocument(nextId)
				if (savedDocument !== null) setDocumentPath(savedDocument.path)
				router.replace(`/documents/${nextId}`)
			}

			setSaveState('saved')
		}, AUTOSAVE_DELAY_MS)
	}, [router])

	useEffect(() => {
		return () => {
			if (saveTimerRef.current !== null) clearTimeout(saveTimerRef.current)
			for (const timer of themeTimersRef.current) clearTimeout(timer)
		}
	}, [])

	const handleTitleChange = (event: React.ChangeEvent<HTMLInputElement>): void => {
		const nextTitle = event.target.value
		title.set(nextTitle)
		scheduleSave(nextTitle, content)
	}

	const handleContentChange = (nextContent: string): void => {
		setContent(nextContent)
		scheduleSave(title.state, nextContent)
	}

	const handlePreviewSettingsChange = (settings: PreviewSettingsT): void => {
		$previewSettings.set.replace(settings)
		savePreviewSettings(settings)
	}

	const handleThemeToggle = (): void => {
		if (themeTransition !== 'idle') return
		setThemeTransition('out')
		const switchTimer = setTimeout(() => {
			const nextTheme: PreviewThemeT = previewTheme === 'light' ? 'dark' : 'light'
			const nextSettings = { ...previewSettings, theme: nextTheme }
			handlePreviewSettingsChange(nextSettings)
			setThemeTransition('in')

			const finishTimer = setTimeout(() => setThemeTransition('idle'), 500)
			themeTimersRef.current.push(finishTimer)
		}, 300)
		themeTimersRef.current.push(switchTimer)
	}

	const handleExport = async (): Promise<void> => {
		if (saveTimerRef.current !== null) clearTimeout(saveTimerRef.current)
		setSaveState('saving')
		const previousId = activeIdRef.current
		const nextId = await saveDocument(previousId, title.state, content)
		activeIdRef.current = nextId
		const exportDocuments = await getExportDocuments(nextId)
		const html = await exportLinkedHtml(exportDocuments, previewSettings)
		setSaveState('saved')

		if (nextId !== previousId) router.replace(`/documents/${nextId}`)

		const blob = new Blob([html], { type: 'text/html' })
		const url = URL.createObjectURL(blob)
		const anchor = document.createElement('a')
		const safeFilename = (title.state || 'document').replace(/[^a-z0-9\-_\s]/gi, '').trim() || 'document'
		anchor.href = url
		anchor.download = `${safeFilename}.html`
		anchor.click()
		URL.revokeObjectURL(url)
	}

	const handlePreviewClick = (event: React.MouseEvent<HTMLDivElement>): void => {
		const target = event.target
		if (!(target instanceof Element)) return
		const anchor = target.closest('a')
		if (!(anchor instanceof HTMLAnchorElement)) return

		const rawHref = anchor.getAttribute('href') ?? ''
		const resolved = resolveDocumentHref(documentPath, rawHref)
		if (resolved === null) return

		event.preventDefault()
		const linkedDocument = workspaceDocuments.find((document) => document.path === resolved.path)
		if (linkedDocument === undefined) return
		const anchorSuffix = resolved.anchor ? `#${resolved.anchor}` : ''
		router.push(`/documents/${linkedDocument._id}${anchorSuffix}`)
	}

	const handleDelete = async (): Promise<void> => {
		if (!isConfirmingDelete) {
			setIsConfirmingDelete(true)
			return
		}
		await removeDocument(activeIdRef.current)
		router.push('/documents')
	}

	const handleResizePointerDown = (event: React.PointerEvent<HTMLDivElement>): void => {
		isDraggingRef.current = true
		event.currentTarget.setPointerCapture(event.pointerId)
	}

	const handleResizePointerMove = (event: React.PointerEvent<HTMLDivElement>): void => {
		if (!isDraggingRef.current || editorLayoutRef.current === null) return
		const rect = editorLayoutRef.current.getBoundingClientRect()
		const percent = ((event.clientX - rect.left) / rect.width) * 100
		setSplitPercent(Math.min(80, Math.max(20, percent)))
	}

	const handleResizePointerUp = (event: React.PointerEvent<HTMLDivElement>): void => {
		isDraggingRef.current = false
		event.currentTarget.releasePointerCapture(event.pointerId)
	}

	if (isLoading) return <div className="HomeEmpty"><p className="HomeEmptyBody">Opening local document…</p></div>
	if (isMissing) return <div className="HomeEmpty"><h1 className="HomeEmptyTitle">Document not found</h1><p className="HomeEmptyBody">The file may have been moved or deleted outside Zokku.</p><ZButton label="Back to documents" onClick={() => router.push('/documents')} /></div>

	const isSaving = saveState === 'saving'
	const isSaved = saveState === 'saved'
	const saveStatusLabel = isSaving ? 'Saving' : isSaved ? 'Saved' : 'Changes pending'
	const previewSurfaceStyle = getPreviewSurfaceStyle(previewSettings)
	const deleteButtonTitle = isConfirmingDelete ? 'Click again to delete' : 'Delete document'
	const themeToggleTitle = previewTheme === 'light' ? 'Switch to dark theme' : 'Switch to light theme'

	return (
		<div className="EditorShell">
			<div className="Topbar">
				<div className="EditorNavigationCluster">
					<button className="TopbarBackButton" onClick={() => router.push('/documents')} title="All documents"><CaretLeftIcon size={18} weight="bold" /></button>
					<div className="EditorTopbarBrand"><ZokkuBrand isCompact /></div>
				</div>
				<div className="EditorDocumentIdentity">
					<input className="TopbarTitle" type="text" value={title.state} onChange={handleTitleChange} placeholder="Untitled" spellCheck={false} />
					<span className="EditorSaveStatus" data-state={saveState} title={saveStatusLabel} aria-label={saveStatusLabel}>
						{isSaving && <SpinnerGap className="EditorSaveSpinner" size={13} weight="bold" />}
						{isSaved && <Check size={13} weight="bold" />}
						<span>{saveStatusLabel}</span>
					</span>
				</div>
				<div className="TopbarActions">
					<ZButton isIcon isGhost title="Open full preview" aria-label="Open full preview" onClick={() => router.push(`/documents/${activeIdRef.current}/preview`)}><ArrowSquareOut weight="bold" /></ZButton>
					<ZButton isIcon isGhost title="Export HTML" aria-label="Export HTML" onClick={() => void handleExport()}><Export weight="bold" /></ZButton>
					<ZButton isIcon isGhost isRed title={deleteButtonTitle} aria-label={deleteButtonTitle} data-confirm={isConfirmingDelete ? 'true' : 'false'} onClick={() => void handleDelete()} onBlur={() => setIsConfirmingDelete(false)}><Trash weight={isConfirmingDelete ? 'fill' : 'bold'} /></ZButton>
				</div>
			</div>

			<div ref={editorLayoutRef} className="EditorLayout" data-mobile-view={mobilePaneView} style={{ gridTemplateColumns: `${splitPercent}% auto 1fr` } as CSSProperties}>
				<div className="EditorPane"><MarkdownEditor value={content} onChange={handleContentChange} onMediaUpload={(blob, onProgress) => blobToDataUrl(blob, onProgress)} /></div>
				<div className="EditorResizeHandle" onPointerDown={handleResizePointerDown} onPointerMove={handleResizePointerMove} onPointerUp={handleResizePointerUp} />
				<div className="PreviewPane">
					<div className="PreviewPaneLabel">
						<span className="PreviewPaneLabelText">Preview</span>
						<div className="PreviewPaneLabelActions">
							<button className="PreviewThemeToggle" onClick={handleThemeToggle} disabled={themeTransition !== 'idle'} title={themeToggleTitle} aria-label={themeToggleTitle}>
								{previewTheme === 'light' ? <MoonStars size={16} weight="bold" /> : <Sun size={16} weight="bold" />}
							</button>
							<PreviewSettings settings={previewSettings} onChange={handlePreviewSettingsChange} />
						</div>
					</div>
					<div className="PreviewPaneContent" data-preview-theme={previewSettings.theme} data-preview-font={previewSettings.font} data-preview-scale={previewSettings.scale} style={previewSurfaceStyle} onClick={handlePreviewClick}>
						<div className="PreviewThemeContent" data-theme-transition={themeTransition}>
							<div className="Prose" dangerouslySetInnerHTML={{ __html: previewHtml }} />
						</div>
					</div>
				</div>
			</div>

			<div className="EditorMobileToggle" role="group" aria-label="Switch pane">
				<button className="EditorMobileToggleButton" data-active={mobilePaneView === 'editor' ? 'true' : 'false'} onClick={() => setMobilePaneView('editor')}>Editor</button>
				<button className="EditorMobileToggleButton" data-active={mobilePaneView === 'preview' ? 'true' : 'false'} onClick={() => setMobilePaneView('preview')}>Preview</button>
			</div>
		</div>
	)
}
