'use client'

import '@/app/documents/components/FolderRail/FolderRail.css'

import { CaretLeft, FileText, FolderOpen, Trash } from '@phosphor-icons/react'
import { JSX } from 'react'
import Link from 'next/link'

export type TrashSectionT = 'workspaces' | 'documents'

type TrashRailPropsT = {
	activeSection: TrashSectionT
	workspaceCount: number
	documentCount: number
	onSelect: (section: TrashSectionT) => void
}

export const TrashRail = (props: TrashRailPropsT): JSX.Element => {
	return (
		<aside className="folderRail">
			<Link className="folderRailBackLink" href="/">
				<CaretLeft weight="bold" />
				<span>Back</span>
			</Link>
			<div className="folderRailDivider" />
			<div className="folderRailHeader"><span>Trash</span></div>
			<div className="folderRailSection">
				<button className="folderRailItem" data-active={props.activeSection === 'workspaces' ? 'true' : 'false'} onClick={() => props.onSelect('workspaces')}>
					<span className="folderRailItemIcon"><FolderOpen weight="bold" /></span><span className="folderRailItemText">Workspaces</span><span className="folderRailItemCount">{props.workspaceCount}</span>
				</button>
				<button className="folderRailItem" data-active={props.activeSection === 'documents' ? 'true' : 'false'} onClick={() => props.onSelect('documents')}>
					<span className="folderRailItemIcon"><FileText weight="bold" /></span><span className="folderRailItemText">Documents</span><span className="folderRailItemCount">{props.documentCount}</span>
				</button>
			</div>
			<div className="folderRailDivider" />
			<Link className="folderRailFooterLink" href="/trash" aria-current="page">
				<Trash weight="fill" />
				<span>Trash</span>
			</Link>
		</aside>
	)
}
