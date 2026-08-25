import '../documents/components/WorkspaceBrowser/WorkspaceBrowser.css'

import { ArrowCounterClockwise, FileText, Trash } from '@phosphor-icons/react'
import { JSX } from 'react'
import type { TrashedDocumentT } from '@/lib/localWorkspace'
import type { TrashedWorkspaceT } from '@/lib/recentWorkspaces'

// Both trash kinds age out on the same 30 day clock, so they share one countdown.
const describeDaysRemaining = (expiresAt: number): string => {
	const daysRemaining = Math.max(1, Math.ceil((expiresAt - Date.now()) / (24 * 60 * 60 * 1000)))
	return `Removed in ${daysRemaining} ${daysRemaining === 1 ? 'day' : 'days'}`
}

type WorkspaceTrashCardPropsT = {
	workspace: TrashedWorkspaceT
	onRestore: (workspace: TrashedWorkspaceT) => void
}

export const WorkspaceTrashCard = (props: WorkspaceTrashCardPropsT): JSX.Element => {
	return (
		<z-card className="workspaceBrowserTrashCard">
			<div className="workspaceBrowserCardBody">
				<div className="workspaceBrowserCardTopline">
					<span>{describeDaysRemaining(props.workspace.expiresAt)}</span>
					<Trash weight="bold" />
				</div>
				<div className="workspaceBrowserCardTitle">{props.workspace.name}</div>
				<div className="workspaceBrowserCardPath">{props.workspace.displayPath}</div>
			</div>
			<div className="workspaceBrowserTrashCardFooter">
				<span>{props.workspace.noteCount} documents · {props.workspace.folderCount} folders</span>
				<z-button kind="ghost" size="sm" onClick={() => props.onRestore(props.workspace)}><ArrowCounterClockwise weight="bold" />Restore</z-button>
			</div>
		</z-card>
	)
}

type DocumentTrashCardPropsT = {
	document: TrashedDocumentT
	onRestore: (document: TrashedDocumentT) => void
}

export const DocumentTrashCard = (props: DocumentTrashCardPropsT): JSX.Element => {
	return (
		<z-card className="workspaceBrowserTrashCard">
			<div className="workspaceBrowserCardBody">
				<div className="workspaceBrowserCardTopline">
					<span>{describeDaysRemaining(props.document.expiresAt)}</span>
					<FileText weight="bold" />
				</div>
				<div className="workspaceBrowserCardTitle">{props.document.title || 'Untitled'}</div>
				<div className="workspaceBrowserCardPath">{props.document.path}</div>
			</div>
			<div className="workspaceBrowserTrashCardFooter">
				<span>Markdown document</span>
				<z-button kind="ghost" size="sm" onClick={() => props.onRestore(props.document)}><ArrowCounterClockwise weight="bold" />Restore</z-button>
			</div>
		</z-card>
	)
}
