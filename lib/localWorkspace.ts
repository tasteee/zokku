export type LocalFolderT = {
	_id: string
	name: string
	path: string
	description?: string
}

export type LocalDocumentT = {
	_id: string
	title: string
	content: string
	path: string
	folderId?: string
	updatedAt: number
}

export type LocalSearchResultT = LocalDocumentT & {
	snippet: string
	matchType: 'title' | 'content'
}

export type TrashedDocumentT = Pick<LocalDocumentT, '_id' | 'title' | 'content' | 'path'> & {
	workspaceName: string
	deletedAt: number
	expiresAt: number
}

export type ResolvedWorkspaceMediaT = {
	html: string
	objectUrls: string[]
}

type DirectoryHandleT = FileSystemDirectoryHandle & {
	values: () => AsyncIterableIterator<FileSystemHandle>
	entries: () => AsyncIterableIterator<[string, FileSystemHandle]>
}

type PermissionHandleT = FileSystemHandle & {
	queryPermission: (options: { mode: 'readwrite' }) => Promise<PermissionState>
	requestPermission: (options: { mode: 'readwrite' }) => Promise<PermissionState>
}

type WindowWithDirectoryPickerT = Window & {
	showDirectoryPicker: (options?: { id?: string; mode?: 'read' | 'readwrite'; startIn?: string }) => Promise<FileSystemDirectoryHandle>
}

const DB_NAME = 'zokku-local'
const DB_VERSION = 2
const STORE_NAME = 'workspace'
const HANDLE_KEY = 'root'
const ASSETS_DIRECTORY = 'assets'
const DOCUMENT_TRASH_KEY = 'document-trash'
const TRASH_RETENTION_MS = 30 * 24 * 60 * 60 * 1000

let rootHandle: FileSystemDirectoryHandle | null = null

const encodePath = (path: string): string => {
	const bytes = new TextEncoder().encode(path)
	let binary = ''
	for (const byte of bytes) binary += String.fromCharCode(byte)
	return btoa(binary).replaceAll('+', '-').replaceAll('/', '_').replaceAll('=', '')
}

const decodePath = (id: string): string => {
	const base64 = id.replaceAll('-', '+').replaceAll('_', '/')
	const padded = base64.padEnd(Math.ceil(base64.length / 4) * 4, '=')
	const binary = atob(padded)
	const bytes = Uint8Array.from(binary, (character) => character.charCodeAt(0))
	return new TextDecoder().decode(bytes)
}

const slugify = (value: string): string => {
	const slug = value
		.toLowerCase()
		.trim()
		.replace(/[^a-z0-9]+/g, '-')
		.replace(/^-+|-+$/g, '')
	return slug || 'untitled'
}

const normalizePath = (path: string): string => {
	const normalized: string[] = []
	for (const part of path.split('/')) {
		if (!part || part === '.') continue
		if (part === '..') {
			normalized.pop()
			continue
		}
		normalized.push(part)
	}
	return normalized.join('/')
}

const getDocumentDirectoryPath = (documentPath: string): string => {
	const parts = documentPath.split('/').filter(Boolean)
	parts.pop()
	return parts.join('/')
}

const getRelativeWorkspacePath = (currentDocumentPath: string, targetPath: string): string => {
	const currentParts = getDocumentDirectoryPath(currentDocumentPath).split('/').filter(Boolean)
	const targetParts = targetPath.split('/').filter(Boolean)
	let commonLength = 0

	while (commonLength < currentParts.length && commonLength < targetParts.length && currentParts[commonLength] === targetParts[commonLength]) {
		commonLength += 1
	}

	const upParts = currentParts.slice(commonLength).map(() => '..')
	const downParts = targetParts.slice(commonLength)
	return [...upParts, ...downParts].join('/') || targetPath
}

const getMediaExtension = (blob: Blob): string => {
	if (blob instanceof File) {
		const match = blob.name.toLowerCase().match(/\.([a-z0-9]{1,10})$/)
		if (match !== null) return match[1]
	}

	const subtype = blob.type.split('/')[1]?.toLowerCase() ?? ''
	const knownExtensions: Record<string, string> = {
		'jpeg': 'jpg',
		'svg+xml': 'svg',
		'quicktime': 'mov',
		'x-m4v': 'm4v'
	}
	const normalizedSubtype = subtype.replace(/[^a-z0-9]/g, '')
	return knownExtensions[subtype] || normalizedSubtype || 'bin'
}

const getMediaStem = (blob: Blob): string => {
	if (!(blob instanceof File)) return 'media'
	const withoutExtension = blob.name.replace(/\.[^.]+$/, '')
	const stem = slugify(withoutExtension)
	return stem === 'untitled' ? 'media' : stem
}

const openDatabase = (): Promise<IDBDatabase> => {
	return new Promise((resolve, reject) => {
		const request = indexedDB.open(DB_NAME, DB_VERSION)
		request.onupgradeneeded = () => {
			const database = request.result
			if (!database.objectStoreNames.contains(STORE_NAME)) database.createObjectStore(STORE_NAME)
		}
		request.onsuccess = () => resolve(request.result)
		request.onerror = () => reject(request.error)
	})
}

const persistHandle = async (handle: FileSystemDirectoryHandle): Promise<void> => {
	const database = await openDatabase()
	await new Promise<void>((resolve, reject) => {
		const transaction = database.transaction(STORE_NAME, 'readwrite')
		transaction.objectStore(STORE_NAME).put(handle, HANDLE_KEY)
		transaction.oncomplete = () => resolve()
		transaction.onerror = () => reject(transaction.error)
	})
	database.close()
}

const readPersistedHandle = async (): Promise<FileSystemDirectoryHandle | null> => {
	const database = await openDatabase()
	const handle = await new Promise<FileSystemDirectoryHandle | null>((resolve, reject) => {
		const transaction = database.transaction(STORE_NAME, 'readonly')
		const request = transaction.objectStore(STORE_NAME).get(HANDLE_KEY)
		request.onsuccess = () => resolve((request.result as FileSystemDirectoryHandle | undefined) ?? null)
		request.onerror = () => reject(request.error)
	})
	database.close()
	return handle
}

const readStoredValue = async <T>(key: string): Promise<T | null> => {
	const database = await openDatabase()
	try {
		return await new Promise<T | null>((resolve, reject) => {
			const transaction = database.transaction(STORE_NAME, 'readonly')
			const request = transaction.objectStore(STORE_NAME).get(key)
			request.onsuccess = () => resolve((request.result as T | undefined) ?? null)
			request.onerror = () => reject(request.error)
		})
	} finally {
		database.close()
	}
}

const writeStoredValue = async (key: string, value: unknown): Promise<void> => {
	const database = await openDatabase()
	try {
		await new Promise<void>((resolve, reject) => {
			const transaction = database.transaction(STORE_NAME, 'readwrite')
			transaction.objectStore(STORE_NAME).put(value, key)
			transaction.oncomplete = () => resolve()
			transaction.onerror = () => reject(transaction.error)
		})
	} finally {
		database.close()
	}
}

const hasReadWritePermission = async (handle: FileSystemDirectoryHandle): Promise<boolean> => {
	const permissionHandle = handle as unknown as PermissionHandleT
	if (typeof permissionHandle.queryPermission !== 'function') return true
	return (await permissionHandle.queryPermission({ mode: 'readwrite' })) === 'granted'
}

const requestReadWritePermission = async (handle: FileSystemDirectoryHandle): Promise<boolean> => {
	const permissionHandle = handle as unknown as PermissionHandleT
	if (typeof permissionHandle.requestPermission !== 'function') return true
	return (await permissionHandle.requestPermission({ mode: 'readwrite' })) === 'granted'
}

export const isFileSystemWorkspaceSupported = (): boolean => {
	return typeof window !== 'undefined' && 'showDirectoryPicker' in window
}

export const chooseWorkspace = async (): Promise<string> => {
	if (!isFileSystemWorkspaceSupported()) throw new Error('This browser does not support local folder workspaces. Use Chrome or Edge.')
	const pickerWindow = window as unknown as WindowWithDirectoryPickerT
	const handle = await pickerWindow.showDirectoryPicker({ id: 'zokku-workspace', mode: 'readwrite' })
	rootHandle = handle
	await persistHandle(handle)
	return handle.name
}

export const restoreWorkspace = async (requestPermission = false): Promise<string | null> => {
	if (rootHandle !== null) return rootHandle.name
	const persisted = await readPersistedHandle()
	if (persisted === null) return null
	const hasPermission = await hasReadWritePermission(persisted)
	const permissionGranted = hasPermission || (requestPermission && (await requestReadWritePermission(persisted)))
	if (!permissionGranted) return null
	rootHandle = persisted
	return persisted.name
}

export const getWorkspaceName = (): string | null => rootHandle?.name ?? null

const requireWorkspace = async (): Promise<FileSystemDirectoryHandle> => {
	if (rootHandle !== null) return rootHandle
	const restored = await restoreWorkspace(false)
	if (restored === null || rootHandle === null) throw new Error('NO_WORKSPACE')
	return rootHandle
}

const getDirectory = async (path: string, create = false): Promise<FileSystemDirectoryHandle> => {
	let directory = await requireWorkspace()
	const parts = path.split('/').filter(Boolean)
	for (const part of parts) directory = await directory.getDirectoryHandle(part, { create })
	return directory
}

const getParentAndName = (path: string): { directoryPath: string; name: string } => {
	const parts = path.split('/').filter(Boolean)
	const name = parts.pop()
	if (!name) throw new Error(`Invalid path: ${path}`)
	return { directoryPath: parts.join('/'), name }
}

const readWorkspaceFile = async (path: string): Promise<File | null> => {
	try {
		const { directoryPath, name } = getParentAndName(path)
		const directory = await getDirectory(directoryPath)
		const handle = await directory.getFileHandle(name)
		return await handle.getFile()
	} catch {
		return null
	}
}

const resolveWorkspaceMediaPath = (currentDocumentPath: string, src: string): string | null => {
	const trimmed = src.trim()
	if (!trimmed || trimmed.startsWith('#')) return null
	if (/^[a-z][a-z0-9+.-]*:/i.test(trimmed)) return null

	let decoded = ''
	try {
		decoded = decodeURIComponent(trimmed.split(/[?#]/)[0])
	} catch {
		return null
	}
	if (!decoded) return null

	const currentDirectory = getDocumentDirectoryPath(currentDocumentPath)
	const unresolved = decoded.startsWith('/') ? decoded.slice(1) : `${currentDirectory}/${decoded}`
	const normalized = normalizePath(unresolved)
	return normalized || null
}

const readMarkdownFile = async (path: string): Promise<LocalDocumentT> => {
	const { directoryPath, name } = getParentAndName(path)
	const directory = await getDirectory(directoryPath)
	const handle = await directory.getFileHandle(name)
	const file = await handle.getFile()
	const content = await file.text()
	const title = name.replace(/\.md$/i, '').replaceAll('-', ' ')
	return {
		_id: encodePath(path),
		title,
		content,
		path,
		folderId: directoryPath ? encodePath(directoryPath) : undefined,
		updatedAt: file.lastModified
	}
}

const walk = async (directory: FileSystemDirectoryHandle, basePath = ''): Promise<{ folders: LocalFolderT[]; documents: LocalDocumentT[] }> => {
	const folders: LocalFolderT[] = []
	const documents: LocalDocumentT[] = []
	const iterable = directory as DirectoryHandleT

	for await (const handle of iterable.values()) {
		const path = basePath ? `${basePath}/${handle.name}` : handle.name
		if (handle.kind === 'directory') {
			if (path === ASSETS_DIRECTORY) continue
			folders.push({ _id: encodePath(path), name: handle.name, path })
			const nested = await walk(handle as FileSystemDirectoryHandle, path)
			folders.push(...nested.folders)
			documents.push(...nested.documents)
			continue
		}
		if (!handle.name.toLowerCase().endsWith('.md')) continue
		documents.push(await readMarkdownFile(path))
	}

	return { folders, documents }
}

export const listWorkspace = async (): Promise<{ folders: LocalFolderT[]; documents: LocalDocumentT[] }> => {
	const root = await requireWorkspace()
	return walk(root)
}

export const getDocument = async (id: string): Promise<LocalDocumentT | null> => {
	try {
		return await readMarkdownFile(decodePath(id))
	} catch {
		return null
	}
}

export const createDocument = async (folderId?: string): Promise<LocalDocumentT> => {
	const folderPath = folderId ? decodePath(folderId) : ''
	const directory = await getDirectory(folderPath)
	let index = 1
	let filename = 'untitled.md'
	while (true) {
		try {
			await directory.getFileHandle(filename)
			index += 1
			filename = `untitled-${index}.md`
		} catch {
			break
		}
	}
	const handle = await directory.getFileHandle(filename, { create: true })
	const writable = await handle.createWritable()
	await writable.write('')
	await writable.close()
	const path = folderPath ? `${folderPath}/${filename}` : filename
	return readMarkdownFile(path)
}

export const saveDocument = async (id: string, title: string, content: string): Promise<string> => {
	const currentPath = decodePath(id)
	const { directoryPath, name } = getParentAndName(currentPath)
	const directory = await getDirectory(directoryPath)
	const nextName = `${slugify(title)}.md`
	const targetName = title.trim() ? nextName : name

	if (targetName !== name) {
		const target = await directory.getFileHandle(targetName, { create: true })
		const targetWritable = await target.createWritable()
		await targetWritable.write(content)
		await targetWritable.close()
		await directory.removeEntry(name)
		const nextPath = directoryPath ? `${directoryPath}/${targetName}` : targetName
		return encodePath(nextPath)
	}

	const handle = await directory.getFileHandle(name)
	const writable = await handle.createWritable()
	await writable.write(content)
	await writable.close()
	return id
}

export const removeDocument = async (id: string): Promise<void> => {
	const { directoryPath, name } = getParentAndName(decodePath(id))
	const directory = await getDirectory(directoryPath)
	await directory.removeEntry(name)
}

const getTrashedDocuments = async (): Promise<TrashedDocumentT[]> => {
	const documents = (await readStoredValue<TrashedDocumentT[]>(DOCUMENT_TRASH_KEY)) ?? []
	const retainedDocuments = documents.filter((document) => document.deletedAt > Date.now() - TRASH_RETENTION_MS)
	if (retainedDocuments.length !== documents.length) await writeStoredValue(DOCUMENT_TRASH_KEY, retainedDocuments)
	return retainedDocuments
}

export const listTrashedDocuments = async (): Promise<TrashedDocumentT[]> => {
	const workspaceName = await restoreWorkspace(false)
	if (workspaceName === null) return []
	return (await getTrashedDocuments()).filter((document) => document.workspaceName === workspaceName).sort((left, right) => right.deletedAt - left.deletedAt).map((document) => ({
		...document,
		expiresAt: document.deletedAt + TRASH_RETENTION_MS
	}))
}

export const trashDocument = async (id: string): Promise<void> => {
	const document = await getDocument(id)
	if (document === null) throw new Error('Document not found')
	const workspaceName = await restoreWorkspace(false)
	if (workspaceName === null) throw new Error('Workspace not found')
	const trashedDocuments = await getTrashedDocuments()
	const trashedDocument: TrashedDocumentT = {
		_id: crypto.randomUUID(),
		title: document.title,
		content: document.content,
		path: document.path,
		workspaceName,
		deletedAt: Date.now(),
		expiresAt: Date.now() + TRASH_RETENTION_MS
	}
	await writeStoredValue(DOCUMENT_TRASH_KEY, [trashedDocument, ...trashedDocuments])
	await removeDocument(id)
}

export const restoreTrashedDocument = async (id: string): Promise<void> => {
	const trashedDocuments = await getTrashedDocuments()
	const document = trashedDocuments.find((candidate) => candidate._id === id)
	if (document === undefined) return
	const { directoryPath, name } = getParentAndName(document.path)
	const directory = await getDirectory(directoryPath, true)
	const handle = await directory.getFileHandle(name, { create: true })
	const writable = await handle.createWritable()
	await writable.write(document.content)
	await writable.close()
	await writeStoredValue(DOCUMENT_TRASH_KEY, trashedDocuments.filter((candidate) => candidate._id !== id))
}

export const createFolder = async (name: string): Promise<LocalFolderT> => {
	const root = await requireWorkspace()
	const safeName = name.trim()
	if (!safeName) throw new Error('Folder name is required')
	if (safeName === ASSETS_DIRECTORY) throw new Error(`${ASSETS_DIRECTORY} is reserved for workspace media`)
	await root.getDirectoryHandle(safeName, { create: true })
	return { _id: encodePath(safeName), name: safeName, path: safeName }
}

export const removeFolder = async (id: string): Promise<void> => {
	const path = decodePath(id)
	const { directoryPath, name } = getParentAndName(path)
	const directory = await getDirectory(directoryPath)
	await directory.removeEntry(name, { recursive: true })
}

export const moveDocument = async (documentId: string, folderId?: string): Promise<string> => {
	const document = await getDocument(documentId)
	if (document === null) throw new Error('Document not found')
	const targetPath = folderId ? decodePath(folderId) : ''
	const targetDirectory = await getDirectory(targetPath)
	const filename = document.path.split('/').pop() ?? 'untitled.md'
	const target = await targetDirectory.getFileHandle(filename, { create: true })
	const writable = await target.createWritable()
	await writable.write(document.content)
	await writable.close()
	await removeDocument(documentId)
	return encodePath(targetPath ? `${targetPath}/${filename}` : filename)
}

export const searchDocuments = async (query: string): Promise<LocalSearchResultT[]> => {
	const term = query.trim().toLowerCase()
	if (!term) return []
	const { documents } = await listWorkspace()
	return documents
		.map((document): LocalSearchResultT | null => {
			const titleIndex = document.title.toLowerCase().indexOf(term)
			const contentIndex = document.content.toLowerCase().indexOf(term)
			if (titleIndex < 0 && contentIndex < 0) return null
			const matchType = titleIndex >= 0 ? 'title' : 'content'
			const start = Math.max(0, contentIndex - 60)
			const snippet = matchType === 'title' ? document.content.slice(0, 140) : document.content.slice(start, start + 180)
			return { ...document, matchType, snippet }
		})
		.filter((result): result is LocalSearchResultT => result !== null)
}

export const saveMedia = async (blob: Blob, currentDocumentPath: string, onProgress?: (percent: number) => void): Promise<string> => {
	const root = await requireWorkspace()
	const assets = await root.getDirectoryHandle(ASSETS_DIRECTORY, { create: true })
	const extension = getMediaExtension(blob)
	const stem = getMediaStem(blob)
	const filename = `${stem}-${crypto.randomUUID().slice(0, 8)}.${extension}`
	const handle = await assets.getFileHandle(filename, { create: true })
	const writable = await handle.createWritable()
	onProgress?.(10)
	await writable.write(blob)
	await writable.close()
	onProgress?.(100)
	return getRelativeWorkspacePath(currentDocumentPath, `${ASSETS_DIRECTORY}/${filename}`)
}

export const resolveWorkspaceMediaInHtml = async (html: string, currentDocumentPath: string): Promise<ResolvedWorkspaceMediaT> => {
	if (!html || !currentDocumentPath) return { html, objectUrls: [] }

	const parser = new DOMParser()
	const parsed = parser.parseFromString(`<body>${html}</body>`, 'text/html')
	const mediaElements = Array.from(parsed.body.querySelectorAll<HTMLElement>('img[src], video[src], source[src]'))
	const objectUrls: string[] = []

	await Promise.all(mediaElements.map(async (element) => {
		const src = element.getAttribute('src') ?? ''
		const path = resolveWorkspaceMediaPath(currentDocumentPath, src)
		if (path === null) return
		const file = await readWorkspaceFile(path)
		if (file === null) return
		const objectUrl = URL.createObjectURL(file)
		objectUrls.push(objectUrl)
		element.setAttribute('src', objectUrl)
	}))

	return { html: parsed.body.innerHTML, objectUrls }
}
