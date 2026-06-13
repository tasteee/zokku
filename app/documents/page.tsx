'use client'

import './page.css'
import { $composer, $documents, $folders, $search, FolderFilterT } from './stores'
import { DocumentsHeader } from './components/DocumentsHeader/DocumentsHeader'
import { FolderRail } from './components/FolderRail/FolderRail'
import { DocumentsWorkspace } from './components/DocumentsWorkspace/DocumentsWorkspace'
import { FolderComposer } from './components/FolderComposer/FolderComposer'
import { SearchPalette } from './components/SearchPalette/SearchPalette'

import { JSX, useEffect, useState } from 'react'
import { useQuery, useMutation } from 'convex/react'
import { useAuthActions } from '@convex-dev/auth/react'
import { useRouter } from 'next/navigation'
import { api } from '@/convex/_generated/api'
import { Id } from '@/convex/_generated/dataModel'

const DocumentsPage = (): JSX.Element => {
	const documents = useQuery(api.documents.list)
	const folders = useQuery(api.folders.list)

	const createDocument = useMutation(api.documents.create)
	const moveDocument = useMutation(api.documents.move)
	const createFolder = useMutation(api.folders.create)
	const removeFolder = useMutation(api.folders.remove)

	const [debouncedSearchInput, setDebouncedSearchInput] = useState('')
	const searchInput = $search.use.lookup('input') as string
	const searchTerm = debouncedSearchInput.trim()
	const searchResults = useQuery(api.documents.search, searchTerm ? { query: searchTerm } : 'skip')

	const { signOut } = useAuthActions()
	const router = useRouter()

	const isComposerOpen = $composer.use.lookup('isOpen') as boolean
	const isSearchOpen = $search.use.lookup('isOpen') as boolean

	useEffect(() => {
		const isLoading = documents === undefined
		$documents.set({ isLoading, list: documents ?? [] })
	}, [documents])

	useEffect(() => {
		const isLoading = folders === undefined
		$folders.set({ isLoading, list: folders ?? [] })
	}, [folders])

	useEffect(() => {
		const isLoading = !!searchTerm && searchResults === undefined
		$search.set({ isLoading, results: searchResults ?? [] })
	}, [searchResults, searchTerm])

	useEffect(() => {
		const timeoutId = window.setTimeout(() => {
			setDebouncedSearchInput(searchInput)
		}, 400)
		return () => window.clearTimeout(timeoutId)
	}, [searchInput])

	useEffect(() => {
		const handleKeyDown = (event: KeyboardEvent): void => {
			const isMetaOrCtrl = event.metaKey || event.ctrlKey
			const isCommandK = isMetaOrCtrl && event.key === 'k'

			if (isCommandK) {
				event.preventDefault()
				$search.set.lookup('isOpen', true)
				return
			}

			const isEscapeWhileOpen = event.key === 'Escape' && $search.state.isOpen
			if (isEscapeWhileOpen) $search.set.lookup('isOpen', false)
		}

		window.addEventListener('keydown', handleKeyDown)
		return () => window.removeEventListener('keydown', handleKeyDown)
	}, [])

	const handleNew = async (): Promise<void> => {
		const selectedId = $folders.state.selectedId
		const isSpecificFolder = selectedId !== 'all' && selectedId !== 'uncategorized'
		const folderId = isSpecificFolder ? (selectedId as Id<'folders'>) : undefined
		const documentId = await createDocument({ folderId })
		router.push(`/documents/${documentId}`)
	}

	const handleSignOut = async (): Promise<void> => {
		await signOut()
		router.push('/sign-in')
	}

	const handleShareDocument = (documentId: string): void => {
		const previewUrl = `${window.location.origin}/documents/${documentId}/preview`
		navigator.clipboard.writeText(previewUrl)
		$folders.set.lookup('copiedId', documentId)
		setTimeout(() => $folders.set.lookup('copiedId', ''), 2000)
	}

	const handleDeleteFolder = async (folderId: Id<'folders'>): Promise<void> => {
		const isConfirming = $composer.state.confirmingFolderId === folderId
		if (!isConfirming) {
			$composer.set.lookup('confirmingFolderId', folderId)
			return
		}

		await removeFolder({ id: folderId })
		$composer.set.lookup('confirmingFolderId', null)

		const isSelectedFolder = $folders.state.selectedId === folderId
		if (isSelectedFolder) $folders.set.lookup('selectedId', 'uncategorized' as FolderFilterT)
	}

	const handleCreateFolder = async (name: string, description: string): Promise<void> => {
		$composer.set.lookup('isCreating', true)
		const folderId = await createFolder({ name, description: description || undefined })
		$folders.set.lookup('selectedId', folderId as FolderFilterT)
		$composer.set.replace({
			folderName: '',
			folderDescription: '',
			isCreating: false,
			isOpen: false,
			confirmingFolderId: null
		})
	}

	const handleMoveDocument = async (documentId: Id<'documents'>, value: string): Promise<void> => {
		const folderId = value === 'uncategorized' ? undefined : (value as Id<'folders'>)
		await moveDocument({ id: documentId, folderId })
	}

	const handleNavigateToDocument = (documentId: Id<'documents'>): void => {
		$search.set.lookup('isOpen', false)
		router.push(`/documents/${documentId}`)
	}

	return (
		<div className="documentsPage">
			<DocumentsHeader onSignOut={handleSignOut} />

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
