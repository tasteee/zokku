'use client'

import './workspace.css'

import { ArrowRightIcon, FolderOpenIcon } from '@phosphor-icons/react'
import { JSX, useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { chooseWorkspace, isFileSystemWorkspaceSupported, restoreWorkspace } from '@/lib/localWorkspace'

const HomePage = (): JSX.Element => {
	const router = useRouter()
	const [isOpening, setIsOpening] = useState(false)
	const [recentWorkspace, setRecentWorkspace] = useState<string | null>(null)
	const [error, setError] = useState('')
	const isSupported = typeof window === 'undefined' || isFileSystemWorkspaceSupported()

	useEffect(() => {
		restoreWorkspace(false)
			.then(setRecentWorkspace)
			.catch(() => setRecentWorkspace(null))
	}, [])

	const handleChooseWorkspace = async (): Promise<void> => {
		setError('')
		setIsOpening(true)
		try {
			await chooseWorkspace()
			router.push('/documents')
		} catch (cause) {
			const isAbort = cause instanceof DOMException && cause.name === 'AbortError'
			if (!isAbort) setError(cause instanceof Error ? cause.message : 'Unable to open that folder.')
		} finally {
			setIsOpening(false)
		}
	}

	const handleResumeWorkspace = async (): Promise<void> => {
		setError('')
		setIsOpening(true)
		try {
			const name = await restoreWorkspace(true)
			if (name === null) {
				setError('Zokku needs permission to reopen that folder. Choose it again to continue.')
				return
			}
			router.push('/documents')
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
					<div className="WorkspaceBrand">
						<span className="WorkspaceBrandMark" />
						Zokku
					</div>
					<div className="WorkspaceLocalBadge">
						<span className="WorkspaceLocalBadgeDot" />
						Local workspace
					</div>
				</header>

				<section className="WorkspaceHero">
					<div>
						<p className="WorkspaceEyebrow">Your writing. Your disk.</p>
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
							<h2 className="WorkspaceCardTitle">Choose a workspace folder</h2>
							<p className="WorkspaceCardBody">
								Select any folder on your disk for Zokku to work from. Markdown files in that folder become documents, and folders you create in Zokku are created there too.
							</p>

							<button className="WorkspacePickerButton" disabled={isOpening || !isSupported} onClick={handleChooseWorkspace}>
								<span>{isOpening ? 'Opening workspace…' : 'Select folder'}</span>
								<ArrowRightIcon size={16} weight="bold" />
							</button>

							{recentWorkspace !== null && (
								<button className="WorkspaceRecentButton" disabled={isOpening} onClick={handleResumeWorkspace}>
									Continue with {recentWorkspace}
								</button>
							)}

							<p className="WorkspaceCardFootnote">
								Your files stay on this device. Zokku only receives browser permission to read and write the folder you choose.
							</p>
							{!isSupported && <p className="WorkspaceError">Local workspaces require a Chromium browser such as Chrome or Edge.</p>}
							{error && <p className="WorkspaceError">{error}</p>}
						</div>
					</div>
				</section>

				<footer className="WorkspaceSplashFooter">
					<span>Plain Markdown underneath. Always.</span>
					<span>No account · No Convex · No document upload</span>
				</footer>
			</div>
		</main>
	)
}

export default HomePage
