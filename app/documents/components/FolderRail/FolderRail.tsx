import './FolderRail.css'
import { JSX } from 'react'
import { Link, useLocation } from 'wouter'
import { CaretLeft, FileText, Folder, FolderPlus, Trash } from '@phosphor-icons/react'
import { $composer, $documents, $folders, DocumentT, FolderFilterT, FolderT } from '../../stores'
import { TrashLink } from '@/components/TrashLink'
import { beginAppTransition } from '@/lib/appTransition'

type FolderRailPropsT = {
	workspaceName: string
	onDeleteFolder: (folderId: string) => Promise<void>
}

export const FolderRail = (props: FolderRailPropsT): JSX.Element => {
	const documents = $documents.use.lookup('list') as DocumentT[]
	const folders = $folders.use.lookup('list') as FolderT[]
	const selectedId = $folders.use.lookup('selectedId') as FolderFilterT
	const folderCounts = new Map<string, number>()
	for (const document of documents) {
		const folderKey = document.folderId ?? 'uncategorized'
		folderCounts.set(folderKey, (folderCounts.get(folderKey) ?? 0) + 1)
	}
	const uncategorizedCount = folderCounts.get('uncategorized') ?? 0

	const handleSelectFolder = (nextId: FolderFilterT): void => {
		$folders.set.lookup('selectedId', nextId)
	}

	const [, navigate] = useLocation()

	return (
		<aside className="folderRail">
			<z-card className="folderRailCard">
				<div className="folderRailWorkspaceHeader">
					<button
						type="button"
						className="folderRailBackLink"
						onClick={() => beginAppTransition(() => navigate('/'))}
					>
						<CaretLeft weight="bold" />
						<span>Back</span>
					</button>

					<div className="folderRailWorkspaceHeaderName" title={props.workspaceName}>
						{props.workspaceName}
					</div>
				</div>
				<z-separator />
				<div className="folderRailSection">
					<div className="folderRailItem">
						<button
							type="button"
							className="folderRailItemButton"
							data-active={selectedId === 'all' ? 'true' : 'false'}
							onClick={() => handleSelectFolder('all')}
						>
							<FileText weight="bold" />
							<span className="folderRailItemText">All documents ({documents.length})</span>
						</button>
					</div>
					<div className="folderRailItem">
						<button
							type="button"
							className="folderRailItemButton"
							data-active={selectedId === 'uncategorized' ? 'true' : 'false'}
							onClick={() => handleSelectFolder('uncategorized')}
						>
							<Folder weight="bold" />
							<span className="folderRailItemText">Workspace root ({uncategorizedCount})</span>
						</button>
					</div>
				</div>
				<z-separator />
				<div className="folderRailHeader">
					<span>Folders</span>
					<div className="folderRailHeaderActions">
						<span>{folders.length}</span>
						<z-button
							kind="ghost"
							size="sm"
							title="New folder"
							aria-label="New folder"
							onClick={() => $composer.set.lookup('isOpen', true)}
						>
							<FolderPlus weight="bold" />
						</z-button>
					</div>
				</div>
				<div className="folderRailList">
					{folders.map((folder) => {
						const isActive = selectedId === folder._id
						return (
							<div key={folder._id} className="folderRailItem">
								<button
									type="button"
									className="folderRailItemButton"
									data-active={isActive ? 'true' : 'false'}
									onClick={() => handleSelectFolder(folder._id)}
								>
									<Folder weight={isActive ? 'fill' : 'bold'} />
									<span className="folderRailItemText">
										{folder.name} ({folderCounts.get(folder._id) ?? 0})
									</span>
								</button>
								<z-alert-dialog
									heading={`Delete "${folder.name}"?`}
									description="Documents inside move to the workspace root. This can't be undone."
									accent="error"
									confirm-label="Delete"
									onconfirm={() => void props.onDeleteFolder(folder._id)}
								>
									<z-button
										slot="trigger"
										kind="ghost"
										size="sm"
										accent="error"
										title="Delete folder"
										aria-label="Delete folder"
									>
										<Trash weight="bold" />
									</z-button>
								</z-alert-dialog>
							</div>
						)
					})}
				</div>
				<z-separator />
				<TrashLink className="folderRailFooterLink" />
			</z-card>
		</aside>
	)
}
