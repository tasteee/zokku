'use client'

import './DocumentCard.css'
import { JSX, MouseEvent } from 'react'
import { useRouter } from 'next/navigation'
import { Trash } from '@phosphor-icons/react'
import { $folders, DocumentT, FolderT } from '../../stores'
import { beginAppTransition } from '@/lib/appTransition'
import { getEditorHref } from '@/lib/documentRoutes'

export const formatRelativeTime = (timestamp: number): string => {
	const nowMs = Date.now()
	const diffMs = nowMs - timestamp
	const diffMinutes = Math.floor(diffMs / 60_000)
	const diffHours = Math.floor(diffMs / 3_600_000)
	const diffDays = Math.floor(diffMs / 86_400_000)
	if (diffMinutes < 1) return 'Just now'
	if (diffMinutes < 60) return `${diffMinutes}m ago`
	if (diffHours < 24) return `${diffHours}h ago`
	if (diffDays < 7) return `${diffDays}d ago`
	return new Date(timestamp).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })
}

export const getContentPreview = (content: string): string => {
	const withoutHeadings = content.replace(/^#{1,6}\s+.*/gm, '')
	const withoutMarkup = withoutHeadings.replace(/[*_`~>[\]]/g, '')
	return withoutMarkup.replace(/\s+/g, ' ').trim().slice(0, 160)
}

type DocumentCardPropsT = {
	document: DocumentT
	folders: FolderT[]
	onMove: (documentId: string, value: string) => Promise<void>
	onShare: (documentId: string) => void
	onDelete: (documentId: string) => Promise<void>
}

export const DocumentCard = (props: DocumentCardPropsT): JSX.Element => {
	const router = useRouter()
	const copiedId = $folders.use.lookup('copiedId')
	const relativeTime = formatRelativeTime(props.document.updatedAt)
	const preview = getContentPreview(props.document.content)
	const titleLabel = props.document.title || 'Untitled'
	const isCopied = copiedId === props.document._id
	const folder = props.folders.find((item) => item._id === props.document.folderId)
	const folderOptions = [
		{ value: 'uncategorized', label: 'Uncategorized' },
		...props.folders.map((folderOption) => ({ value: folderOption._id, label: folderOption.name }))
	]

	const handleCardClick = (): void => beginAppTransition(() => router.push(getEditorHref(props.document._id)))
	const handleMoveChange = (event: CustomEvent<{ value: string }>): void => { void props.onMove(props.document._id, event.detail.value) }
	const handleShareClick = (event: MouseEvent): void => { event.stopPropagation(); props.onShare(props.document._id) }

	return (
		<z-card is-reactive className="documentCard" onClick={handleCardClick}>
			<div className="documentCardBody">
				<div className="documentCardTopline"><span>{folder?.name ?? 'Uncategorized'}</span><span>Edited {relativeTime}</span></div>
				<div className="documentCardTitle">{titleLabel}</div>
				{preview.length > 0 && <div className="documentCardPreview">{preview}</div>}
			</div>
			<div className="documentCardActions" onClick={(event: MouseEvent) => event.stopPropagation()}>
				<z-select
					label="Folder"
					value={props.document.folderId ?? 'uncategorized'}
					options={folderOptions}
					size="sm"
					onChange={handleMoveChange}
				/>
				<z-button size="sm" kind="ghost" accent={isCopied ? 'dom' : 'neutral'} onClick={handleShareClick}>{isCopied ? 'Copied' : 'Copy link'}</z-button>
				<z-alert-dialog heading="Delete this document?" description="This can't be undone." accent="error" confirm-label="Delete" onConfirm={() => void props.onDelete(props.document._id)}>
					<z-button slot="trigger" size="sm" kind="ghost" accent="error" title="Delete document" aria-label="Delete document"><Trash weight="bold" /></z-button>
				</z-alert-dialog>
			</div>
		</z-card>
	)
}
