'use client'

import './WorkspaceBrowser.css'
import { FolderOpen } from '@phosphor-icons/react'
import { JSX } from 'react'
import type { RecentWorkspaceT } from '@/lib/recentWorkspaces'

type WorkspaceBrowserPropsT = {
	workspaces: RecentWorkspaceT[]
	isOpening: boolean
	onOpen: (workspace: RecentWorkspaceT) => void
	onCreate: () => void
}

export const WorkspaceBrowser = (props: WorkspaceBrowserPropsT): JSX.Element => {
	const hasWorkspaces = props.workspaces.length > 0

	return (
		<main className="workspaceBrowser">
			<div className="workspaceBrowserHeader">
				<div>
					<div className="documentsWorkspaceKicker">Local workspaces</div>
					<h1 className="documentsWorkspaceTitle">Workspaces</h1>
					<p className="documentsWorkspaceDescription">Choose a workspace or select a folder on disk to create one.</p>
				</div>
			</div>

			{!hasWorkspaces && (
				<div className="documentsWorkspaceEmpty">
					<div className="documentsWorkspaceEmptyGlyph"><FolderOpen weight="bold" /></div>
					<h2 className="documentsWorkspaceEmptyTitle">No workspaces yet</h2>
					<p className="documentsWorkspaceEmptyBody">Select a folder on disk to create your first workspace.</p>
					<button className="workspaceBrowserCreateButton" onClick={props.onCreate} disabled={props.isOpening}>Select folder</button>
				</div>
			)}

			{hasWorkspaces && (
				<div className="workspaceBrowserGrid">
					{props.workspaces.map((workspace) => (
						<button key={workspace.id} className="workspaceBrowserCard" onClick={() => props.onOpen(workspace)} disabled={props.isOpening}>
							<div className="workspaceBrowserCardIcon"><FolderOpen weight="duotone" /></div>
							<div className="workspaceBrowserCardBody">
								<div className="workspaceBrowserCardTitle">{workspace.name}</div>
								<div className="workspaceBrowserCardMeta"><span>{workspace.noteCount} notes</span><span>·</span><span>{workspace.folderCount} folders</span></div>
								<div className="workspaceBrowserCardPath">{workspace.displayPath}</div>
							</div>
						</button>
					))}
				</div>
			)}
		</main>
	)
}
