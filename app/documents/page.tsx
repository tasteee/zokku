'use client'

import './page.css'
import { $composer, $documents, $folders, $search, FolderFilterT } from './stores'
import { DocumentsHeader } from './components/DocumentsHeader/DocumentsHeader'
import { FolderRail } from './components/FolderRail/FolderRail'
import { DocumentsWorkspace } from './components/DocumentsWorkspace/DocumentsWorkspace'
import { WorkspaceBrowser } from './components/WorkspaceBrowser/WorkspaceBrowser'
import { FolderComposer } from './components/FolderComposer/FolderComposer'
import { SearchPalette } from './components/SearchPalette/SearchPalette'

import { JSX, useCallback, useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import {
	chooseWorkspace,
	createDocument,
	createFolder,
	listWorkspace,
	moveDocument,
	removeFolder,
	restoreWorkspace,
	searchDocuments
} from '@/lib/localWorkspace'
import type { LocalDocumentT, LocalFolderT } from '@/lib/localWorkspace'
import { ensureWorkspaceGuide } from '@/lib/ensureWorkspaceGuide'
import { getFolderDescriptions, saveFolderDescription } from '@/lib/folderDescriptions'
import { activateRecentWorkspace, listRecentWorkspaces, rememberCurrentWorkspace } from '@/lib/recentWorkspaces'
import type { RecentWorkspaceT } from '@/lib/recentWorkspaces'
import { beginAppTransition } from '@/lib/appTransition'

const WORKSPACE_TRANSITION_KEY = 'zokku-workspace-transition'

type BrowserModeT = 'documents' | 'workspaces'
type ContentTransitionT = 'idle' | 'out' | 'in'

const DocumentsPage = (): JSX.Element => {
	const router = useRouter()
	const [debouncedSearchInput, setDebouncedSearchInput] = useState('')
	const [isReady, setIsReady] = useState(false)
	const [workspaceName, setWorkspaceName] = useState('')
	const [mode, setMode] = useState<BrowserModeT>('documents')
	const [contentTransition, setContentTransition] = useState<ContentTransitionT>('idle')
	const [recentWorkspaces, setRecentWorkspaces] = useState<RecentWorkspaceT[]>([])
	const [isOpeningWorkspace, setIsOpeningWorkspace] = useState(false)
	const [shouldFadeIn] = useState(() => typeof window !== 'undefined' && sessionStorage.getItem(WORKSPACE_TRANSITION_KEY) === '1')
	const searchInput = $search.use.lookup('input') as string
	const searchTerm = debouncedSearchInput.trim()
	const isComposerOpen = $composer.use.lookup('isOpen') as boolean
	const isSearchOpen = $search.use.lookup('isOpen') as boolean

	const refreshRecentWorkspaces = useCallback(async (): Promise<void> => {
		setRecentWorkspaces(await listRecentWorkspaces())
	}, [])

	const refreshWorkspace = useCallback(async (): Promise<void> => {
		try {
			const nextWorkspaceName = await restoreWorkspace(false)
			if (nextWorkspaceName === null) {
				router.replace('/')
				return
			}
			const snapshot = await listWorkspace()
			const descriptions = await getFolderDescriptions(nextWorkspaceName, snapshot.folders.map((folder) => folder.path))
			const folders: LocalFolderT[] = snapshot.folders.map((folder) => ({ ...folder, description: descriptions.get(folder.path) || undefined }))
			setWorkspaceName(nextWorkspaceName)
			$documents.set({ isLoading: false, list: snapshot.documents })
			$folders.set({ isLoading: false, list: folders })
			setIsReady(true)
			await rememberCurrentWorkspace()
			await refreshRecentWorkspaces()
		} catch {
			router.replace('/')
		}
	}, [refreshRecentWorkspaces, router])

	useEffect(() => { void refreshWorkspace() }, [refreshWorkspace])
	useEffect(() => {
		if (!isReady || !shouldFadeIn) return
		sessionStorage.removeItem(WORKSPACE_TRANSITION_KEY)
	}, [isReady, shouldFadeIn])
	useEffect(() => {
		const timeoutId = window.setTimeout(() => setDebouncedSearchInput(searchInput), 250)
		return () => window.clearTimeout(timeoutId)
	}, [searchInput])
	useEffect(() => {
		let isCurrent = true
		if (!searchTerm) {
			$search.set({ isLoading: false, results: [] })
			return
		}
		$search.set.lookup('isLoading', true)
		searchDocuments(searchTerm).then((results) => {
			if (!isCurrent) return
			$search.set({ isLoading: false, results })
		})
		return () => { isCurrent = false }
	}, [searchTerm])
	useEffect(() => {
		const handleKeyDown = (event: KeyboardEvent): void => {
			const isCommandK = (event.metaKey || event.ctrlKey) && event.key.toLowerCase() === 'k'
			if (isCommandK && mode === 'documents') {
				event.preventDefault()
				$search.set.lookup('isOpen', true)
				return
			}
			if (event.key === 'Escape' && $search.state.isOpen) $search.set.lookup('isOpen', false)
		}
		window.addEventListener('keydown', handleKeyDown)
		return () => window.removeEventListener('keydown', handleKeyDown)
	}, [mode])

	const transitionMode = (nextMode: BrowserModeT): void => {
		if (nextMode === mode || contentTransition !== 'idle') return
		setContentTransition('out')
		window.setTimeout(() => {
			setMode(nextMode)
			setContentTransition('in')
			window.setTimeout(() => setContentTransition('idle'), 500)
		}, 300)
	}

	const handleNew = async (): Promise<void> => {
		const selectedId = $folders.state.selectedId
		const folderId = selectedId !== 'all' && selectedId !== 'uncategorized' ? selectedId : undefined
		const document = await createDocument(folderId)
		beginAppTransition(() => router.push(`/documents/${document._id}`))
	}

	const handleShareDocument = (documentId: string): void => {
		const documents = $documents.state.list as LocalDocumentT[]
		const document = documents.find((candidate) => candidate._id === documentId)
		if (document === undefined) return
		const escapedTitle = document.title.replaceAll('[', '\\[').replaceAll(']', '\\]') || 'Untitled'
		void navigator.clipboard.writeText(`[${escapedTitle}](</${document.path}>)`)
		$folders.set.lookup('copiedId', documentId)
		setTimeout(() => $folders.set.lookup('copiedId', ''), 2000)
	}

	const handleDeleteFolder = async (folderId: string): Promise<void> => {
		const isConfirming = $composer.state.confirmingFolderId === folderId
		if (!isConfirming) {
			$composer.set.lookup('confirmingFolderId', folderId)
			return
		}
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

	const handleMoveDocument = async (documentId: string, value: string): Promise<void> => {
		await moveDocument(documentId, value === 'uncategorized' ? undefined : value)
		await refreshWorkspace()
	}
	const handleNavigateToDocument = (documentId: string): void => {
		$search.set.lookup('isOpen', false)
		beginAppTransition(() => router.push(`/documents/${documentId}`))
	}

	const handleCreateWorkspace = async (): Promise<void> => {
		setIsOpeningWorkspace(true)
		try {
			await chooseWorkspace()
			await ensureWorkspaceGuide()
			await rememberCurrentWorkspace()
			$folders.set.lookup('selectedId', 'all')
			await refreshWorkspace()
			transitionMode('documents')
		} finally {
			setIsOpeningWorkspace(false)
		}
	}

	const handleOpenWorkspace = async (workspace: RecentWorkspaceT): Promise<void> => {
		setIsOpeningWorkspace(true)
		try {
			const isActivated = await activateRecentWorkspace(workspace.id)
			if (!isActivated) return
			sessionStorage.setItem(WORKSPACE_TRANSITION_KEY, '1')
			const root = document.querySelector<HTMLElement>('.documentsPage')
			if (root !== null) root.dataset.transition = 'out'
			window.setTimeout(() => window.location.assign('/documents'), 300)
		} finally {
			window.setTimeout(() => setIsOpeningWorkspace(false), 300)
		}
	}

	const visibilityState = !isReady ? 'hidden' : shouldFadeIn ? 'visible' : 'ready'

	return (
		<div className="documentsPage" data-visibility={visibilityState} data-transition="idle">
			<DocumentsHeader />
			<div className="documentsPageBody">
				<FolderRail
					mode={mode}
					workspaceCount={recentWorkspaces.length}
					workspaces={recentWorkspaces}
					onShowWorkspaces={() => transitionMode('workspaces')}
					onCreateWorkspace={() => void handleCreateWorkspace()}
					onOpenWorkspace={(workspace) => void handleOpenWorkspace(workspace)}
					onDeleteFolder={handleDeleteFolder}
				/>
				<div className="documentsPageContent" data-transition={contentTransition}>
					{mode === 'documents' ? (
						<DocumentsWorkspace onNew={handleNew} onMoveDocument={handleMoveDocument} onShareDocument={handleShareDocument} />
					) : (
						<WorkspaceBrowser workspaces={recentWorkspaces} isOpening={isOpeningWorkspace} onOpen={(workspace) => void handleOpenWorkspace(workspace)} onCreate={() => void handleCreateWorkspace()} />
					)}
				</div>
			</div>
			{isComposerOpen && mode === 'documents' && <FolderComposer onSubmit={handleCreateFolder} />}
			{isSearchOpen && mode === 'documents' && <SearchPalette onNavigate={handleNavigateToDocument} />}
		</div>
	)
}

export default DocumentsPage
