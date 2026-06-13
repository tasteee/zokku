'use client'

import './FolderRail.css'
import { JSX } from 'react'
import { FileText, Folder, FolderPlus, Trash } from '@phosphor-icons/react'
import { Id } from '@/convex/_generated/dataModel'
import { $composer, $documents, $folders, DocumentT, FolderFilterT, FolderT } from '../../stores'

type FolderRailPropsT = {
	onDeleteFolder: (folderId: Id<'folders'>) => Promise<void>
}

export const FolderRail = (props: FolderRailPropsT): JSX.Element => {
	const documents = $documents.use.lookup('list') as DocumentT[]
	const folders = $folders.use.lookup('list') as FolderT[]
	const selectedId = $folders.use.lookup('selectedId') as FolderFilterT
	const confirmingFolderId = $composer.use.lookup('confirmingFolderId')

	const totalDocuments = documents.length
	const totalFoldered = documents.filter((document) => document.folderId).length

	const folderCounts = new Map<string, number>()
	for (const document of documents) {
		const folderKey = document.folderId ?? 'uncategorized'
		folderCounts.set(folderKey, (folderCounts.get(folderKey) ?? 0) + 1)
	}

	const uncategorizedCount = folderCounts.get('uncategorized') ?? 0

	const handleSelectFolder = (nextId: FolderFilterT): void => {
		$folders.set.lookup('selectedId', nextId)
		$composer.set.lookup('confirmingFolderId', null)
	}

	return (
		<aside className="folderRail">
			<div className="folderRailSection">
				<button
					className="folderRailItem"
					data-active={selectedId === 'all' ? 'true' : 'false'}
					onClick={() => handleSelectFolder('all')}
				>
					<span className="folderRailItemIcon">
						<FileText weight="bold" />
					</span>
					<span className="folderRailItemText">All documents</span>
					<span className="folderRailItemCount">{totalDocuments}</span>
				</button>

				<button
					className="folderRailItem"
					data-active={selectedId === 'uncategorized' ? 'true' : 'false'}
					onClick={() => handleSelectFolder('uncategorized')}
				>
					<span className="folderRailItemIcon">
						<Folder weight="bold" />
					</span>
					<span className="folderRailItemText">Uncategorized</span>
					<span className="folderRailItemCount">{uncategorizedCount}</span>
				</button>
			</div>

			<div className="folderRailDivider" />

			<div className="folderRailHeader">
				<span>Folders</span>
				<div className="folderRailHeaderActions">
					<span>{totalFoldered}</span>
					<button className="folderRailAddButton" title="New folder" onClick={() => $composer.set.lookup('isOpen', true)}>
						<FolderPlus weight="bold" />
					</button>
				</div>
			</div>

			<div className="folderRailList">
				{folders.map((folder) => {
					const folderCount = folderCounts.get(folder._id) ?? 0
					const isConfirming = confirmingFolderId === folder._id
					const isActive = selectedId === folder._id

					return (
						<div key={folder._id} className="folderRailRow">
							<button
								className="folderRailItem"
								data-active={isActive ? 'true' : 'false'}
								onClick={() => handleSelectFolder(folder._id)}
							>
								<span className="folderRailItemIcon">
									<Folder weight={isActive ? 'fill' : 'bold'} />
								</span>
								<span className="folderRailItemText">{folder.name}</span>
								<span className="folderRailItemCount">{folderCount}</span>
							</button>

							<button
								className="folderRailDeleteButton"
								data-confirm={isConfirming ? 'true' : 'false'}
								title={isConfirming ? 'Confirm delete folder' : 'Delete folder'}
								onClick={() => props.onDeleteFolder(folder._id)}
							>
								{isConfirming ? 'Confirm' : <Trash weight="bold" />}
							</button>
						</div>
					)
				})}
			</div>
		</aside>
	)
}
