import { JSX } from 'react'
import { $composer } from '../../stores'
import { onZestValue } from '@/lib/zestEvents'

type FolderComposerPropsT = {
	onSubmit: (name: string, description: string) => Promise<void>
}

export const FolderComposer = (props: FolderComposerPropsT): JSX.Element => {
	const folderName = $composer.use.lookup('folderName') as string
	const folderDescription = $composer.use.lookup('folderDescription') as string
	const isCreating = $composer.use.lookup('isCreating') as boolean

	const handleClose = (): void => {
		$composer.set.replace({ folderName: '', folderDescription: '', isCreating: false, isOpen: false })
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
		/*
			`onclose`, not `onClose`. React owns the camelCase name and only ever
			listens for a `close` event on a native <dialog>, so the camelCase prop on a
			custom element is dropped and the dialog can be dismissed without the store
			ever learning about it - which leaves isOpen stuck true and the composer
			impossible to reopen. Lowercase handlers are forwarded to addEventListener.
		*/
		<z-dialog is-open heading="Create a folder" onclose={handleClose}>
			<z-field label="Name">
				<z-input
					value={folderName}
					oninput={onZestValue<string>((value) => $composer.set.lookup('folderName', value))}
					onKeyDown={handleNameKeyDown}
					placeholder="Product notes"
					autoFocus
				/>
			</z-field>

			<z-field label="Description">
				<z-textarea
					value={folderDescription}
					oninput={onZestValue<string>((value) => $composer.set.lookup('folderDescription', value))}
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
