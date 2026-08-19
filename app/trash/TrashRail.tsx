'use client'

import '@/app/documents/components/FolderRail/FolderRail.css'

import { CaretLeft, FileText, FolderOpen } from '@phosphor-icons/react'
import { JSX } from 'react'
import { useRouter } from 'next/navigation'

export type TrashSectionT = 'workspaces' | 'documents'

type TrashRailPropsT = {
	activeSection: TrashSectionT
	workspaceCount: number
	documentCount: number
	onSelect: (section: TrashSectionT) => void
}

export const TrashRail = (props: TrashRailPropsT): JSX.Element => {
	const router = useRouter()
	const handleBack = (): void => { window.history.length > 1 ? router.back() : router.push('/') }

	return (
		<aside className="folderRail">
			<z-card className="folderRailCard">
				<button type="button" className="folderRailBackLink" onClick={handleBack}>
					<CaretLeft weight="bold" />
					<span>Back</span>
				</button>
				<z-separator />
				<div className="folderRailHeader"><span>Trash</span></div>
				<div className="folderRailSection">
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
