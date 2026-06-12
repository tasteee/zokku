'use client'

import './DocumentsWorkspace.css'
import { JSX } from 'react'
import { FileText, Folder, MagnifyingGlass, Plus } from '@phosphor-icons/react'
import { Id } from '@/convex/_generated/dataModel'
import { ZButton } from '@/components/zButton'
import { $documents, $folders, $search, DocumentT, FolderT } from '../../stores'
import { DocumentCard } from '../DocumentCard/DocumentCard'

type DocumentsWorkspacePropsT = {
	onNew: () => Promise<void>
	onMoveDocument: (documentId: Id<'documents'>, value: string) => Promise<void>
	onShareDocument: (documentId: string) => void
}

const SkeletonGrid = (): JSX.Element => {
	return (
		<div className="documentsWorkspaceGrid">
			{[0, 1, 2, 3, 4, 5].map((key) => (
				<div key={key} className="documentCardSkeleton" />
			))}
		</div>
	)
}

export const DocumentsWorkspace = (props: DocumentsWorkspacePropsT): JSX.Element => {
	const documents = $documents.use.lookup('list') as DocumentT[]
	const isLoading = $documents.use.lookup('isLoading') as boolean
	const folders = $folders.use.lookup('list') as FolderT[]
	const selectedId = $folders.use.lookup('selectedId')

	const selectedFolder = folders.find((folder) => folder._id === selectedId)

	const filteredDocuments = documents.filter((document) => {
		if (selectedId === 'all') return true
		if (selectedId === 'uncategorized') return !document.folderId
		return document.folderId === selectedId
	})

	const isSpecificFolderSelected = selectedId !== 'all' && selectedId !== 'uncategorized'
	const hasDocuments = !isLoading && documents.length > 0
	const isFilteredEmpty = !isLoading && filteredDocuments.length === 0

	const newDocumentButtonLabel = isSpecificFolderSelected
		? `New in ${selectedFolder?.name ?? 'folder'}`
		: 'New document'

	const selectedTitle =
		selectedId === 'all'
			? 'All documents'
			: selectedId === 'uncategorized'
				? 'Uncategorized'
				: selectedFolder?.name

	const selectedDescription =
		selectedId === 'all'
			? `${folders.length} folders, ${documents.length} documents`
			: selectedId === 'uncategorized'
				? 'Documents without a parent folder'
				: selectedFolder?.description || 'No description'

	const handleOpenSearch = (): void => {
		$search.set.lookup('isOpen', true)
	}

	return (
		<main className="documentsWorkspace">
			<div className="documentsWorkspaceHeader">
				<div>
					<div className="documentsWorkspaceKicker">Library</div>
					<h1 className="documentsWorkspaceTitle">{selectedTitle}</h1>
					<p className="documentsWorkspaceDescription">{selectedDescription}</p>
				</div>

				<div className="documentsWorkspaceActions">
					<div className="documentsWorkspaceStats" aria-label="Document statistics">
						<span>{filteredDocuments.length} shown</span>
						<span>{folders.length} folders</span>
					</div>
					<div className="documentsWorkspaceButtons">
						<button
							className="documentsWorkspaceSearchTrigger"
							type="button"
							onClick={handleOpenSearch}
							title="Search documents (⌘K)"
							aria-label="Search documents"
						>
							<MagnifyingGlass weight="bold" />
							<span className="documentsWorkspaceSearchHint">⌘K</span>
						</button>
						<ZButton isSmall isDim onClick={props.onNew}>
							<Plus weight="bold" />
							{newDocumentButtonLabel}
						</ZButton>
					</div>
				</div>
			</div>

			{isLoading && <SkeletonGrid />}

			{!isLoading && !hasDocuments && (
				<div className="documentsWorkspaceEmpty">
					<div className="documentsWorkspaceEmptyGlyph">
						<FileText weight="bold" />
					</div>
					<h2 className="documentsWorkspaceEmptyTitle">No documents yet</h2>
					<p className="documentsWorkspaceEmptyBody">
						Create your first document, then organize it into folders as the library grows.
					</p>
					<ZButton className="documentsWorkspaceEmptyButton" onClick={props.onNew}>
						Create document
					</ZButton>
				</div>
			)}

			{hasDocuments && isFilteredEmpty && (
				<div className="documentsWorkspaceEmpty documentsWorkspaceEmptyCompact">
					<div className="documentsWorkspaceEmptyGlyph">
						<Folder weight="bold" />
					</div>
					<h2 className="documentsWorkspaceEmptyTitle">Nothing here yet</h2>
					<p className="documentsWorkspaceEmptyBody">
						Move an existing document into this folder or create a new one here.
					</p>
					<ZButton className="documentsWorkspaceEmptyButton" onClick={props.onNew}>
						Create in folder
					</ZButton>
				</div>
			)}

			{!isLoading && filteredDocuments.length > 0 && (
				<div className="documentsWorkspaceGrid">
					{filteredDocuments.map((document) => (
						<DocumentCard
							key={document._id}
							document={document}
							folders={folders}
							onMove={props.onMoveDocument}
							onShare={props.onShareDocument}
						/>
					))}
				</div>
			)}
		</main>
	)
}
