'use client'

import './FolderRail.css'
import { JSX } from 'react'
import { CaretLeft, FileText, Folder, FolderOpen, FolderPlus, Trash } from '@phosphor-icons/react'
import { $composer, $documents, $folders, DocumentT, FolderFilterT, FolderT } from '../../stores'
import type { RecentWorkspaceT } from '@/lib/recentWorkspaces'

type FolderRailPropsT = {
	mode: 'documents' | 'workspaces'
	workspaceCount: number
	workspaces?: RecentWorkspaceT[]
	onShowWorkspaces: () => void
	onCreateWorkspace: () => void
	onOpenWorkspace?: (workspace: RecentWorkspaceT) => void
	onDeleteFolder: (folderId: string) => Promise<void>
}

export const FolderRail = (props: FolderRailPropsT): JSX.Element => {
	const documents = $documents.use.lookup('list') as DocumentT[]
	const folders = $folders.use.lookup('list') as FolderT[]
	const selectedId = $folders.use.lookup('selectedId') as FolderFilterT
	const confirmingFolderId = $composer.use.lookup('confirmingFolderId')
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

	if (props.mode === 'workspaces') {
		const workspaces = props.workspaces ?? []
		return (
			<aside className="folderRail isWorkspaceMode">
				<div className="folderRailHeader">
					<span>Workspaces</span>
					<div className="folderRailHeaderActions">
						<span>{props.workspaceCount}</span>
						<button className="folderRailAddButton" title="Add workspace" aria-label="Add workspace" onClick={props.onCreateWorkspace}><FolderPlus weight="bold" /></button>
					</div>
				</div>
				{workspaces.length === 0 ? (
					<div className="folderRailWorkspaceEmpty">Local folders you open in Zokku will appear here.</div>
				) : (
					<div className="folderRailList">
						{workspaces.map((workspace) => (
							<button key={workspace.id} className="folderRailWorkspaceItem" onClick={() => props.onOpenWorkspace?.(workspace)}>
								<span className="folderRailItemIcon"><FolderOpen weight="duotone" /></span>
								<span className="folderRailWorkspaceText">
									<span className="folderRailWorkspaceName">{workspace.name}</span>
									<span className="folderRailWorkspaceMeta">{workspace.noteCount} notes · {workspace.folderCount} folders</span>
								</span>
							</button>
						))}
					</div>
				)}
			</aside>
		)
	}

	return (
		<aside className="folderRail">
			<button className="folderRailBackLink" onClick={props.onShowWorkspaces}>
				<CaretLeft weight="bold" />
				<span>Workspaces</span>
			</button>
			<div className="folderRailDivider" />
			<div className="folderRailSection">
				<button className="folderRailItem" data-active={selectedId === 'all' ? 'true' : 'false'} onClick={() => handleSelectFolder('all')}>
					<span className="folderRailItemIcon"><FileText weight="bold" /></span><span className="folderRailItemText">All documents</span><span className="folderRailItemCount">{documents.length}</span>
				</button>
				<button className="folderRailItem" data-active={selectedId === 'uncategorized' ? 'true' : 'false'} onClick={() => handleSelectFolder('uncategorized')}>
					<span className="folderRailItemIcon"><Folder weight="bold" /></span><span className="folderRailItemText">Workspace root</span><span className="folderRailItemCount">{uncategorizedCount}</span>
				</button>
			</div>
			<div className="folderRailDivider" />
			<div className="folderRailHeader">
				<span>Folders</span>
				<div className="folderRailHeaderActions"><span>{folders.length}</span><button className="folderRailAddButton" title="New folder" onClick={() => $composer.set.lookup('isOpen', true)}><FolderPlus weight="bold" /></button></div>
			</div>
			<div className="folderRailList">
				{folders.map((folder) => {
					const isConfirming = confirmingFolderId === folder._id
					const isActive = selectedId === folder._id
					return (
						<div key={folder._id} className="folderRailRow">
							<button className="folderRailItem" data-active={isActive ? 'true' : 'false'} onClick={() => handleSelectFolder(folder._id)}>
								<span className="folderRailItemIcon"><Folder weight={isActive ? 'fill' : 'bold'} /></span><span className="folderRailItemText">{folder.name}</span><span className="folderRailItemCount">{folderCounts.get(folder._id) ?? 0}</span>
							</button>
							<button className="folderRailDeleteButton" data-confirm={isConfirming ? 'true' : 'false'} title={isConfirming ? 'Confirm delete folder' : 'Delete folder'} onClick={() => void props.onDeleteFolder(folder._id)}>{isConfirming ? 'Confirm' : <Trash weight="bold" />}</button>
						</div>
					)
				})}
			</div>
		</aside>
	)
}
