'use client'

import './DocumentCard.css'
import { ChangeEvent, JSX, MouseEvent } from 'react'
import { useRouter } from 'next/navigation'
import { $folders, DocumentT, FolderT } from '../../stores'

export const formatRelativeTime = (timestamp: number): string => {
	const diffMs = Date.now() - timestamp
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
}

export const DocumentCard = (props: DocumentCardPropsT): JSX.Element => {
	const router = useRouter()
	const copiedId = $folders.use.lookup('copiedId')
	const preview = getContentPreview(props.document.content)
	const folder = props.folders.find((item) => item._id === props.document.folderId)
	const isCopied = copiedId === props.document._id

	const handleMoveChange = (event: ChangeEvent<HTMLSelectElement>): void => {
		void props.onMove(props.document._id, event.target.value)
	}

	const handleShareClick = (event: MouseEvent): void => {
		event.stopPropagation()
		props.onShare(props.document._id)
	}

	return (
		<article className="documentCard" onClick={() => router.push(`/documents/${props.document._id}`)}>
			<div className="documentCardBody">
				<div className="documentCardTopline"><span>{folder?.name ?? 'Workspace root'}</span><span>Edited {formatRelativeTime(props.document.updatedAt)}</span></div>
				<div className="documentCardTitle">{props.document.title || 'Untitled'}</div>
				{preview.length > 0 && <div className="documentCardPreview">{preview}</div>}
			</div>
			<div className="documentCardActions">
				<label className="documentMoveControl" onClick={(event) => event.stopPropagation()}>
					<span>Move to</span>
					<select value={props.document.folderId ?? 'uncategorized'} onChange={handleMoveChange}>
						<option value="uncategorized">Workspace root</option>
						{props.folders.map((folderOption) => <option key={folderOption._id} value={folderOption._id}>{folderOption.name}</option>)}
					</select>
				</label>
				<button className="documentCardShareButton" onClick={handleShareClick} data-copied={isCopied ? 'true' : 'false'}>{isCopied ? 'Copied' : 'Copy preview link'}</button>
			</div>
		</article>
	)
}
