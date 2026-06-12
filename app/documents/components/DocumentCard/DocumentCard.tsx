'use client'

import './DocumentCard.css'
import { ChangeEvent, JSX, MouseEvent } from 'react'
import { useRouter } from 'next/navigation'
import { Id } from '@/convex/_generated/dataModel'
import { $folders, DocumentT, FolderT } from '../../stores'

export const formatRelativeTime = (timestamp: number): string => {
	const nowMs = Date.now()
	const diffMs = nowMs - timestamp
	const diffMinutes = Math.floor(diffMs / 60_000)
	const diffHours = Math.floor(diffMs / 3_600_000)
	const diffDays = Math.floor(diffMs / 86_400_000)

	const isJustNow = diffMinutes < 1
	if (isJustNow) return 'Just now'

	const isUnderAnHour = diffMinutes < 60
	if (isUnderAnHour) return `${diffMinutes}m ago`

	const isUnderADay = diffHours < 24
	if (isUnderADay) return `${diffHours}h ago`

	const isUnderAWeek = diffDays < 7
	if (isUnderAWeek) return `${diffDays}d ago`

	return new Date(timestamp).toLocaleDateString('en-US', {
		month: 'short',
		day: 'numeric',
		year: 'numeric'
	})
}

export const getContentPreview = (content: string): string => {
	const withoutHeadings = content.replace(/^#{1,6}\s+.*/gm, '')
	const withoutMarkup = withoutHeadings.replace(/[*_`~>[\]]/g, '')
	const normalized = withoutMarkup.replace(/\s+/g, ' ').trim()
	return normalized.slice(0, 160)
}

type DocumentCardPropsT = {
	document: DocumentT
	folders: FolderT[]
	onMove: (documentId: Id<'documents'>, value: string) => Promise<void>
	onShare: (documentId: string) => void
}

export const DocumentCard = (props: DocumentCardPropsT): JSX.Element => {
	const router = useRouter()
	const copiedId = $folders.use.lookup('copiedId')

	const relativeTime = formatRelativeTime(props.document.updatedAt)
	const preview = getContentPreview(props.document.content)
	const hasPreview = preview.length > 0
	const titleLabel = props.document.title || 'Untitled'
	const isCopied = copiedId === props.document._id
	const shareLabel = isCopied ? 'Copied' : 'Share'
	const folder = props.folders.find((item) => item._id === props.document.folderId)
	const folderLabel = folder?.name ?? 'Uncategorized'

	const handleCardClick = (): void => {
		router.push(`/documents/${props.document._id}`)
	}

	const handleMoveChange = (event: ChangeEvent<HTMLSelectElement>): void => {
		props.onMove(props.document._id, event.target.value)
	}

	const handleShareClick = (event: MouseEvent): void => {
		event.stopPropagation()
		props.onShare(props.document._id)
	}

	return (
		<article className="documentCard" onClick={handleCardClick}>
			<div className="documentCardBody">
				<div className="documentCardTopline">
					<span>{folderLabel}</span>
					<span>Edited {relativeTime}</span>
				</div>
				<div className="documentCardTitle">{titleLabel}</div>
				{hasPreview && <div className="documentCardPreview">{preview}</div>}
			</div>

			<div className="documentCardActions">
				<label className="documentMoveControl" onClick={(event) => event.stopPropagation()}>
					<span>Move to</span>
					<select value={props.document.folderId ?? 'uncategorized'} onChange={handleMoveChange}>
						<option value="uncategorized">Uncategorized</option>
						{props.folders.map((folderOption) => (
							<option key={folderOption._id} value={folderOption._id}>
								{folderOption.name}
							</option>
						))}
					</select>
				</label>

				<button className="documentCardShareButton" onClick={handleShareClick} data-copied={isCopied ? 'true' : 'false'}>
					{shareLabel}
				</button>
			</div>
		</article>
	)
}
