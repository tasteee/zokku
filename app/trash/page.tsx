import '../documents/page.css'
import { JSX, useEffect, useState } from 'react'
import { DocumentsHeader } from '../documents/components/DocumentsHeader/DocumentsHeader'
import { WorkspaceTrashBrowser } from '../documents/components/WorkspaceBrowser/WorkspaceTrashBrowser'
import { AllTrashBrowser } from './AllTrashBrowser'
import { DocumentTrashBrowser } from './DocumentTrashBrowser'
import { TrashRail, TrashSectionT } from './TrashRail'
import { listTrashedWorkspaces, restoreTrashedWorkspace } from '@/lib/recentWorkspaces'
import type { TrashedWorkspaceT } from '@/lib/recentWorkspaces'
import { listTrashedDocuments, restoreTrashedDocument } from '@/lib/localWorkspace'
import type { TrashedDocumentT } from '@/lib/localWorkspace'

const TrashPage = (): JSX.Element => {
	const [workspaces, setWorkspaces] = useState<TrashedWorkspaceT[]>([])
	const [documents, setDocuments] = useState<TrashedDocumentT[]>([])
	const [section, setSection] = useState<TrashSectionT>('all')
	const [error, setError] = useState('')

	const refreshTrash = async (): Promise<void> => {
		const [nextWorkspaces, nextDocuments] = await Promise.all([listTrashedWorkspaces(), listTrashedDocuments()])
		setWorkspaces(nextWorkspaces)
		setDocuments(nextDocuments)
	}
	useEffect(() => { void refreshTrash() }, [])

	const handleRestoreWorkspace = async (workspace: TrashedWorkspaceT): Promise<void> => {
		setError('')
		try {
			await restoreTrashedWorkspace(workspace.id)
			await refreshTrash()
		} catch {
			setError(`Zokku could not restore ${workspace.name}.`)
		}
	}

	const handleRestoreDocument = async (document: TrashedDocumentT): Promise<void> => {
		setError('')
		try {
			await restoreTrashedDocument(document._id)
			await refreshTrash()
		} catch {
			setError(`Zokku could not restore ${document.title || 'that document'}.`)
		}
	}

	return (
		<div className="trashPage">
			<DocumentsHeader />
			<div className="documentsPageBody">
				<TrashRail activeSection={section} workspaceCount={workspaces.length} documentCount={documents.length} onSelect={setSection} />
				<div className="documentsPageContent">
					{section === 'all' && (
						<AllTrashBrowser
							workspaces={workspaces}
							documents={documents}
							onRestoreWorkspace={(workspace) => void handleRestoreWorkspace(workspace)}
							onRestoreDocument={(document) => void handleRestoreDocument(document)}
						/>
					)}
					{section === 'workspaces' && <WorkspaceTrashBrowser workspaces={workspaces} onRestore={(workspace) => void handleRestoreWorkspace(workspace)} />}
					{section === 'documents' && <DocumentTrashBrowser documents={documents} onRestore={(document) => void handleRestoreDocument(document)} />}
					{error && <p className="WorkspaceError">{error}</p>}
				</div>
			</div>
		</div>
	)
}

export default TrashPage
