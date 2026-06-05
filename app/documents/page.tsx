'use client'

import { JSX } from 'react'
import { useQuery, useMutation } from 'convex/react'
import { useAuthActions } from '@convex-dev/auth/react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { api } from '@/convex/_generated/api'
import { ZButton } from '@/components/zButton'

const formatRelativeTime = (timestamp: number): string => {
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

const getContentPreview = (content: string): string => {
	const withoutHeadings = content.replace(/^#{1,6}\s+.*/gm, '')
	const withoutMarkup = withoutHeadings.replace(/[*_`~>\[\]]/g, '')
	const normalized = withoutMarkup.replace(/\s+/g, ' ').trim()
	return normalized.slice(0, 160)
}

const DocumentsPage = (): JSX.Element => {
	const documents = useQuery(api.documents.list)
	const createDocument = useMutation(api.documents.create)
	const { signOut } = useAuthActions()
	const router = useRouter()

	const handleNew = async (): Promise<void> => {
		const documentId = await createDocument()
		router.push(`/documents/${documentId}`)
	}

	const handleSignOut = async (): Promise<void> => {
		await signOut()
		router.push('/sign-in')
	}

	const isLoading = documents === undefined
	const hasDocuments = !isLoading && documents.length > 0
	const isEmpty = !isLoading && documents.length === 0
	const skeletonKeys = [0, 1, 2, 3, 4, 5]

	return (
		<div className="DocumentsHome">
			<header className="DocumentsHomeHeader">
				<span className="DocumentsHomeBrand">
					<span className="DocumentsHomeBrandDot" />
					Zokku
				</span>

				<div className="DocumentsHomeHeaderActions">
					<ZButton isSmall isOutlined isPink className="DocumentsNewButton" onClick={handleNew}>
						New document
					</ZButton>
					<ZButton isSmall isOutlined isNeutral className="DocumentsSignOutButton" onClick={handleSignOut}>
						Sign out
					</ZButton>
				</div>
			</header>

			<div className="DocumentsHomeBody">
				{isLoading && (
					<div className="DocumentsGrid">
						{skeletonKeys.map((key) => (
							<div key={key} className="DocumentCardSkeleton" />
						))}
					</div>
				)}

				{isEmpty && (
					<div className="DocumentsEmpty">
						<div className="DocumentsEmptyGlyph">✦</div>
						<h1 className="DocumentsEmptyTitle">No documents yet</h1>
						<p className="DocumentsEmptyBody">Create your first document and start writing something worth reading.</p>
						<ZButton className="DocumentsEmptyButton" onClick={handleNew}>
							Create document
						</ZButton>
					</div>
				)}

				{hasDocuments && (
					<div className="DocumentsGrid">
						{documents.map((doc) => {
							const relativeTime = formatRelativeTime(doc.updatedAt)
							const preview = getContentPreview(doc.content)
							const hasPreview = preview.length > 0
							const titleLabel = doc.title || 'Untitled'

							return (
								<Link key={doc._id} href={`/documents/${doc._id}`} className="DocumentCard">
									<div className="DocumentCardTitle">{titleLabel}</div>
									<div className="DocumentCardMeta">Edited {relativeTime}</div>
									{hasPreview && <div className="DocumentCardPreview">{preview}</div>}
								</Link>
							)
						})}
					</div>
				)}
			</div>
		</div>
	)
}

export default DocumentsPage
