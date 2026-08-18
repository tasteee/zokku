'use client'

import './page.css'
import { $composer, $documents, $folders, $search, FolderFilterT } from './stores'
import { DocumentsHeader } from './components/DocumentsHeader/DocumentsHeader'
import { FolderRail } from './components/FolderRail/FolderRail'
import { DocumentsWorkspace } from './components/DocumentsWorkspace/DocumentsWorkspace'
import { FolderComposer } from './components/FolderComposer/FolderComposer'
import { SearchPalette } from './components/SearchPalette/SearchPalette'
import { JSX, useCallback, useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { createDocument, createFolder, listWorkspace, moveDocument, removeFolder, restoreWorkspace, searchDocuments } from '@/lib/localWorkspace'
import type { LocalDocumentT, LocalFolderT } from '@/lib/localWorkspace'
import { getFolderDescriptions, saveFolderDescription } from '@/lib/folderDescriptions'
import { rememberCurrentWorkspace } from '@/lib/recentWorkspaces'
import { beginAppTransition } from '@/lib/appTransition'
import { getEditorHref } from '@/lib/documentRoutes'

const WORKSPACE_TRANSITION_KEY = 'zokku-workspace-transition'

const DocumentsPage = (): JSX.Element => {
	const router = useRouter()
	const [debouncedSearchInput, setDebouncedSearchInput] = useState('')
	const [isReady, setIsReady] = useState(false)
	const [workspaceName, setWorkspaceName] = useState('')
	const [shouldFadeIn] = useState(() => typeof window !== 'undefined' && sessionStorage.getItem(WORKSPACE_TRANSITION_KEY) === '1')
	const searchInput = $search.use.lookup('input') as string
	const searchTerm = debouncedSearchInput.trim()
	const isComposerOpen = $composer.use.lookup('isOpen') as boolean
	const isSearchOpen = $search.use.lookup('isOpen') as boolean

	const refreshWorkspace = useCallback(async (): Promise<void> => {
		try {
			const nextWorkspaceName = await restoreWorkspace(false)
			if (nextWorkspaceName === null) { router.replace('/'); return }
			const snapshot = await listWorkspace()
			const descriptions = await getFolderDescriptions(nextWorkspaceName, snapshot.folders.map((folder) => folder.path))
			const folders: LocalFolderT[] = snapshot.folders.map((folder) => ({ ...folder, description: descriptions.get(folder.path) || undefined }))
			setWorkspaceName(nextWorkspaceName)
			$documents.set({ isLoading: false, list: snapshot.documents })
			$folders.set({ isLoading: false, list: folders })
			setIsReady(true)
			await rememberCurrentWorkspace()
		} catch { router.replace('/') }
	}, [router])

	useEffect(() => { void refreshWorkspace() }, [refreshWorkspace])
	useEffect(() => { if (isReady && shouldFadeIn) sessionStorage.removeItem(WORKSPACE_TRANSITION_KEY) }, [isReady, shouldFadeIn])
	useEffect(() => { const id = window.setTimeout(() => setDebouncedSearchInput(searchInput), 250); return () => window.clearTimeout(id) }, [searchInput])
	useEffect(() => {
		let isCurrent = true
		if (!searchTerm) { $search.set({ isLoading: false, results: [] }); return }
		$search.set.lookup('isLoading', true)
		searchDocuments(searchTerm).then((results) => { if (isCurrent) $search.set({ isLoading: false, results }) })
		return () => { isCurrent = false }
	}, [searchTerm])
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
		beginAppTransition(() => router.push(getEditorHref(document._id)))
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
		if ($composer.state.confirmingFolderId !== folderId) { $composer.set.lookup('confirmingFolderId', folderId); return }
		await removeFolder(folderId)
		$composer.set.lookup('confirmingFolderId', null)
		if ($folders.state.selectedId === folderId) $folders.set.lookup('selectedId', 'uncategorized' as FolderFilterT)
		await refreshWorkspace()
	}
	const handleCreateFolder = async (name: string, description: string): Promise<void> => {
		$composer.set.lookup('isCreating', true)
		const folder = await createFolder(name)
		if (workspaceName) await saveFolderDescription(workspaceName, folder.path, description)
		$folders.set.lookup('selectedId', folder._id as FolderFilterT)
		$composer.set.replace({ folderName: '', folderDescription: '', isCreating: false, isOpen: false, confirmingFolderId: null })
		await refreshWorkspace()
	}
	const handleMoveDocument = async (documentId: string, value: string): Promise<void> => { await moveDocument(documentId, value === 'uncategorized' ? undefined : value); await refreshWorkspace() }
	const handleNavigateToDocument = (documentId: string): void => { $search.set.lookup('isOpen', false); beginAppTransition(() => router.push(getEditorHref(documentId))) }
	const visibilityState = !isReady ? 'hidden' : shouldFadeIn ? 'visible' : 'ready'
	return <div className="documentsPage" data-visibility={visibilityState} data-transition="idle">
		<DocumentsHeader />
		<div className="documentsPageBody">
			<FolderRail workspaceName={workspaceName} onDeleteFolder={handleDeleteFolder} />
			<div className="documentsPageContent"><DocumentsWorkspace onNew={handleNew} onMoveDocument={handleMoveDocument} onShareDocument={handleShareDocument} /></div>
		</div>
		{isComposerOpen && <FolderComposer onSubmit={handleCreateFolder} />}
		{isSearchOpen && <SearchPalette onNavigate={handleNavigateToDocument} />}
	</div>
}

export default DocumentsPage
