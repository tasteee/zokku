'use client'

import './WorkspaceBrowser.css'
import { FolderOpen, FolderPlus } from '@phosphor-icons/react'
import { JSX } from 'react'
import { ZButton } from '@/components/zButton'
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
				{hasWorkspaces && (
					<ZButton isSmall isDim onClick={props.onCreate} disabled={props.isOpening}>
						<FolderPlus weight="bold" />
						{props.isOpening ? 'Opening…' : 'Add workspace'}
					</ZButton>
				)}
			</div>

			{!hasWorkspaces && (
				<button className="workspaceBrowserAddCard" type="button" onClick={props.onCreate} disabled={props.isOpening}>
					<div className="workspaceBrowserAddGlyph"><FolderPlus weight="bold" /></div>
					<div className="workspaceBrowserAddTitle">{props.isOpening ? 'Opening workspace…' : 'Add a workspace'}</div>
					<div className="workspaceBrowserAddBody">Choose a folder on this computer to start working with its Markdown files.</div>
				</button>
			)}

			{hasWorkspaces && (
				<div className="workspaceBrowserGrid">
					{props.workspaces.map((workspace) => (
						<button key={workspace.id} className="workspaceBrowserCard" type="button" onClick={() => props.onOpen(workspace)} disabled={props.isOpening}>
							<div className="workspaceBrowserCardBody">
								<div className="workspaceBrowserCardTopline">
									<span>{workspace.noteCount} documents</span>
									<FolderOpen weight="bold" />
								</div>
								<div className="workspaceBrowserCardTitle">{workspace.name}</div>
								<div className="workspaceBrowserCardPath">{workspace.displayPath}</div>
							</div>
							<div className="workspaceBrowserCardFooter">{workspace.folderCount} folders</div>
						</button>
					))}
				</div>
			)}
		</main>
	)
}
