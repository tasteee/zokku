import './WorkspaceBrowser.css'
import { FolderOpen, FolderPlus, Trash } from '@phosphor-icons/react'
import { JSX } from 'react'
import { TrashLink } from '@/components/TrashLink'
import type { RecentWorkspaceT } from '@/lib/recentWorkspaces'

type WorkspaceBrowserPropsT = {
	workspaces: RecentWorkspaceT[]
	trashCount: number
	isOpening: boolean
	onOpen: (workspace: RecentWorkspaceT) => void
	onCreate: () => void
	onTrash: (workspace: RecentWorkspaceT) => void
}

export const WorkspaceBrowser = (props: WorkspaceBrowserPropsT): JSX.Element => {
	const hasWorkspaces = props.workspaces.length > 0

	return (
		<main className="workspaceBrowser">
			<div className="workspaceBrowserHeader">
				<div>
					<z-eyebrow label="Workspaces" />
					<z-heading size="lg">Your local workspaces</z-heading>
					<p className="workspaceBrowserDescription">Open a workspace to continue, or choose another folder on this computer.</p>
				</div>
				{hasWorkspaces && (
					<z-button kind="soft" size="sm" onClick={props.onCreate} disabled={props.isOpening}>
						<FolderPlus weight="bold" />
						{props.isOpening ? 'Opening…' : 'Add workspace'}
					</z-button>
				)}
			</div>

			{!hasWorkspaces && (
				<z-empty-state heading={props.isOpening ? 'Opening workspace…' : 'Add a workspace'} description="Choose a folder on this computer to start working with its Markdown files." is-bordered>
					<z-button accent="dom" onClick={props.onCreate} disabled={props.isOpening}>
						<FolderPlus weight="bold" />
						Add a workspace
					</z-button>
				</z-empty-state>
			)}

			{hasWorkspaces && (
				<div className="workspaceBrowserGrid">
					{props.workspaces.map((workspace) => (
						<div key={workspace.id} className="workspaceBrowserCardShell">
							<z-card is-reactive className="workspaceBrowserCard" onClick={() => !props.isOpening && props.onOpen(workspace)}>
								<div className="workspaceBrowserCardBody">
									<div className="workspaceBrowserCardTopline">
										<span>{workspace.noteCount} documents</span>
										<FolderOpen weight="bold" />
									</div>
									<div className="workspaceBrowserCardTitle">{workspace.name}</div>
									<div className="workspaceBrowserCardPath">{workspace.displayPath}</div>
								</div>
								<div className="workspaceBrowserCardFooter">{workspace.folderCount} folders</div>
							</z-card>
							<z-button
								className="workspaceBrowserTrashButton"
								kind="ghost"
								size="sm"
								accent="error"
								title={`Move ${workspace.name} to Trash`}
								aria-label={`Move ${workspace.name} to Trash`}
								onClick={(event: MouseEvent) => { event.stopPropagation(); props.onTrash(workspace) }}
								disabled={props.isOpening}
							>
								<Trash weight="bold" />
							</z-button>
						</div>
					))}
				</div>
			)}

			<TrashLink className="workspaceBrowserTrashLink" count={props.trashCount} />
		</main>
	)
}
