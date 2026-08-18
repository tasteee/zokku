'use client'

import './workspace.css'

import { FolderIcon, FolderOpenIcon, PlusIcon } from '@phosphor-icons/react'
import { JSX, useEffect, useState } from 'react'
import { ZokkuBrand } from '@/components/ZokkuBrand'
import { chooseWorkspace, isFileSystemWorkspaceSupported, restoreWorkspace } from '@/lib/localWorkspace'
import { ensureWorkspaceGuide } from '@/lib/ensureWorkspaceGuide'
import {
	activateRecentWorkspace,
	listRecentWorkspaces,
	rememberCurrentWorkspace
} from '@/lib/recentWorkspaces'
import type { RecentWorkspaceT } from '@/lib/recentWorkspaces'

type TransitionStateT = 'idle' | 'out'

const WORKSPACE_TRANSITION_KEY = 'zokku-workspace-transition'

const formatCount = (count: number, singular: string, plural: string): string => {
	return `${count} ${count === 1 ? singular : plural}`
}

const HomePage = (): JSX.Element => {
	const [isOpening, setIsOpening] = useState(false)
	const [recentWorkspaces, setRecentWorkspaces] = useState<RecentWorkspaceT[]>([])
	const [error, setError] = useState('')
	const [transitionState, setTransitionState] = useState<TransitionStateT>('idle')
	const isSupported = typeof window === 'undefined' || isFileSystemWorkspaceSupported()
	const hasRecentWorkspaces = recentWorkspaces.length > 0

	const refreshRecentWorkspaces = async (): Promise<void> => {
		const workspaces = await listRecentWorkspaces()
		setRecentWorkspaces(workspaces)
	}

	useEffect(() => {
		const load = async (): Promise<void> => {
			const currentWorkspace = await restoreWorkspace(false).catch(() => null)
			if (currentWorkspace !== null) await rememberCurrentWorkspace()
			await refreshRecentWorkspaces()
		}
		void load()
	}, [])

	const transitionToDocuments = (): void => {
		setTransitionState('out')
		window.setTimeout(() => {
			sessionStorage.setItem(WORKSPACE_TRANSITION_KEY, '1')
			window.location.assign('/documents')
		}, 300)
	}

	const handleChooseWorkspace = async (): Promise<void> => {
		setError('')
		setIsOpening(true)

		try {
			await chooseWorkspace()
			await ensureWorkspaceGuide()
			await rememberCurrentWorkspace()
			transitionToDocuments()
		} catch (cause) {
			const isAbort = cause instanceof DOMException && cause.name === 'AbortError'
			if (!isAbort) setError(cause instanceof Error ? cause.message : 'Unable to open that folder.')
			setIsOpening(false)
		}
	}

	const handleRecentWorkspace = async (workspace: RecentWorkspaceT): Promise<void> => {
		setError('')
		setIsOpening(true)

		try {
			const isActivated = await activateRecentWorkspace(workspace.id)
			if (!isActivated) {
				setError(`Zokku needs permission to reopen ${workspace.name}.`)
				setIsOpening(false)
				return
			}
			transitionToDocuments()
		} catch (cause) {
			setError(cause instanceof Error ? cause.message : 'Unable to reopen that workspace.')
			setIsOpening(false)
		}
	}

	return (
		<main className="WorkspaceSplash" data-transition={transitionState}>
			<div className="WorkspaceSplashGlow isPurple" />
			<div className="WorkspaceSplashGlow isPink" />
			<div className="WorkspaceAppContent">
				<header className="WorkspaceSplashHeader">
					<ZokkuBrand />
				</header>

				<section className="WorkspaceContent">
					{hasRecentWorkspaces ? (
						<>
							<div className="WorkspaceSectionHeader">
								<div>
									<h1 className="WorkspaceSectionTitle">Workspaces</h1>
									<p className="WorkspaceSectionDescription">Open a local workspace or select another folder.</p>
								</div>
								<button className="WorkspaceAddButton" disabled={isOpening || !isSupported} onClick={handleChooseWorkspace}>
									<PlusIcon size={15} weight="bold" />
									<span>New workspace</span>
								</button>
							</div>

							<div className="WorkspaceGrid">
								{recentWorkspaces.map((workspace) => (
									<button
										key={workspace.id}
										className="WorkspaceGridCard"
										disabled={isOpening}
										onClick={() => void handleRecentWorkspace(workspace)}
									>
										<div className="WorkspaceGridCardTopline">
											<span className="WorkspaceGridIcon"><FolderIcon size={21} weight="duotone" /></span>
											<div className="WorkspaceGridIdentity">
												<strong>{workspace.name}</strong>
												<span>{formatCount(workspace.noteCount, 'note', 'notes')} · {formatCount(workspace.folderCount, 'folder', 'folders')}</span>
											</div>
										</div>
										<div className="WorkspaceGridPath" title="Browsers do not expose the full absolute disk path">{workspace.displayPath}</div>
									</button>
								))}
							</div>
						</>
					) : (
						<div className="WorkspaceEmptyState">
							<div className="WorkspaceEmptyIcon"><FolderOpenIcon size={28} weight="duotone" /></div>
							<h1>No workspaces</h1>
							<p>Select a folder on disk to create a local Zokku workspace.</p>
							<button className="WorkspacePickerButton" disabled={isOpening || !isSupported} onClick={handleChooseWorkspace}>
								{isOpening ? 'Opening workspace…' : 'Select folder'}
							</button>
						</div>
					)}

					{!isSupported && <p className="WorkspaceError">Local workspaces require a Chromium browser such as Chrome or Edge.</p>}
					{error && <p className="WorkspaceError">{error}</p>}
				</section>
			</div>
		</main>
	)
}

export default HomePage
