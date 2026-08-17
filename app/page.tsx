'use client'

import './workspace.css'

import { ArrowRightIcon, FolderIcon, FolderOpenIcon } from '@phosphor-icons/react'
import { JSX, useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { ZokkuBrand } from '@/components/ZokkuBrand'
import { chooseWorkspace, isFileSystemWorkspaceSupported, restoreWorkspace } from '@/lib/localWorkspace'
import {
	activateRecentWorkspace,
	listRecentWorkspaces,
	rememberCurrentWorkspace
} from '@/lib/recentWorkspaces'
import type { RecentWorkspaceT } from '@/lib/recentWorkspaces'

const HomePage = (): JSX.Element => {
	const router = useRouter()
	const [isOpening, setIsOpening] = useState(false)
	const [recentWorkspaces, setRecentWorkspaces] = useState<RecentWorkspaceT[]>([])
	const [error, setError] = useState('')
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

	const handleChooseWorkspace = async (): Promise<void> => {
		setError('')
		setIsOpening(true)

		try {
			await chooseWorkspace()
			await rememberCurrentWorkspace()
			router.push('/documents')
		} catch (cause) {
			const isAbort = cause instanceof DOMException && cause.name === 'AbortError'
			if (!isAbort) setError(cause instanceof Error ? cause.message : 'Unable to open that folder.')
		} finally {
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
				return
			}
			window.location.assign('/documents')
		} catch (cause) {
			setError(cause instanceof Error ? cause.message : 'Unable to reopen that workspace.')
		} finally {
			setIsOpening(false)
		}
	}

	return (
		<main className="WorkspaceSplash">
			<div className="WorkspaceSplashGlow isPurple" />
			<div className="WorkspaceSplashGlow isPink" />
			<div className="WorkspaceSplashInner">
				<header className="WorkspaceSplashHeader">
					<ZokkuBrand />
					<div className="WorkspaceLocalBadge">
						<span className="WorkspaceLocalBadgeDot" />
						Local workspace
					</div>
				</header>

				<section className="WorkspaceHero">
					<div>
						<h1 className="WorkspaceTitle">
							A quieter place
							<span className="WorkspaceTitleAccent">to make things.</span>
						</h1>
						<p className="WorkspaceLead">
							Zokku works directly from a folder on your computer. No account, no cloud database, no sync layer between you and your Markdown.
						</p>
					</div>

					<div className="WorkspaceCard">
						<div className="WorkspaceCardInner">
							<div className="WorkspaceFolderGlyph">
								<FolderOpenIcon size={27} weight="duotone" />
							</div>
							<h2 className="WorkspaceCardTitle">Open a workspace</h2>

							<button className="WorkspacePickerButton" disabled={isOpening || !isSupported} onClick={handleChooseWorkspace}>
								<span>{isOpening ? 'Opening workspace…' : 'Select folder'}</span>
								<ArrowRightIcon size={16} weight="bold" />
							</button>

							{hasRecentWorkspaces && (
								<div className="WorkspaceRecentSection">
									<div className="WorkspaceRecentLabel">Recent workspaces</div>
									<div className="WorkspaceRecentList">
										{recentWorkspaces.map((workspace) => (
											<button
												key={workspace.id}
												className="WorkspaceRecentButton"
												disabled={isOpening}
												onClick={() => void handleRecentWorkspace(workspace)}
											>
												<FolderIcon size={16} weight="bold" />
												<span>{workspace.name}</span>
												<ArrowRightIcon size={14} weight="bold" />
											</button>
										))}
									</div>
								</div>
							)}

							{!isSupported && <p className="WorkspaceError">Local workspaces require a Chromium browser such as Chrome or Edge.</p>}
							{error && <p className="WorkspaceError">{error}</p>}
						</div>
					</div>
				</section>
			</div>
		</main>
	)
}

export default HomePage
