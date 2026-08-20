import { listWorkspace } from '@/lib/localWorkspace'

export type RecentWorkspaceT = {
	id: string
	name: string
	lastOpenedAt: number
	noteCount: number
	folderCount: number
	displayPath: string
}

export type TrashedWorkspaceT = RecentWorkspaceT & {
	deletedAt: number
	expiresAt: number
}

type RecentWorkspaceRecordT = RecentWorkspaceT & {
	handle: FileSystemDirectoryHandle
	deletedAt?: number
}
type PermissionHandleT = FileSystemHandle & {
	queryPermission?: (options: { mode: 'readwrite' }) => Promise<PermissionState>
	requestPermission?: (options: { mode: 'readwrite' }) => Promise<PermissionState>
}

const DB_NAME = 'zokku-local'
const DB_VERSION = 2
const STORE_NAME = 'workspace'
const ROOT_KEY = 'root'
const RECENT_KEY = 'recent-workspaces'
const TRASH_RETENTION_MS = 30 * 24 * 60 * 60 * 1000

const openDatabase = (): Promise<IDBDatabase> => new Promise((resolve, reject) => {
	const request = indexedDB.open(DB_NAME, DB_VERSION)
	request.onupgradeneeded = () => {
		const database = request.result
		if (!database.objectStoreNames.contains(STORE_NAME)) database.createObjectStore(STORE_NAME)
	}
	request.onsuccess = () => {
		const database = request.result
		if (!database.objectStoreNames.contains(STORE_NAME)) {
			database.close()
			reject(new Error('Unable to initialize local workspace storage.'))
			return
		}
		resolve(database)
	}
	request.onerror = () => reject(request.error ?? new Error('Unable to open local workspace storage.'))
})

const readValue = async <T>(key: string): Promise<T | null> => {
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

const writeValue = async (key: string, value: unknown): Promise<void> => {
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

const deleteValue = async (key: string): Promise<void> => {
	const database = await openDatabase()
	try {
		await new Promise<void>((resolve, reject) => {
			const transaction = database.transaction(STORE_NAME, 'readwrite')
			transaction.objectStore(STORE_NAME).delete(key)
			transaction.oncomplete = () => resolve()
			transaction.onerror = () => reject(transaction.error)
		})
	} finally {
		database.close()
	}
}

const getRecentRecords = async (): Promise<RecentWorkspaceRecordT[]> => {
	const records = (await readValue<RecentWorkspaceRecordT[]>(RECENT_KEY)) ?? []
	const expirationThreshold = Date.now() - TRASH_RETENTION_MS
	const retainedRecords = records.filter((record) => record.deletedAt === undefined || record.deletedAt > expirationThreshold)
	if (retainedRecords.length !== records.length) await writeValue(RECENT_KEY, retainedRecords)
	return retainedRecords
}
const isSameEntry = async (left: FileSystemDirectoryHandle, right: FileSystemDirectoryHandle): Promise<boolean> => typeof left.isSameEntry === 'function' ? left.isSameEntry(right) : left.name === right.name

const requestPermission = async (handle: FileSystemDirectoryHandle): Promise<boolean> => {
	const permissionHandle = handle as PermissionHandleT
	if (typeof permissionHandle.queryPermission !== 'function' || typeof permissionHandle.requestPermission !== 'function') return true
	if (await permissionHandle.queryPermission({ mode: 'readwrite' }) === 'granted') return true
	return await permissionHandle.requestPermission({ mode: 'readwrite' }) === 'granted'
}

const getCurrentWorkspaceMetadata = async (name: string): Promise<Pick<RecentWorkspaceT, 'noteCount' | 'folderCount' | 'displayPath'>> => {
	try {
		const snapshot = await listWorkspace()
		return { noteCount: snapshot.documents.length, folderCount: snapshot.folders.length, displayPath: `/${name}` }
	} catch {
		return { noteCount: 0, folderCount: 0, displayPath: `/${name}` }
	}
}

export const rememberCurrentWorkspace = async (): Promise<void> => {
	const currentHandle = await readValue<FileSystemDirectoryHandle>(ROOT_KEY)
	if (currentHandle === null) return
	const records = await getRecentRecords()
	let existingRecord: RecentWorkspaceRecordT | null = null
	for (const record of records) {
		if (!await isSameEntry(record.handle, currentHandle)) continue
		existingRecord = record
		break
	}
	const nextRecord: RecentWorkspaceRecordT = {
		id: existingRecord?.id ?? crypto.randomUUID(),
		name: currentHandle.name,
		lastOpenedAt: Date.now(),
		handle: currentHandle,
		deletedAt: undefined,
		...await getCurrentWorkspaceMetadata(currentHandle.name)
	}
	await writeValue(RECENT_KEY, [nextRecord, ...records.filter((record) => record.id !== nextRecord.id)])
}

export const listRecentWorkspaces = async (): Promise<RecentWorkspaceT[]> => {
	const records = await getRecentRecords()
	return records.filter((record) => record.deletedAt === undefined).sort((left, right) => right.lastOpenedAt - left.lastOpenedAt).map((record) => ({
		id: record.id,
		name: record.name,
		lastOpenedAt: record.lastOpenedAt,
		noteCount: record.noteCount ?? 0,
		folderCount: record.folderCount ?? 0,
		displayPath: record.displayPath ?? `/${record.name}`
	}))
}

export const listTrashedWorkspaces = async (): Promise<TrashedWorkspaceT[]> => {
	const records = await getRecentRecords()
	return records.filter((record): record is RecentWorkspaceRecordT & { deletedAt: number } => record.deletedAt !== undefined).sort((left, right) => right.deletedAt - left.deletedAt).map((record) => ({
		id: record.id,
		name: record.name,
		lastOpenedAt: record.lastOpenedAt,
		noteCount: record.noteCount ?? 0,
		folderCount: record.folderCount ?? 0,
		displayPath: record.displayPath ?? `/${record.name}`,
		deletedAt: record.deletedAt,
		expiresAt: record.deletedAt + TRASH_RETENTION_MS
	}))
}

export const trashRecentWorkspace = async (id: string): Promise<void> => {
	const records = await getRecentRecords()
	const record = records.find((candidate) => candidate.id === id && candidate.deletedAt === undefined)
	if (record === undefined) return
	await writeValue(RECENT_KEY, records.map((candidate) => candidate.id === id ? { ...candidate, deletedAt: Date.now() } : candidate))
	const currentHandle = await readValue<FileSystemDirectoryHandle>(ROOT_KEY)
	if (currentHandle !== null && await isSameEntry(record.handle, currentHandle)) await deleteValue(ROOT_KEY)
}

export const restoreTrashedWorkspace = async (id: string): Promise<void> => {
	const records = await getRecentRecords()
	await writeValue(RECENT_KEY, records.map((record) => record.id === id ? { ...record, deletedAt: undefined } : record))
}

export const activateRecentWorkspace = async (id: string): Promise<boolean> => {
	const records = await getRecentRecords()
	const record = records.find((candidate) => candidate.id === id && candidate.deletedAt === undefined)
	if (record === undefined || !await requestPermission(record.handle)) return false
	await writeValue(ROOT_KEY, record.handle)
	const nextRecord = { ...record, lastOpenedAt: Date.now() }
	await writeValue(RECENT_KEY, [nextRecord, ...records.filter((candidate) => candidate.id !== id)])
	return true
}
