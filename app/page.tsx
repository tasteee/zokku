import './documents/page.css'

import { JSX, useEffect, useState } from 'react'
import { useLocation } from 'wouter'
import { DocumentsHeader } from './documents/components/DocumentsHeader/DocumentsHeader'
import { WorkspaceBrowser } from './documents/components/WorkspaceBrowser/WorkspaceBrowser'
import { chooseWorkspace, isFileSystemWorkspaceSupported } from '@/lib/localWorkspace'
import { ensureWorkspaceGuide } from '@/lib/ensureWorkspaceGuide'
import { beginAppTransition } from '@/lib/appTransition'
import { activateRecentWorkspace, listRecentWorkspaces, listTrashedWorkspaces, rememberCurrentWorkspace, trashRecentWorkspace } from '@/lib/recentWorkspaces'
import type { RecentWorkspaceT, TrashedWorkspaceT } from '@/lib/recentWorkspaces'

const HomePage = (): JSX.Element => {
	const [, navigate] = useLocation()
	const [workspaces, setWorkspaces] = useState<RecentWorkspaceT[]>([])
	const [trashedWorkspaces, setTrashedWorkspaces] = useState<TrashedWorkspaceT[]>([])
	const [isOpening, setIsOpening] = useState(false)
	const [error, setError] = useState('')
	const isSupported = typeof window === 'undefined' || isFileSystemWorkspaceSupported()

	const refreshWorkspaces = async (): Promise<void> => {
		const [nextWorkspaces, nextTrashedWorkspaces] = await Promise.all([listRecentWorkspaces(), listTrashedWorkspaces()])
		setWorkspaces(nextWorkspaces)
		setTrashedWorkspaces(nextTrashedWorkspaces)
	}

	useEffect(() => { void refreshWorkspaces() }, [])

	const enterDocuments = (): void => {
		// Next applies its configured base path (`/zokku` in GitHub Pages) here.
		beginAppTransition(() => navigate('/documents/'))
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
			if (!isAbort) setError('Zokku could not open that folder. Please try again.')
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
		} catch {
			setError('Zokku could not reopen that workspace. Please try again.')
			setIsOpening(false)
		}
	}

	const handleTrashWorkspace = async (workspace: RecentWorkspaceT): Promise<void> => {
		setError('')
		try {
			await trashRecentWorkspace(workspace.id)
			await refreshWorkspaces()
		} catch {
			setError(`Zokku could not move ${workspace.name} to Trash.`)
		}
	}

	return (
		<div className="workspacesPage">
			<DocumentsHeader />
			<div className="documentsPageBody documentsPageBodyWorkspaces">
				<div className="documentsPageContent documentsPageContentFull">
					<WorkspaceBrowser workspaces={workspaces} trashCount={trashedWorkspaces.length} isOpening={isOpening} onOpen={(workspace) => void handleOpenWorkspace(workspace)} onCreate={() => void handleCreateWorkspace()} onTrash={(workspace) => void handleTrashWorkspace(workspace)} />
					{!isSupported && <p className="WorkspaceError">Local workspaces require Chrome or Edge.</p>}
					{error && <p className="WorkspaceError">{error}</p>}
				</div>
			</div>
		</div>
	)
}

export default HomePage
