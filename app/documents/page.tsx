import './page.css'
import { $composer, $documents, $folders, $search, FolderFilterT } from './stores'
import { DocumentsHeader } from './components/DocumentsHeader/DocumentsHeader'
import { FolderRail } from './components/FolderRail/FolderRail'
import { DocumentsWorkspace } from './components/DocumentsWorkspace/DocumentsWorkspace'
import { FolderComposer } from './components/FolderComposer/FolderComposer'
import { SearchPalette } from './components/SearchPalette/SearchPalette'
import { JSX, useCallback, useEffect, useState } from 'react'
import { useLocation } from 'wouter'
import { createDocument, createFolder, listWorkspace, moveDocument, removeFolder, restoreWorkspace, searchDocuments, trashDocument } from '@/lib/localWorkspace'
import type { LocalDocumentT, LocalFolderT } from '@/lib/localWorkspace'
import { getFolderDescriptions, saveFolderDescription } from '@/lib/folderDescriptions'
import { rememberCurrentWorkspace } from '@/lib/recentWorkspaces'
import { beginAppTransition } from '@/lib/appTransition'
import { getEditorHref } from '@/lib/documentRoutes'

const DocumentsPage = (): JSX.Element => {
	const [, navigate] = useLocation()
	const [debouncedSearchInput, setDebouncedSearchInput] = useState('')
	const [workspaceName, setWorkspaceName] = useState('')
	const searchInput = $search.use.lookup('input') as string
	const searchTerm = debouncedSearchInput.trim()
	const isComposerOpen = $composer.use.lookup('isOpen') as boolean
	const isSearchOpen = $search.use.lookup('isOpen') as boolean

	const refreshWorkspace = useCallback(async (): Promise<void> => {
		try {
			const nextWorkspaceName = await restoreWorkspace(false)
			if (nextWorkspaceName === null) { navigate('/', { replace: true }); return }
			const snapshot = await listWorkspace()
			const descriptions = await getFolderDescriptions(nextWorkspaceName, snapshot.folders.map((folder) => folder.path))
			const folders: LocalFolderT[] = snapshot.folders.map((folder) => ({ ...folder, description: descriptions.get(folder.path) || undefined }))
			setWorkspaceName(nextWorkspaceName)
			$documents.set({ isLoading: false, list: snapshot.documents })
			$folders.set({ isLoading: false, list: folders })
			await rememberCurrentWorkspace()
		} catch { navigate('/', { replace: true }) }
	}, [navigate])

	useEffect(() => { void refreshWorkspace() }, [refreshWorkspace])
	useEffect(() => { const id = window.setTimeout(() => setDebouncedSearchInput(searchInput), 250); return () => window.clearTimeout(id) }, [searchInput])
	
  useEffect(() => {
		let isCurrent = true
		if (!searchTerm) { $search.set({ isLoading: false, results: [] }); return }
		$search.set.lookup('isLoading', true)
		searchDocuments(searchTerm).then((results) => { if (isCurrent) $search.set({ isLoading: false, results }) })
		return () => { isCurrent = false }
	}, [searchTerm])

	/*
		The composer and the search palette keep their open state in module-level
		stores, which outlive this page. Leaving the workspace has to close them
		and drop whatever was half-typed, or they are still sitting there on top
		of the view the next time the reader comes back.
	*/
	useEffect(() => () => {
		$composer.set.replace({ folderName: '', folderDescription: '', isCreating: false, isOpen: false })
		$search.set.replace({ input: '', isOpen: false, isLoading: false, results: [] })
	}, [])

	useEffect(() => {
		const handleKeyDown = (event: KeyboardEvent): void => {
			if ((event.metaKey || event.ctrlKey) && event.key.toLowerCase() === 'k') { event.preventDefault(); $search.set.lookup('isOpen', true); return }
			if (event.key === 'Escape' && $search.state.isOpen) $search.set.lookup('isOpen', false)
		}

		window.addEventListener('keydown', handleKeyDown)
		return () => window.removeEventListener('keydown', handleKeyDown)
	}, [])

	const handleNew = async (): Promise<void> => {
		const selectedId = $folders.state.selectedId
		const folderId = selectedId !== 'all' && selectedId !== 'uncategorized' ? selectedId : undefined
		const document = await createDocument(folderId)
		beginAppTransition(() => navigate(getEditorHref(document._id)))
	}

	const handleShareDocument = (documentId: string): void => {
		const document = ($documents.state.list as LocalDocumentT[]).find((candidate) => candidate._id === documentId)
		if (document === undefined) return
		const escapedTitle = document.title.replaceAll('[', '\\[').replaceAll(']', '\\]') || 'Untitled'
		void navigator.clipboard.writeText(`[${escapedTitle}](</${document.path}>)`)
		$folders.set.lookup('copiedId', documentId)
		setTimeout(() => $folders.set.lookup('copiedId', ''), 2000)
	}

	const handleDeleteFolder = async (folderId: string): Promise<void> => {
		await removeFolder(folderId)
		if ($folders.state.selectedId === folderId) $folders.set.lookup('selectedId', 'uncategorized' as FolderFilterT)
		await refreshWorkspace()
	}
	const handleCreateFolder = async (name: string, description: string): Promise<void> => {
		$composer.set.lookup('isCreating', true)
		const folder = await createFolder(name)
		if (workspaceName) await saveFolderDescription(workspaceName, folder.path, description)
		$folders.set.lookup('selectedId', folder._id as FolderFilterT)
		$composer.set.replace({ folderName: '', folderDescription: '', isCreating: false, isOpen: false })
		await refreshWorkspace()
	}
	const handleMoveDocument = async (documentId: string, value: string): Promise<void> => { await moveDocument(documentId, value === 'uncategorized' ? undefined : value); await refreshWorkspace() }
	const handleDeleteDocument = async (documentId: string): Promise<void> => { await trashDocument(documentId); await refreshWorkspace() }
	const handleNavigateToDocument = (documentId: string): void => { $search.set.lookup('isOpen', false); beginAppTransition(() => navigate(getEditorHref(documentId))) }
	return <div className="documentsPage">
		<DocumentsHeader />
		<div className="documentsPageBody">
			<FolderRail workspaceName={workspaceName} onDeleteFolder={handleDeleteFolder} />
			<div className="documentsPageContent"><DocumentsWorkspace onNew={handleNew} onMoveDocument={handleMoveDocument} onShareDocument={handleShareDocument} onDeleteDocument={handleDeleteDocument} /></div>
		</div>
		{isComposerOpen && <FolderComposer onSubmit={handleCreateFolder} />}
		{isSearchOpen && <SearchPalette onNavigate={handleNavigateToDocument} />}
	</div>
}

export default DocumentsPage
