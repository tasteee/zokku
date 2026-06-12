'use client'

import './FolderComposer.css'
import { FormEvent, JSX } from 'react'
import { X } from '@phosphor-icons/react'
import { ZButton } from '@/components/zButton'
import { $composer } from '../../stores'

type FolderComposerPropsT = {
	onSubmit: (name: string, description: string) => Promise<void>
}

export const FolderComposer = (props: FolderComposerPropsT): JSX.Element => {
	const folderName = $composer.use.lookup('folderName') as string
	const folderDescription = $composer.use.lookup('folderDescription') as string
	const isCreating = $composer.use.lookup('isCreating') as boolean

	const handleClose = (): void => {
		$composer.set.lookup('isOpen', false)
	}

	const handleSubmit = async (event: FormEvent<HTMLFormElement>): Promise<void> => {
		event.preventDefault()
		const trimmedName = folderName.trim()
		const trimmedDescription = folderDescription.trim()
		if (!trimmedName) return
		await props.onSubmit(trimmedName, trimmedDescription)
	}

	return (
		<div className="folderComposerBackdrop" role="presentation" onMouseDown={handleClose}>
			<form
				className="folderComposer"
				onSubmit={handleSubmit}
				onMouseDown={(event) => event.stopPropagation()}
			>
				<div className="folderComposerHeader">
					<div>
						<div className="folderComposerKicker">New folder</div>
						<h2>Create a folder</h2>
					</div>
					<button className="folderComposerClose" type="button" onClick={handleClose} title="Close">
						<X weight="bold" />
					</button>
				</div>

				<label className="folderComposerField">
					<span>Name</span>
					<input
						value={folderName}
						onChange={(event) => $composer.set.lookup('folderName', event.target.value)}
						placeholder="Product notes"
						autoFocus
					/>
				</label>

				<label className="folderComposerField">
					<span>Description</span>
					<textarea
						value={folderDescription}
						onChange={(event) => $composer.set.lookup('folderDescription', event.target.value)}
						placeholder="Optional context for this collection"
					/>
				</label>

				<div className="folderComposerActions">
					<ZButton isSmall isOutlined isNeutral type="button" onClick={handleClose}>
						Cancel
					</ZButton>
					<ZButton isSmall isSolid isPink type="submit" isDisabled={!folderName.trim() || isCreating}>
						Create folder
					</ZButton>
				</div>
			</form>
		</div>
	)
}
