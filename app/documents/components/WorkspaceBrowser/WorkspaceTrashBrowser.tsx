import './WorkspaceBrowser.css'

import { JSX } from 'react'
import { WorkspaceTrashCard } from '@/app/trash/TrashCards'
import type { TrashedWorkspaceT } from '@/lib/recentWorkspaces'

type WorkspaceTrashBrowserPropsT = {
	workspaces: TrashedWorkspaceT[]
	onRestore: (workspace: TrashedWorkspaceT) => void
}

export const WorkspaceTrashBrowser = (props: WorkspaceTrashBrowserPropsT): JSX.Element => {
	return (
		<main className="workspaceBrowser">
			<div className="workspaceBrowserHeader">
				<div>
					<z-eyebrow label="Trash" />
					<z-heading size="lg">Deleted workspaces</z-heading>
					<p className="workspaceBrowserDescription">Workspace shortcuts remain here for 30 days. Your folders and files stay untouched on this computer.</p>
				</div>
			</div>

			{props.workspaces.length === 0 ? (
				<z-empty-state heading="Trash is empty" description="Deleted workspace shortcuts will appear here for 30 days." is-bordered />
			) : (
				<div className="workspaceBrowserGrid">
					{props.workspaces.map((workspace) => (
						<WorkspaceTrashCard key={workspace.id} workspace={workspace} onRestore={props.onRestore} />
					))}
				</div>
			)}
		</main>
	)
}
