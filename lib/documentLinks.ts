export type ResolvedDocumentLinkT = {
	path: string
	anchor: string
}

const DOCUMENT_LINK_PATTERN = /(?<!!)\[[^\]]*\]\(([^)]+)\)/g

const getDirectoryPath = (documentPath: string): string => {
	const parts = documentPath.split('/').filter(Boolean)
	parts.pop()
	return parts.join('/')
}

const normalizePathParts = (parts: string[]): string[] => {
	const normalized: string[] = []

	for (const part of parts) {
		if (!part || part === '.') continue
		if (part === '..') {
			normalized.pop()
			continue
		}
		normalized.push(part)
	}

	return normalized
}

const getMarkdownDestination = (destinationWithTitle: string): string => {
	const destination = destinationWithTitle.trim()
	if (!destination.startsWith('<')) return destination.split(/\s+["']/)[0]
	const closingBracketIndex = destination.indexOf('>')
	if (closingBracketIndex < 0) return destination
	return destination.slice(1, closingBracketIndex)
}

export const normalizeWorkspacePath = (path: string): string => {
	const decodedPath = decodeURIComponent(path)
	return normalizePathParts(decodedPath.split('/')).join('/')
}

export const getZokkuDocumentIdFromHref = (href: string): string | null => {
	const trimmedHref = href.trim()
	if (!trimmedHref) return null

	let pathname = trimmedHref
	try {
		const parsedUrl = new URL(trimmedHref, 'https://zokku.local')
		pathname = parsedUrl.pathname
	} catch {
		return null
	}

	const match = pathname.match(/^\/documents\/([^/]+)(?:\/preview)?\/?$/)
	if (match === null) return null

	try {
		return decodeURIComponent(match[1])
	} catch {
		return match[1]
	}
}

export const resolveDocumentHref = (currentDocumentPath: string, href: string): ResolvedDocumentLinkT | null => {
	const trimmedHref = href.trim()
	if (!trimmedHref) return null
	if (trimmedHref.startsWith('#')) return null
	if (/^[a-z][a-z0-9+.-]*:/i.test(trimmedHref)) return null

	const hashIndex = trimmedHref.indexOf('#')
	const pathPart = hashIndex >= 0 ? trimmedHref.slice(0, hashIndex) : trimmedHref
	const anchor = hashIndex >= 0 ? trimmedHref.slice(hashIndex + 1) : ''
	const decodedPathPart = decodeURIComponent(pathPart)
	if (!decodedPathPart.toLowerCase().endsWith('.md')) return null

	const currentDirectory = getDirectoryPath(currentDocumentPath)
	const isWorkspaceAbsolute = decodedPathPart.startsWith('/')
	const unresolvedPath = isWorkspaceAbsolute ? decodedPathPart.slice(1) : `${currentDirectory}/${decodedPathPart}`
	const path = normalizeWorkspacePath(unresolvedPath)
	return { path, anchor }
}

export const getRelativeDocumentHref = (currentDocumentPath: string, targetDocumentPath: string): string => {
	const currentDirectoryParts = getDirectoryPath(currentDocumentPath).split('/').filter(Boolean)
	const targetParts = targetDocumentPath.split('/').filter(Boolean)
	let commonLength = 0

	for (const currentPart of currentDirectoryParts) {
		const targetPart = targetParts[commonLength]
		if (currentPart !== targetPart) break
		commonLength += 1
	}

	const upParts = currentDirectoryParts.slice(commonLength).map(() => '..')
	const downParts = targetParts.slice(commonLength)
	const relativeParts = [...upParts, ...downParts]
	const relativePath = relativeParts.join('/') || targetDocumentPath
	return encodeURI(relativePath).replaceAll('(', '%28').replaceAll(')', '%29')
}

export const getLinkedDocumentPaths = (currentDocumentPath: string, markdown: string): string[] => {
	const paths = new Set<string>()

	for (const match of markdown.matchAll(DOCUMENT_LINK_PATTERN)) {
		const destination = getMarkdownDestination(match[1])
		const resolved = resolveDocumentHref(currentDocumentPath, destination)
		if (resolved === null) continue
		paths.add(resolved.path)
	}

	return [...paths]
}

export const getLinkedZokkuDocumentIds = (markdown: string): string[] => {
	const ids = new Set<string>()

	for (const match of markdown.matchAll(DOCUMENT_LINK_PATTERN)) {
		const destination = getMarkdownDestination(match[1])
		const documentId = getZokkuDocumentIdFromHref(destination)
		if (documentId === null) continue
		ids.add(documentId)
	}

	return [...ids]
}
