'use client'

import '../documents/components/WorkspaceBrowser/WorkspaceBrowser.css'

import { ArrowCounterClockwise, FileText, Trash } from '@phosphor-icons/react'
import { JSX } from 'react'
import type { TrashedDocumentT } from '@/lib/localWorkspace'

type DocumentTrashBrowserPropsT = {
	documents: TrashedDocumentT[]
	onRestore: (document: TrashedDocumentT) => void
}

export const DocumentTrashBrowser = (props: DocumentTrashBrowserPropsT): JSX.Element => {
	return (
		<main className="workspaceBrowser">
			<div className="workspaceBrowserHeader">
				<div>
					<z-eyebrow label="Trash" />
					<z-heading size="lg">Deleted documents</z-heading>
					<p className="workspaceBrowserDescription">Documents stay here for 30 days before they are permanently removed.</p>
				</div>
			</div>

			{props.documents.length === 0 ? (
				<z-empty-state heading="No deleted documents" description="Deleted documents from this workspace will appear here for 30 days." is-bordered />
			) : (
				<div className="workspaceBrowserGrid">
					{props.documents.map((document) => {
						const daysRemaining = Math.max(1, Math.ceil((document.expiresAt - Date.now()) / (24 * 60 * 60 * 1000)))
						return (
							<z-card key={document._id} className="workspaceBrowserTrashCard">
								<div className="workspaceBrowserCardBody">
									<div className="workspaceBrowserCardTopline"><span>Removed in {daysRemaining} {daysRemaining === 1 ? 'day' : 'days'}</span><FileText weight="bold" /></div>
									<div className="workspaceBrowserCardTitle">{document.title || 'Untitled'}</div>
									<div className="workspaceBrowserCardPath">{document.path}</div>
								</div>
								<div className="workspaceBrowserTrashCardFooter"><span>Markdown document</span><z-button kind="ghost" size="sm" onClick={() => props.onRestore(document)}><ArrowCounterClockwise weight="bold" />Restore</z-button></div>
							</z-card>
						)
					})}
				</div>
			)}
		</main>
	)
}
