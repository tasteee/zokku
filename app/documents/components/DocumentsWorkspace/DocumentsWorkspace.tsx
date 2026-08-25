import './DocumentsWorkspace.css'
import { JSX } from 'react'
import { MagnifyingGlass, Plus } from '@phosphor-icons/react'
import { $documents, $folders, $search, DocumentT, FolderT } from '../../stores'
import { DocumentCard } from '../DocumentCard/DocumentCard'

type DocumentsWorkspacePropsT = {
	onNew: () => Promise<void>
	onMoveDocument: (documentId: string, value: string) => Promise<void>
	onShareDocument: (documentId: string) => void
	onDeleteDocument: (documentId: string) => Promise<void>
}

const SkeletonGrid = (): JSX.Element => (
	<div className="documentsWorkspaceGrid">
		{[0, 1, 2, 3, 4, 5].map((key) => <z-skeleton key={key} shape="rect" height="13rem" />)}
	</div>
)

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
	const newDocumentButtonLabel = isSpecificFolderSelected ? `New in ${selectedFolder?.name ?? 'folder'}` : 'New document'
	const selectedTitle = selectedId === 'all' ? 'All documents' : selectedId === 'uncategorized' ? 'Workspace root' : selectedFolder?.name
	const selectedDescription = selectedId === 'all'
		? `${folders.length} folders, ${documents.length} documents`
		: selectedId === 'uncategorized'
			? 'Documents stored directly in the workspace root.'
			: selectedFolder?.description || 'No description'

	return (
		<main className="documentsWorkspace">
			<div className="documentsWorkspaceHeader">
				<div>
					<z-heading size="lg">{selectedTitle}</z-heading>
					<p className="documentsWorkspaceDescription" title={selectedDescription}>{selectedDescription}</p>
				</div>
				<div className="documentsWorkspaceActions">
					<div className="documentsWorkspaceStats"><span>{filteredDocuments.length} shown</span><span aria-hidden="true">·</span><span>{folders.length} folders</span></div>
					<div className="documentsWorkspaceButtons">
						<z-button kind="ghost" size="sm" onClick={() => $search.set.lookup('isOpen', true)} title="Search documents (⌘K)" aria-label="Search documents">
							<MagnifyingGlass weight="bold" /><span className="documentsWorkspaceSearchHint">⌘K</span>
						</z-button>
						<z-button kind="soft" size="sm" onClick={props.onNew}><Plus weight="bold" />{newDocumentButtonLabel}</z-button>
					</div>
				</div>
			</div>
			{isLoading && <SkeletonGrid />}
			{!isLoading && !hasDocuments && (
				<z-empty-state heading="No Markdown files yet" description="Create your first document here, or add .md files directly to the selected folder on disk." is-bordered>
					<z-button accent="dom" onClick={props.onNew}>Create document</z-button>
				</z-empty-state>
			)}
			{hasDocuments && isFilteredEmpty && (
				<z-empty-state heading="Nothing here yet" description="Move an existing document into this folder or create a new one here." is-bordered>
					<z-button kind="ghost" onClick={props.onNew}>Create in folder</z-button>
				</z-empty-state>
			)}
			{!isLoading && filteredDocuments.length > 0 && (
				<div className="documentsWorkspaceGrid">
					{filteredDocuments.map((document) => <DocumentCard key={document._id} document={document} folders={folders} onMove={props.onMoveDocument} onShare={props.onShareDocument} onDelete={props.onDeleteDocument} />)}
				</div>
			)}
		</main>
	)
}
