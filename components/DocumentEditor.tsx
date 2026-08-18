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
import type { PreviewSettingsT, PreviewThemeT } from '@/components/previewSettings'
import { getDocument, listWorkspace, removeDocument, resolveWorkspaceMediaInHtml, restoreWorkspace, saveDocument, saveMedia } from '@/lib/localWorkspace'
import type { LocalDocumentT } from '@/lib/localWorkspace'
import { resolveDocumentHref } from '@/lib/documentLinks'
import { getExportDocuments } from '@/lib/localDocumentExport'
import { getEditorHref, getPreviewHref } from '@/lib/documentRoutes'

type DocumentEditorPropsT = { documentId: string }
type SaveStateT = 'saved' | 'saving' | 'unsaved'
type ThemeTransitionT = 'idle' | 'out' | 'in'

const AUTOSAVE_DELAY_MS = 700
const PREVIEW_DEBOUNCE_MS = 250

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
	const previewMediaUrlsRef = useRef<string[]>([])
	const editorLayoutRef = useRef<HTMLDivElement | null>(null)
	const isDraggingRef = useRef(false)
	const previewTheme = $previewSettings.use.lookup('theme') as PreviewThemeT
	const previewBaseFontSize = $previewSettings.use.lookup('baseFontSize') as number
	const previewSettings: PreviewSettingsT = { theme: previewTheme, font: 'sans', scale: 'compact', baseFontSize: previewBaseFontSize }

	useEffect(() => {
		let isCurrent = true
		void (async () => {
			const workspace = await restoreWorkspace(false)
			if (workspace === null) { router.replace('/'); return }
			const workspaceState = await listWorkspace()
			const document = workspaceState.documents.find((candidate) => candidate._id === props.documentId) ?? null
			if (!isCurrent) return
			setWorkspaceDocuments(workspaceState.documents)
			if (document === null) { setIsMissing(true); setIsLoading(false); return }
			activeIdRef.current = document._id
			title.set(document.title)
			setContent(document.content)
			setDocumentPath(document.path)
			setIsLoading(false)
		})()
		return () => { isCurrent = false }
	}, [props.documentId, router])

	useEffect(() => { $previewSettings.set.replace(loadPreviewSettings()) }, [])
	useEffect(() => {
		let isCurrent = true
		const timer = window.setTimeout(() => {
			void (async () => {
				const renderedHtml = await renderMarkdown(content, previewTheme)
				const resolved = await resolveWorkspaceMediaInHtml(renderedHtml, documentPath)
				if (!isCurrent) {
					for (const url of resolved.objectUrls) URL.revokeObjectURL(url)
					return
				}
				for (const url of previewMediaUrlsRef.current) URL.revokeObjectURL(url)
				previewMediaUrlsRef.current = resolved.objectUrls
				setPreviewHtml(resolved.html)
			})()
		}, PREVIEW_DEBOUNCE_MS)
		return () => { isCurrent = false; window.clearTimeout(timer) }
	}, [content, previewTheme, documentPath])

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
				router.replace(getEditorHref(nextId))
			}
			setSaveState('saved')
		}, AUTOSAVE_DELAY_MS)
	}, [router])

	useEffect(() => () => {
		if (saveTimerRef.current !== null) clearTimeout(saveTimerRef.current)
		for (const timer of themeTimersRef.current) clearTimeout(timer)
		for (const url of previewMediaUrlsRef.current) URL.revokeObjectURL(url)
	}, [])

	const handleTitleChange = (event: React.ChangeEvent<HTMLInputElement>): void => { title.set(event.target.value); scheduleSave(event.target.value, content) }
	const handleContentChange = (nextContent: string): void => { setContent(nextContent); scheduleSave(title.state, nextContent) }
	const handlePreviewSettingsChange = (settings: PreviewSettingsT): void => {
		const normalized = { ...settings, font: 'sans' as const, scale: 'compact' as const }
		$previewSettings.set.replace(normalized)
		savePreviewSettings(normalized)
	}
	const handleThemeToggle = (): void => {
		if (themeTransition !== 'idle') return
		setThemeTransition('out')
		const switchTimer = setTimeout(() => {
			handlePreviewSettingsChange({ ...previewSettings, theme: previewTheme === 'light' ? 'dark' : 'light' })
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
		const html = await exportLinkedHtml(await getExportDocuments(nextId), previewSettings)
		setSaveState('saved')
		if (nextId !== previousId) router.replace(getEditorHref(nextId))
		const url = URL.createObjectURL(new Blob([html], { type: 'text/html' }))
		const anchor = document.createElement('a')
		anchor.href = url
		anchor.download = `${(title.state || 'document').replace(/[^a-z0-9\-_\s]/gi, '').trim() || 'document'}.html`
		anchor.click()
		URL.revokeObjectURL(url)
	}
	const handlePreviewClick = (event: React.MouseEvent<HTMLDivElement>): void => {
		const target = event.target
		if (!(target instanceof Element)) return
		const anchor = target.closest('a')
		if (!(anchor instanceof HTMLAnchorElement)) return
		const resolved = resolveDocumentHref(documentPath, anchor.getAttribute('href') ?? '')
		if (resolved === null) return
		event.preventDefault()
		const linkedDocument = workspaceDocuments.find((document) => document.path === resolved.path)
		if (linkedDocument === undefined) return
		router.push(getEditorHref(linkedDocument._id, resolved.anchor))
	}
	const handleDelete = async (): Promise<void> => {
		if (!isConfirmingDelete) { setIsConfirmingDelete(true); return }
		await removeDocument(activeIdRef.current)
		router.push('/documents/')
	}
	const handleResizePointerDown = (event: React.PointerEvent<HTMLDivElement>): void => { isDraggingRef.current = true; event.currentTarget.setPointerCapture(event.pointerId) }
	const handleResizePointerMove = (event: React.PointerEvent<HTMLDivElement>): void => {
		if (!isDraggingRef.current || editorLayoutRef.current === null) return
		const rect = editorLayoutRef.current.getBoundingClientRect()
		setSplitPercent(Math.min(80, Math.max(20, ((event.clientX - rect.left) / rect.width) * 100)))
	}
	const handleResizePointerUp = (event: React.PointerEvent<HTMLDivElement>): void => { isDraggingRef.current = false; event.currentTarget.releasePointerCapture(event.pointerId) }

	if (isLoading) return <div className="HomeEmpty"><p className="HomeEmptyBody">Opening local document…</p></div>
	if (isMissing) return <div className="HomeEmpty"><h1 className="HomeEmptyTitle">Document not found</h1><p className="HomeEmptyBody">The file may have been moved or deleted outside Zokku.</p><ZButton label="Back to documents" onClick={() => router.push('/documents/')} /></div>

	const saveStatusLabel = saveState === 'saving' ? 'Saving' : saveState === 'saved' ? 'Saved' : 'Changes pending'
	const previewSurfaceStyle = getPreviewSurfaceStyle(previewSettings)
	const themeToggleTitle = previewTheme === 'light' ? 'Switch to dark theme' : 'Switch to light theme'

	return <div className="EditorShell">
		<div className="Topbar">
			<div className="EditorNavigationCluster"><button className="TopbarBackButton" onClick={() => router.push('/documents/')} title="All documents"><CaretLeftIcon size={18} weight="bold" /></button><div className="EditorTopbarBrand"><ZokkuBrand isCompact /></div></div>
			<div className="EditorDocumentIdentity"><input className="TopbarTitle" type="text" value={title.state} onChange={handleTitleChange} placeholder="Untitled" spellCheck={false} /><span className="EditorSaveStatus" data-state={saveState} title={saveStatusLabel} aria-label={saveStatusLabel}>{saveState === 'saving' && <SpinnerGap className="EditorSaveSpinner" size={13} weight="bold" />}{saveState === 'saved' && <Check size={13} weight="bold" />}<span>{saveStatusLabel}</span></span></div>
			<div className="TopbarActions"><ZButton isIcon isGhost title="Open full preview" aria-label="Open full preview" onClick={() => router.push(getPreviewHref(activeIdRef.current))}><ArrowSquareOut weight="bold" /></ZButton><ZButton isIcon isGhost title="Export HTML" aria-label="Export HTML" onClick={() => void handleExport()}><Export weight="bold" /></ZButton><ZButton isIcon isGhost isRed title={isConfirmingDelete ? 'Click again to delete' : 'Delete document'} aria-label="Delete document" data-confirm={isConfirmingDelete ? 'true' : 'false'} onClick={() => void handleDelete()} onBlur={() => setIsConfirmingDelete(false)}><Trash weight={isConfirmingDelete ? 'fill' : 'bold'} /></ZButton></div>
		</div>
		<div ref={editorLayoutRef} className="EditorLayout" data-mobile-view={mobilePaneView} style={{ gridTemplateColumns: `${splitPercent}% auto 1fr` } as CSSProperties}>
			<div className="EditorPane"><MarkdownEditor value={content} onChange={handleContentChange} onMediaUpload={(blob, onProgress) => saveMedia(blob, documentPath, onProgress)} /></div>
			<div className="EditorResizeHandle" onPointerDown={handleResizePointerDown} onPointerMove={handleResizePointerMove} onPointerUp={handleResizePointerUp} />
			<div className="PreviewPane"><div className="PreviewPaneLabel"><span className="PreviewPaneLabelText">Preview</span><div className="PreviewPaneLabelActions"><button className="PreviewThemeToggle" onClick={handleThemeToggle} disabled={themeTransition !== 'idle'} title={themeToggleTitle} aria-label={themeToggleTitle}>{previewTheme === 'light' ? <MoonStars size={16} weight="bold" /> : <Sun size={16} weight="bold" />}</button><PreviewSettings settings={previewSettings} onChange={handlePreviewSettingsChange} /></div></div><div className="PreviewPaneContent" data-preview-theme={previewTheme} data-preview-font="sans" data-preview-scale="compact" style={previewSurfaceStyle} onClick={handlePreviewClick}><div className="PreviewThemeContent" data-theme-transition={themeTransition}><div className="Prose" dangerouslySetInnerHTML={{ __html: previewHtml }} /></div></div></div>
		</div>
		<div className="EditorMobileToggle" role="group" aria-label="Switch pane"><button className="EditorMobileToggleButton" data-active={mobilePaneView === 'editor' ? 'true' : 'false'} onClick={() => setMobilePaneView('editor')}>Editor</button><button className="EditorMobileToggleButton" data-active={mobilePaneView === 'preview' ? 'true' : 'false'} onClick={() => setMobilePaneView('preview')}>Preview</button></div>
	</div>
}