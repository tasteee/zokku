export const getEditorHref = (documentId: string, anchor = ''): string => {
	const query = new URLSearchParams({ id: documentId }).toString()
	return `/documents/editor/?${query}${anchor ? `#${encodeURIComponent(anchor)}` : ''}`
}

export const getPreviewHref = (documentId: string, anchor = ''): string => {
	const query = new URLSearchParams({ id: documentId }).toString()
	return `/documents/preview/?${query}${anchor ? `#${encodeURIComponent(anchor)}` : ''}`
}

export const getDocumentIdFromLocation = (): string => {
	if (typeof window === 'undefined') return ''
	return new URLSearchParams(window.location.search).get('id') ?? ''
}
