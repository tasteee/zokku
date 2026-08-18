'use client'

import './documents/page.css'

import { JSX, useEffect, useState } from 'react'
import { DocumentsHeader } from './documents/components/DocumentsHeader/DocumentsHeader'
import { FolderRail } from './documents/components/FolderRail/FolderRail'
import { WorkspaceBrowser } from './documents/components/WorkspaceBrowser/WorkspaceBrowser'
import { chooseWorkspace, isFileSystemWorkspaceSupported } from '@/lib/localWorkspace'
import { ensureWorkspaceGuide } from '@/lib/ensureWorkspaceGuide'
import { activateRecentWorkspace, listRecentWorkspaces, rememberCurrentWorkspace } from '@/lib/recentWorkspaces'
import type { RecentWorkspaceT } from '@/lib/recentWorkspaces'

const WORKSPACE_TRANSITION_KEY = 'zokku-workspace-transition'

const HomePage = (): JSX.Element => {
	const [workspaces, setWorkspaces] = useState<RecentWorkspaceT[]>([])
	const [isOpening, setIsOpening] = useState(false)
	const [error, setError] = useState('')
	const isSupported = typeof window === 'undefined' || isFileSystemWorkspaceSupported()

	const refreshWorkspaces = async (): Promise<void> => {
		setWorkspaces(await listRecentWorkspaces())
	}

	useEffect(() => {
		void refreshWorkspaces()
	}, [])

	const enterDocuments = (): void => {
		sessionStorage.setItem(WORKSPACE_TRANSITION_KEY, '1')
		const root = document.querySelector<HTMLElement>('.documentsPage')
		if (root !== null) root.dataset.transition = 'out'
		window.setTimeout(() => window.location.assign('/documents'), 300)
	}

	const handleCreateWorkspace = async (): Promise<void> => {
		setError('')
		setIsOpening(true)
		try {
			await chooseWorkspace()
			await ensureWorkspaceGuide()
			await rememberCurrentWorkspace()
			await refreshWorkspaces()
			enterDocuments()
		} catch (cause) {
			const isAbort = cause instanceof DOMException && cause.name === 'AbortError'
			if (!isAbort) setError(cause instanceof Error ? cause.message : 'Unable to open that folder.')
			setIsOpening(false)
		}
	}

	const handleOpenWorkspace = async (workspace: RecentWorkspaceT): Promise<void> => {
		setError('')
		setIsOpening(true)
		try {
			const isActivated = await activateRecentWorkspace(workspace.id)
			if (!isActivated) {
				setError(`Zokku needs permission to reopen ${workspace.name}.`)
				setIsOpening(false)
				return
			}
			enterDocuments()
		} catch (cause) {
			setError(cause instanceof Error ? cause.message : 'Unable to reopen that workspace.')
			setIsOpening(false)
		}
	}

	return (
		<div className="documentsPage" data-visibility="ready" data-transition="idle">
			<DocumentsHeader />
			<div className="documentsPageBody">
				<FolderRail
					mode="workspaces"
					workspaceCount={workspaces.length}
					onShowWorkspaces={() => undefined}
					onCreateWorkspace={() => void handleCreateWorkspace()}
					onDeleteFolder={async () => undefined}
				/>
				<div className="documentsPageContent">
					<WorkspaceBrowser workspaces={workspaces} isOpening={isOpening} onOpen={(workspace) => void handleOpenWorkspace(workspace)} onCreate={() => void handleCreateWorkspace()} />
					{!isSupported && <p className="WorkspaceError">Local workspaces require Chrome or Edge.</p>}
					{error && <p className="WorkspaceError">{error}</p>}
				</div>
			</div>
		</div>
	)
}

export default HomePage
