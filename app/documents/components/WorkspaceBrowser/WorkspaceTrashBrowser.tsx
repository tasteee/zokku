'use client'

import './WorkspaceBrowser.css'
import { ArrowCounterClockwise, CaretLeft, Trash } from '@phosphor-icons/react'
import { JSX } from 'react'
import Link from 'next/link'
import { ZButton } from '@/components/zButton'
import type { TrashedWorkspaceT } from '@/lib/recentWorkspaces'

type WorkspaceTrashBrowserPropsT = {
	workspaces: TrashedWorkspaceT[]
	onRestore: (workspace: TrashedWorkspaceT) => void
}

export const WorkspaceTrashBrowser = (props: WorkspaceTrashBrowserPropsT): JSX.Element => {
	return (
		<main className="workspaceBrowser">
			<Link className="workspaceBrowserBackLink" href="/">
				<CaretLeft weight="bold" />
				<span>Workspaces</span>
			</Link>

			<div className="workspaceBrowserHeader">
				<div>
					<div className="workspaceBrowserKicker">Trash</div>
					<h1 className="workspaceBrowserTitle">Deleted workspaces</h1>
					<p className="workspaceBrowserDescription">Workspace shortcuts remain here for 30 days. Your folders and files stay untouched on this computer.</p>
				</div>
			</div>

			{props.workspaces.length === 0 ? (
				<div className="workspaceBrowserTrashEmpty">
					<div className="workspaceBrowserAddGlyph"><Trash weight="bold" /></div>
					<div className="workspaceBrowserAddTitle">Trash is empty</div>
					<div className="workspaceBrowserAddBody">Deleted workspace shortcuts will appear here for 30 days.</div>
				</div>
			) : (
				<div className="workspaceBrowserGrid">
					{props.workspaces.map((workspace) => {
						const daysRemaining = Math.max(1, Math.ceil((workspace.expiresAt - Date.now()) / (24 * 60 * 60 * 1000)))
						return (
							<article key={workspace.id} className="workspaceBrowserTrashCard">
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
									<ZButton isSmall isGhost onClick={() => props.onRestore(workspace)}><ArrowCounterClockwise weight="bold" />Restore</ZButton>
								</div>
							</article>
						)
					})}
				</div>
			)}
		</main>
	)
}
