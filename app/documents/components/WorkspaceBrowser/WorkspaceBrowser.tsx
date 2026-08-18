'use client'

import './WorkspaceBrowser.css'
import { FolderOpen, FolderPlus } from '@phosphor-icons/react'
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
					<div className="workspaceBrowserKicker">Workspaces</div>
					<h1 className="workspaceBrowserTitle">Your local workspaces</h1>
					<p className="workspaceBrowserDescription">Open a workspace to continue, or choose another folder on this computer.</p>
				</div>
			</div>

			{!hasWorkspaces && (
				<section className="workspaceBrowserEmpty">
					<div className="workspaceBrowserEmptyGlow" />
					<div className="workspaceBrowserEmptyContent">
						<div className="workspaceBrowserEmptyIcon"><FolderOpen weight="duotone" /></div>
						<div className="workspaceBrowserEmptyCopy">
							<h2>No workspaces yet</h2>
							<p>Select a folder on disk to create your first Zokku workspace.</p>
						</div>
						<button className="workspaceBrowserCreateButton" onClick={props.onCreate} disabled={props.isOpening}>
							<FolderPlus weight="bold" />
							<span>{props.isOpening ? 'Opening…' : 'Select folder'}</span>
						</button>
					</div>
					<div className="workspaceBrowserEmptyFoot">Markdown files stay in the folder you choose.</div>
				</section>
			)}

			{hasWorkspaces && (
				<div className="workspaceBrowserGrid">
					{props.workspaces.map((workspace) => (
						<button key={workspace.id} className="workspaceBrowserCard" onClick={() => props.onOpen(workspace)} disabled={props.isOpening}>
							<div className="workspaceBrowserCardTopline">
								<div className="workspaceBrowserCardIcon"><FolderOpen weight="duotone" /></div>
								<div className="workspaceBrowserCardMeta"><span>{workspace.noteCount} notes</span><span>·</span><span>{workspace.folderCount} folders</span></div>
							</div>
							<div className="workspaceBrowserCardTitle">{workspace.name}</div>
							<div className="workspaceBrowserCardPath">{workspace.displayPath}</div>
						</button>
					))}
				</div>
			)}
		</main>
	)
}
