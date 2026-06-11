'use client'

import './page.css'
import { ChangeEvent, FormEvent, JSX, useMemo, useState } from 'react'
import { useQuery, useMutation } from 'convex/react'
import { useAuthActions } from '@convex-dev/auth/react'
import { FileText, Folder, FolderPlus, Plus, Trash, X } from '@phosphor-icons/react'
import { useRouter } from 'next/navigation'
import { api } from '@/convex/_generated/api'
import { Id } from '@/convex/_generated/dataModel'
import { ZButton } from '@/components/zButton'

type FolderFilterT = 'all' | 'uncategorized' | Id<'folders'>

const formatRelativeTime = (timestamp: number): string => {
	const nowMs = Date.now()
	const diffMs = nowMs - timestamp
	const diffMinutes = Math.floor(diffMs / 60_000)
	const diffHours = Math.floor(diffMs / 3_600_000)
	const diffDays = Math.floor(diffMs / 86_400_000)

	const isJustNow = diffMinutes < 1
	if (isJustNow) return 'Just now'

	const isUnderAnHour = diffMinutes < 60
	if (isUnderAnHour) return `${diffMinutes}m ago`

	const isUnderADay = diffHours < 24
	if (isUnderADay) return `${diffHours}h ago`

	const isUnderAWeek = diffDays < 7
	if (isUnderAWeek) return `${diffDays}d ago`

	return new Date(timestamp).toLocaleDateString('en-US', {
		month: 'short',
		day: 'numeric',
		year: 'numeric'
	})
}

const getContentPreview = (content: string): string => {
	const withoutHeadings = content.replace(/^#{1,6}\s+.*/gm, '')
	const withoutMarkup = withoutHeadings.replace(/[*_`~>\[\]]/g, '')
	const normalized = withoutMarkup.replace(/\s+/g, ' ').trim()
	return normalized.slice(0, 160)
}

const DocumentsPage = (): JSX.Element => {
	const documents = useQuery(api.documents.list)
	const folders = useQuery(api.folders.list)

	const createDocument = useMutation(api.documents.create)
	const moveDocument = useMutation(api.documents.move)
	const createFolder = useMutation(api.folders.create)
	const removeFolder = useMutation(api.folders.remove)
	const { signOut } = useAuthActions()
	const router = useRouter()

	const [copiedId, setCopiedId] = useState<string | null>(null)
	const [selectedFolderId, setSelectedFolderId] = useState<FolderFilterT>('all')
	const [isFolderComposerOpen, setIsFolderComposerOpen] = useState(false)
	const [folderName, setFolderName] = useState('')
	const [folderDescription, setFolderDescription] = useState('')
	const [confirmingFolderId, setConfirmingFolderId] = useState<string | null>(null)
	const [isCreatingFolder, setIsCreatingFolder] = useState(false)

	const safeDocuments = documents ?? []
	const safeFolders = folders ?? []

	const folderCounts = useMemo(() => {
		const counts = new Map<string, number>()
		for (const document of safeDocuments) {
			const folderKey = document.folderId ?? 'uncategorized'
			counts.set(folderKey, (counts.get(folderKey) ?? 0) + 1)
		}
		return counts
	}, [safeDocuments])

	const selectedFolder = safeFolders.find((folder) => folder._id === selectedFolderId)
	const filteredDocuments = safeDocuments.filter((document) => {
		if (selectedFolderId === 'all') return true
		if (selectedFolderId === 'uncategorized') return !document.folderId
		return document.folderId === selectedFolderId
	})

	const isLoading = documents === undefined || folders === undefined
	const hasDocuments = !isLoading && safeDocuments.length > 0
	const isFilteredEmpty = !isLoading && filteredDocuments.length === 0
	const totalFoldered = safeDocuments.filter((document) => document.folderId).length
	const uncategorizedCount = folderCounts.get('uncategorized') ?? 0
	const skeletonKeys = [0, 1, 2, 3, 4, 5]
	const selectedTitle =
		selectedFolderId === 'all' ? 'All documents' : selectedFolderId === 'uncategorized' ? 'Uncategorized' : selectedFolder?.name
	const selectedDescription =
		selectedFolderId === 'all'
			? `${safeFolders.length} folders, ${safeDocuments.length} documents`
			: selectedFolderId === 'uncategorized'
				? 'Documents without a parent folder'
				: selectedFolder?.description || 'No description'

	const handleNew = async (): Promise<void> => {
		const folderId = selectedFolderId !== 'all' && selectedFolderId !== 'uncategorized' ? selectedFolderId : undefined
		const documentId = await createDocument({ folderId })
		router.push(`/documents/${documentId}`)
	}

	const handleSignOut = async (): Promise<void> => {
		await signOut()
		router.push('/sign-in')
	}

	const handleShare = (docId: string): void => {
		const previewUrl = `${window.location.origin}/documents/${docId}/preview`
		navigator.clipboard.writeText(previewUrl)
		setCopiedId(docId)
		setTimeout(() => setCopiedId(null), 2000)
	}

	const handleCreateFolder = async (event: FormEvent<HTMLFormElement>): Promise<void> => {
		event.preventDefault()
		const nextName = folderName.trim()
		const nextDescription = folderDescription.trim()
		if (!nextName) return

		setIsCreatingFolder(true)
		try {
			const folderId = await createFolder({
				name: nextName,
				description: nextDescription || undefined
			})
			setSelectedFolderId(folderId)
			setFolderName('')
			setFolderDescription('')
			setIsFolderComposerOpen(false)
		} finally {
			setIsCreatingFolder(false)
		}
	}

	const handleDeleteFolder = async (folderId: Id<'folders'>): Promise<void> => {
		const isConfirming = confirmingFolderId === folderId
		if (!isConfirming) {
			setConfirmingFolderId(folderId)
			return
		}

		await removeFolder({ id: folderId })
		setConfirmingFolderId(null)
		if (selectedFolderId === folderId) setSelectedFolderId('uncategorized')
	}

	const handleMoveDocument = async (documentId: Id<'documents'>, value: string): Promise<void> => {
		const folderId = value === 'uncategorized' ? undefined : (value as Id<'folders'>)
		await moveDocument({ id: documentId, folderId })
	}

	return (
		<div className="DocumentsHome">
			<header className="DocumentsHomeHeader">
				<span className="DocumentsHomeBrand">
					<span className="DocumentsHomeBrandDot" />
					Zokku
				</span>

				<div className="DocumentsHomeHeaderActions">
					<ZButton isSmall isOutlined isNeutral onClick={() => setIsFolderComposerOpen(true)}>
						<FolderPlus weight="bold" />
						New folder
					</ZButton>
					<ZButton isSmall isOutlined isPink className="DocumentsNewButton" onClick={handleNew}>
						<Plus weight="bold" />
						New document
					</ZButton>
					<ZButton isSmall isOutlined isNeutral className="DocumentsSignOutButton" onClick={handleSignOut}>
						Sign out
					</ZButton>
				</div>
			</header>

			<div className="DocumentsHomeBody">
				<aside className="DocumentsFolderRail">
					<div className="DocumentsRailSection">
						<button
							className="DocumentsFolderItem"
							data-active={selectedFolderId === 'all' ? 'true' : 'false'}
							onClick={() => setSelectedFolderId('all')}
						>
							<span className="DocumentsFolderItemIcon">
								<FileText weight="bold" />
							</span>
							<span className="DocumentsFolderItemText">All documents</span>
							<span className="DocumentsFolderItemCount">{safeDocuments.length}</span>
						</button>
						<button
							className="DocumentsFolderItem"
							data-active={selectedFolderId === 'uncategorized' ? 'true' : 'false'}
							onClick={() => setSelectedFolderId('uncategorized')}
						>
							<span className="DocumentsFolderItemIcon">
								<Folder weight="bold" />
							</span>
							<span className="DocumentsFolderItemText">Uncategorized</span>
							<span className="DocumentsFolderItemCount">{uncategorizedCount}</span>
						</button>
					</div>

					<div className="DocumentsRailDivider" />

					<div className="DocumentsRailHeader">
						<span>Folders</span>
						<span>{totalFoldered}</span>
					</div>

					<div className="DocumentsFolderList">
						{safeFolders.map((folder) => {
							const folderCount = folderCounts.get(folder._id) ?? 0
							const isConfirming = confirmingFolderId === folder._id

							return (
								<div key={folder._id} className="DocumentsFolderRow">
									<button
										className="DocumentsFolderItem"
										data-active={selectedFolderId === folder._id ? 'true' : 'false'}
										onClick={() => {
											setSelectedFolderId(folder._id)
											setConfirmingFolderId(null)
										}}
									>
										<span className="DocumentsFolderItemIcon">
											<Folder weight={selectedFolderId === folder._id ? 'fill' : 'bold'} />
										</span>
										<span className="DocumentsFolderItemText">{folder.name}</span>
										<span className="DocumentsFolderItemCount">{folderCount}</span>
									</button>
									<button
										className="DocumentsFolderDelete"
										data-confirm={isConfirming ? 'true' : 'false'}
										title={isConfirming ? 'Confirm delete folder' : 'Delete folder'}
										onClick={() => handleDeleteFolder(folder._id)}
									>
										{isConfirming ? 'Confirm' : <Trash weight="bold" />}
									</button>
								</div>
							)
						})}
					</div>
				</aside>

				<main className="DocumentsWorkspace">
					<div className="DocumentsWorkspaceHeader">
						<div>
							<div className="DocumentsWorkspaceKicker">Library</div>
							<h1 className="DocumentsWorkspaceTitle">{selectedTitle}</h1>
							<p className="DocumentsWorkspaceDescription">{selectedDescription}</p>
						</div>
						<div className="DocumentsWorkspaceStats" aria-label="Document statistics">
							<span>{filteredDocuments.length} shown</span>
							<span>{safeFolders.length} folders</span>
						</div>
					</div>

					{isLoading && (
						<div className="DocumentsGrid">
							{skeletonKeys.map((key) => (
								<div key={key} className="DocumentCardSkeleton" />
							))}
						</div>
					)}

					{!isLoading && !hasDocuments && (
						<div className="DocumentsEmpty">
							<div className="DocumentsEmptyGlyph">
								<FileText weight="bold" />
							</div>
							<h2 className="DocumentsEmptyTitle">No documents yet</h2>
							<p className="DocumentsEmptyBody">Create your first document, then organize it into folders as the library grows.</p>
							<ZButton className="DocumentsEmptyButton" onClick={handleNew}>
								Create document
							</ZButton>
						</div>
					)}

					{hasDocuments && isFilteredEmpty && (
						<div className="DocumentsEmpty DocumentsEmptyCompact">
							<div className="DocumentsEmptyGlyph">
								<Folder weight="bold" />
							</div>
							<h2 className="DocumentsEmptyTitle">Nothing here yet</h2>
							<p className="DocumentsEmptyBody">Move an existing document into this folder or create a new one here.</p>
							<ZButton className="DocumentsEmptyButton" onClick={handleNew}>
								Create in folder
							</ZButton>
						</div>
					)}

					{!isLoading && filteredDocuments.length > 0 && (
						<div className="DocumentsGrid">
							{filteredDocuments.map((doc) => {
								const relativeTime = formatRelativeTime(doc.updatedAt)
								const preview = getContentPreview(doc.content)
								const hasPreview = preview.length > 0
								const titleLabel = doc.title || 'Untitled'
								const isCopied = copiedId === doc._id
								const shareLabel = isCopied ? 'Copied' : 'Share'
								const folder = safeFolders.find((item) => item._id === doc.folderId)
								const folderLabel = folder?.name ?? 'Uncategorized'

								return (
									<article key={doc._id} className="DocumentCard" onClick={() => router.push(`/documents/${doc._id}`)}>
										<div className="DocumentCardBody">
											<div className="DocumentCardTopline">
												<span>{folderLabel}</span>
												<span>Edited {relativeTime}</span>
											</div>
											<div className="DocumentCardTitle">{titleLabel}</div>
											{hasPreview && <div className="DocumentCardPreview">{preview}</div>}
										</div>
										<div className="DocumentCardActions">
											<label className="DocumentMoveControl" onClick={(event) => event.stopPropagation()}>
												<span>Move to</span>
												<select
													value={doc.folderId ?? 'uncategorized'}
													onChange={(event: ChangeEvent<HTMLSelectElement>) => handleMoveDocument(doc._id, event.target.value)}
												>
													<option value="uncategorized">Uncategorized</option>
													{safeFolders.map((folderOption) => (
														<option key={folderOption._id} value={folderOption._id}>
															{folderOption.name}
														</option>
													))}
												</select>
											</label>
											<button
												className="DocumentCardShareButton"
												onClick={(event) => {
													event.stopPropagation()
													handleShare(doc._id)
												}}
												data-copied={isCopied ? 'true' : 'false'}
											>
												{shareLabel}
											</button>
										</div>
									</article>
								)
							})}
						</div>
					)}
				</main>
			</div>

			{isFolderComposerOpen && (
				<div className="DocumentsModalBackdrop" role="presentation" onMouseDown={() => setIsFolderComposerOpen(false)}>
					<form className="DocumentsFolderComposer" onSubmit={handleCreateFolder} onMouseDown={(event) => event.stopPropagation()}>
						<div className="DocumentsFolderComposerHeader">
							<div>
								<div className="DocumentsWorkspaceKicker">New folder</div>
								<h2>Create a folder</h2>
							</div>
							<button className="DocumentsModalClose" type="button" onClick={() => setIsFolderComposerOpen(false)} title="Close">
								<X weight="bold" />
							</button>
						</div>

						<label className="DocumentsField">
							<span>Name</span>
							<input
								value={folderName}
								onChange={(event) => setFolderName(event.target.value)}
								placeholder="Product notes"
								autoFocus
							/>
						</label>

						<label className="DocumentsField">
							<span>Description</span>
							<textarea
								value={folderDescription}
								onChange={(event) => setFolderDescription(event.target.value)}
								placeholder="Optional context for this collection"
							/>
						</label>

						<div className="DocumentsFolderComposerActions">
							<ZButton isSmall isOutlined isNeutral type="button" onClick={() => setIsFolderComposerOpen(false)}>
								Cancel
							</ZButton>
							<ZButton isSmall isSolid isPink type="submit" isDisabled={!folderName.trim() || isCreatingFolder}>
								Create folder
							</ZButton>
						</div>
					</form>
				</div>
			)}
		</div>
	)
}

export default DocumentsPage
