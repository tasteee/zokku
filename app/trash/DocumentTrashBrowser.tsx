'use client'

import '../documents/components/WorkspaceBrowser/WorkspaceBrowser.css'

import { ArrowCounterClockwise, FileText, Trash } from '@phosphor-icons/react'
import { JSX } from 'react'
import { ZButton } from '@/components/zButton'
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
					<div className="workspaceBrowserKicker">Trash</div>
					<h1 className="workspaceBrowserTitle">Deleted documents</h1>
					<p className="workspaceBrowserDescription">Documents stay here for 30 days before they are permanently removed.</p>
				</div>
			</div>

			{props.documents.length === 0 ? (
				<div className="workspaceBrowserTrashEmpty">
					<div className="workspaceBrowserAddGlyph"><Trash weight="bold" /></div>
					<div className="workspaceBrowserAddTitle">No deleted documents</div>
					<div className="workspaceBrowserAddBody">Deleted documents from this workspace will appear here for 30 days.</div>
				</div>
			) : (
				<div className="workspaceBrowserGrid">
					{props.documents.map((document) => {
						const daysRemaining = Math.max(1, Math.ceil((document.expiresAt - Date.now()) / (24 * 60 * 60 * 1000)))
						return <article key={document._id} className="workspaceBrowserTrashCard">
							<div className="workspaceBrowserCardBody">
								<div className="workspaceBrowserCardTopline"><span>Removed in {daysRemaining} {daysRemaining === 1 ? 'day' : 'days'}</span><FileText weight="bold" /></div>
								<div className="workspaceBrowserCardTitle">{document.title || 'Untitled'}</div>
								<div className="workspaceBrowserCardPath">{document.path}</div>
							</div>
							<div className="workspaceBrowserTrashCardFooter"><span>Markdown document</span><ZButton isSmall isGhost onClick={() => props.onRestore(document)}><ArrowCounterClockwise weight="bold" />Restore</ZButton></div>
						</article>
					})}
				</div>
			)}
		</main>
	)
}
