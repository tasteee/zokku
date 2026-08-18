'use client'

import '../documents/page.css'
import { JSX, useEffect, useState } from 'react'
import { DocumentsHeader } from '../documents/components/DocumentsHeader/DocumentsHeader'
import { WorkspaceTrashBrowser } from '../documents/components/WorkspaceBrowser/WorkspaceTrashBrowser'
import { listTrashedWorkspaces, restoreTrashedWorkspace } from '@/lib/recentWorkspaces'
import type { TrashedWorkspaceT } from '@/lib/recentWorkspaces'

const TrashPage = (): JSX.Element => {
	const [workspaces, setWorkspaces] = useState<TrashedWorkspaceT[]>([])
	const [error, setError] = useState('')

	const refreshWorkspaces = async (): Promise<void> => setWorkspaces(await listTrashedWorkspaces())
	useEffect(() => { void refreshWorkspaces() }, [])

	const handleRestoreWorkspace = async (workspace: TrashedWorkspaceT): Promise<void> => {
		setError('')
		try {
			await restoreTrashedWorkspace(workspace.id)
			await refreshWorkspaces()
		} catch {
			setError(`Zokku could not restore ${workspace.name}.`)
		}
	}

	return (
		<div className="documentsPage" data-visibility="ready" data-transition="idle">
			<DocumentsHeader />
			<div className="documentsPageBody documentsPageBodyWorkspaces">
				<div className="documentsPageContent documentsPageContentFull">
					<WorkspaceTrashBrowser workspaces={workspaces} onRestore={(workspace) => void handleRestoreWorkspace(workspace)} />
					{error && <p className="WorkspaceError">{error}</p>}
				</div>
			</div>
		</div>
	)
}

export default TrashPage
