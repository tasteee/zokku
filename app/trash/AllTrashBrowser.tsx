import '../documents/components/WorkspaceBrowser/WorkspaceBrowser.css'

import { JSX } from 'react'
import { DocumentTrashCard, WorkspaceTrashCard } from './TrashCards'
import type { TrashedDocumentT } from '@/lib/localWorkspace'
import type { TrashedWorkspaceT } from '@/lib/recentWorkspaces'

type AllTrashBrowserPropsT = {
	workspaces: TrashedWorkspaceT[]
	documents: TrashedDocumentT[]
	onRestoreWorkspace: (workspace: TrashedWorkspaceT) => void
	onRestoreDocument: (document: TrashedDocumentT) => void
}

export const AllTrashBrowser = (props: AllTrashBrowserPropsT): JSX.Element => {
	const isEmpty = props.workspaces.length === 0 && props.documents.length === 0

	return (
		<main className="workspaceBrowser">
			<div className="workspaceBrowserHeader">
				<div>
					<z-eyebrow label="Trash" />
					<z-heading size="lg">Everything deleted</z-heading>
					<p className="workspaceBrowserDescription">Workspaces and documents stay here for 30 days before they are permanently removed.</p>
				</div>
			</div>

			{isEmpty ? (
				<z-empty-state heading="Trash is empty" description="Deleted workspaces and documents will appear here for 30 days." is-bordered />
			) : (
				<>
					{props.workspaces.length > 0 && (
						<section className="workspaceBrowserGroup">
							<div className="workspaceBrowserGroupLabel">Workspaces ({props.workspaces.length})</div>
							<div className="workspaceBrowserGrid">
								{props.workspaces.map((workspace) => (
									<WorkspaceTrashCard key={workspace.id} workspace={workspace} onRestore={props.onRestoreWorkspace} />
								))}
							</div>
						</section>
					)}

					{props.documents.length > 0 && (
						<section className="workspaceBrowserGroup">
							<div className="workspaceBrowserGroupLabel">Documents ({props.documents.length})</div>
							<div className="workspaceBrowserGrid">
								{props.documents.map((document) => (
									<DocumentTrashCard key={document._id} document={document} onRestore={props.onRestoreDocument} />
								))}
							</div>
						</section>
					)}
				</>
			)}
		</main>
	)
}
