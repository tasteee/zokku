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
import {
	createDocument,
	createFolder,
	listWorkspace,
	moveDocument,
	removeFolder,
	restoreWorkspace,
	searchDocuments
} from '@/lib/localWorkspace'
import type { LocalDocumentT } from '@/lib/localWorkspace'

const WORKSPACE_TRANSITION_KEY = 'zokku-workspace-transition'

const DocumentsPage = (): JSX.Element => {
	const router = useRouter()
	const [debouncedSearchInput, setDebouncedSearchInput] = useState('')
	const [isReady, setIsReady] = useState(false)
	const [shouldFadeIn] = useState(() => typeof window !== 'undefined' && sessionStorage.getItem(WORKSPACE_TRANSITION_KEY) === '1')
	const searchInput = $search.use.lookup('input') as string
	const searchTerm = debouncedSearchInput.trim()
	const isComposerOpen = $composer.use.lookup('isOpen') as boolean
	const isSearchOpen = $search.use.lookup('isOpen') as boolean

	const refreshWorkspace = useCallback(async (): Promise<void> => {
		try {
			const workspaceName = await restoreWorkspace(false)
			if (workspaceName === null) {
				router.replace('/')
				return
			}
			const snapshot = await listWorkspace()
			$documents.set({ isLoading: false, list: snapshot.documents })
			$folders.set({ isLoading: false, list: snapshot.folders })
			setIsReady(true)
		} catch {
			router.replace('/')
		}
	}, [router])

	useEffect(() => {
		refreshWorkspace()
	}, [refreshWorkspace])

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
		return () => {
			isCurrent = false
		}
	}, [searchTerm])

	useEffect(() => {
		const handleKeyDown = (event: KeyboardEvent): void => {
			const isCommandK = (event.metaKey || event.ctrlKey) && event.key.toLowerCase() === 'k'
			if (isCommandK) {
				event.preventDefault()
				$search.set.lookup('isOpen', true)
				return
			}
			if (event.key === 'Escape' && $search.state.isOpen) $search.set.lookup('isOpen', false)
		}
		window.addEventListener('keydown', handleKeyDown)
		return () => window.removeEventListener('keydown', handleKeyDown)
	}, [])

	const handleNew = async (): Promise<void> => {
		const selectedId = $folders.state.selectedId
		const folderId = selectedId !== 'all' && selectedId !== 'uncategorized' ? selectedId : undefined
		const document = await createDocument(folderId)
		router.push(`/documents/${document._id}`)
	}

	const handleLeaveWorkspace = (): void => {
		router.push('/')
	}

	const handleShareDocument = (documentId: string): void => {
		const documents = $documents.state.list as LocalDocumentT[]
		const document = documents.find((candidate) => candidate._id === documentId)
		if (document === undefined) return

		const escapedTitle = document.title.replaceAll('[', '\\[').replaceAll(']', '\\]') || 'Untitled'
		const markdownLink = `[${escapedTitle}](</${document.path}>)`
		void navigator.clipboard.writeText(markdownLink)
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

	const handleCreateFolder = async (name: string, _description: string): Promise<void> => {
		$composer.set.lookup('isCreating', true)
		const folder = await createFolder(name)
		$folders.set.lookup('selectedId', folder._id as FolderFilterT)
		$composer.set.replace({
			folderName: '',
			folderDescription: '',
			isCreating: false,
			isOpen: false,
			confirmingFolderId: null
		})
		await refreshWorkspace()
	}

	const handleMoveDocument = async (documentId: string, value: string): Promise<void> => {
		const folderId = value === 'uncategorized' ? undefined : value
		await moveDocument(documentId, folderId)
		await refreshWorkspace()
	}

	const handleNavigateToDocument = (documentId: string): void => {
		$search.set.lookup('isOpen', false)
		router.push(`/documents/${documentId}`)
	}

	const visibilityState = !isReady ? 'hidden' : shouldFadeIn ? 'visible' : 'ready'

	return (
		<div className="documentsPage" data-visibility={visibilityState}>
			<DocumentsHeader onSignOut={handleLeaveWorkspace} />
			<div className="documentsPageBody">
				<FolderRail onDeleteFolder={handleDeleteFolder} />
				<DocumentsWorkspace onNew={handleNew} onMoveDocument={handleMoveDocument} onShareDocument={handleShareDocument} />
			</div>
			{isComposerOpen && <FolderComposer onSubmit={handleCreateFolder} />}
			{isSearchOpen && <SearchPalette onNavigate={handleNavigateToDocument} />}
		</div>
	)
}

export default DocumentsPage