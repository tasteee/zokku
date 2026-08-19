'use client'

import { JSX } from 'react'
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

	const handleCreate = async (): Promise<void> => {
		const trimmedName = folderName.trim()
		const trimmedDescription = folderDescription.trim()
		if (!trimmedName || isCreating) return
		await props.onSubmit(trimmedName, trimmedDescription)
	}

	const handleNameKeyDown = (event: KeyboardEvent): void => {
		if (event.key !== 'Enter') return
		event.preventDefault()
		void handleCreate()
	}

	return (
		<z-dialog is-open heading="Create a folder" onClose={handleClose}>
			<z-field label="Name">
				<z-input
					value={folderName}
					onInput={(event: CustomEvent<{ value: string }>) => $composer.set.lookup('folderName', event.detail.value)}
					onKeyDown={handleNameKeyDown}
					placeholder="Product notes"
					autoFocus
				/>
			</z-field>

			<z-field label="Description">
				<z-textarea
					value={folderDescription}
					onInput={(event: CustomEvent<{ value: string }>) => $composer.set.lookup('folderDescription', event.detail.value)}
					placeholder="Optional context for this collection"
				/>
			</z-field>

			<div slot="footer">
				<z-button kind="outline" accent="neutral" onClick={handleClose}>
					Cancel
				</z-button>
				<z-button accent="dom" onClick={() => void handleCreate()} disabled={!folderName.trim() || isCreating}>
					Create folder
				</z-button>
			</div>
		</z-dialog>
	)
}
