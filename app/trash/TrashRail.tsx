import '@/app/documents/components/FolderRail/FolderRail.css'

import { CaretLeft, FileText, FolderOpen, Stack } from '@phosphor-icons/react'
import { JSX } from 'react'
import { useLocation } from 'wouter'
import { beginAppTransition } from '@/lib/appTransition'

export type TrashSectionT = 'all' | 'workspaces' | 'documents'

type TrashRailPropsT = {
	activeSection: TrashSectionT
	workspaceCount: number
	documentCount: number
	onSelect: (section: TrashSectionT) => void
}

export const TrashRail = (props: TrashRailPropsT): JSX.Element => {
	const [, navigate] = useLocation()
	// Fades out before leaving, the way the documents rail does. Trash is
	// reachable from both the workspace list and the documents rail, so the
	// destination stays whatever the reader came from.
	const handleBack = (): void => {
		beginAppTransition(() => (window.history.length > 1 ? window.history.back() : navigate('/')))
	}

	return (
		<aside className="folderRail">
			<z-card className="folderRailCard">
				<div className="folderRailWorkspaceHeader">
					<button type="button" className="folderRailBackLink" onClick={handleBack}>
						<CaretLeft weight="bold" />
						<span>Back</span>
					</button>

					<div className="folderRailWorkspaceHeaderName">Trash</div>
				</div>
				<z-separator />
				<div className="folderRailSection">
					<div className="folderRailItem">
						<button type="button" className="folderRailItemButton" data-active={props.activeSection === 'all' ? 'true' : 'false'} onClick={() => props.onSelect('all')}>
							<Stack weight="bold" /><span className="folderRailItemText">All ({props.workspaceCount + props.documentCount})</span>
						</button>
					</div>
					<div className="folderRailItem">
						<button type="button" className="folderRailItemButton" data-active={props.activeSection === 'workspaces' ? 'true' : 'false'} onClick={() => props.onSelect('workspaces')}>
							<FolderOpen weight="bold" /><span className="folderRailItemText">Workspaces ({props.workspaceCount})</span>
						</button>
					</div>
					<div className="folderRailItem">
						<button type="button" className="folderRailItemButton" data-active={props.activeSection === 'documents' ? 'true' : 'false'} onClick={() => props.onSelect('documents')}>
							<FileText weight="bold" /><span className="folderRailItemText">Documents ({props.documentCount})</span>
						</button>
					</div>
				</div>
			</z-card>
		</aside>
	)
}
