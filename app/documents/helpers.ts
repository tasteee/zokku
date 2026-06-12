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
