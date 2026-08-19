'use client'

import './WorkspaceBrowser.css'
import { ArrowCounterClockwise, Trash } from '@phosphor-icons/react'
import { JSX } from 'react'
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
					{props.workspaces.map((workspace) => {
						const daysRemaining = Math.max(1, Math.ceil((workspace.expiresAt - Date.now()) / (24 * 60 * 60 * 1000)))
						return (
							<z-card key={workspace.id} className="workspaceBrowserTrashCard">
								<div className="workspaceBrowserCardBody">
									<div className="workspaceBrowserCardTopline">
										<span>Removed in {daysRemaining} {daysRemaining === 1 ? 'day' : 'days'}</span>
										<Trash weight="bold" />
									</div>
									<div className="workspaceBrowserCardTitle">{workspace.name}</div>
									<div className="workspaceBrowserCardPath">{workspace.displayPath}</div>
								</div>
								<div className="workspaceBrowserTrashCardFooter">
									<span>{workspace.noteCount} documents · {workspace.folderCount} folders</span>
									<z-button kind="ghost" size="sm" onClick={() => props.onRestore(workspace)}><ArrowCounterClockwise weight="bold" />Restore</z-button>
								</div>
							</z-card>
						)
					})}
				</div>
			)}
		</main>
	)
}
