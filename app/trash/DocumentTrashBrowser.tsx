import '../documents/components/WorkspaceBrowser/WorkspaceBrowser.css'

import { JSX } from 'react'
import { DocumentTrashCard } from './TrashCards'
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
					{props.documents.map((document) => (
						<DocumentTrashCard key={document._id} document={document} onRestore={props.onRestore} />
					))}
				</div>
			)}
		</main>
	)
}
