'use client'

import { listWorkspace } from '@/lib/localWorkspace'

export type RecentWorkspaceT = {
	id: string
	name: string
	lastOpenedAt: number
	noteCount: number
	folderCount: number
	displayPath: string
}

type RecentWorkspaceRecordT = RecentWorkspaceT & {
	handle: FileSystemDirectoryHandle
}

type PermissionHandleT = FileSystemHandle & {
	queryPermission: (options: { mode: 'readwrite' }) => Promise<PermissionState>
	requestPermission: (options: { mode: 'readwrite' }) => Promise<PermissionState>
}

const DB_NAME = 'zokku-local'
const DB_VERSION = 1
const STORE_NAME = 'workspace'
const ROOT_KEY = 'root'
const RECENT_KEY = 'recent-workspaces'

const openDatabase = (): Promise<IDBDatabase> => {
	return new Promise((resolve, reject) => {
		const request = indexedDB.open(DB_NAME, DB_VERSION)
		request.onsuccess = () => resolve(request.result)
		request.onerror = () => reject(request.error)
	})
}

const readValue = async <T>(key: string): Promise<T | null> => {
	const database = await openDatabase()
	const value = await new Promise<T | null>((resolve, reject) => {
		const transaction = database.transaction(STORE_NAME, 'readonly')
		const request = transaction.objectStore(STORE_NAME).get(key)
		request.onsuccess = () => resolve((request.result as T | undefined) ?? null)
		request.onerror = () => reject(request.error)
	})
	database.close()
	return value
}

const writeValue = async (key: string, value: unknown): Promise<void> => {
	const database = await openDatabase()
	await new Promise<void>((resolve, reject) => {
		const transaction = database.transaction(STORE_NAME, 'readwrite')
		transaction.objectStore(STORE_NAME).put(value, key)
		transaction.oncomplete = () => resolve()
		transaction.onerror = () => reject(transaction.error)
	})
	database.close()
}

const getRecentRecords = async (): Promise<RecentWorkspaceRecordT[]> => {
	return (await readValue<RecentWorkspaceRecordT[]>(RECENT_KEY)) ?? []
}

const isSameEntry = async (left: FileSystemDirectoryHandle, right: FileSystemDirectoryHandle): Promise<boolean> => {
	if (typeof left.isSameEntry !== 'function') return left.name === right.name
	return left.isSameEntry(right)
}

const requestPermission = async (handle: FileSystemDirectoryHandle): Promise<boolean> => {
	const permissionHandle = handle as PermissionHandleT
	const currentPermission = await permissionHandle.queryPermission({ mode: 'readwrite' })
	if (currentPermission === 'granted') return true
	const nextPermission = await permissionHandle.requestPermission({ mode: 'readwrite' })
	return nextPermission === 'granted'
}

const getCurrentWorkspaceMetadata = async (name: string): Promise<Pick<RecentWorkspaceT, 'noteCount' | 'folderCount' | 'displayPath'>> => {
	try {
		const snapshot = await listWorkspace()
		return {
			noteCount: snapshot.documents.length,
			folderCount: snapshot.folders.length,
			displayPath: `/${name}`
		}
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
		const isMatch = await isSameEntry(record.handle, currentHandle)
		if (!isMatch) continue
		existingRecord = record
		break
	}

	const metadata = await getCurrentWorkspaceMetadata(currentHandle.name)
	const nextRecord: RecentWorkspaceRecordT = {
		id: existingRecord?.id ?? crypto.randomUUID(),
		name: currentHandle.name,
		lastOpenedAt: Date.now(),
		handle: currentHandle,
		...metadata
	}

	const remainingRecords = records.filter((record) => record.id !== nextRecord.id)
	await writeValue(RECENT_KEY, [nextRecord, ...remainingRecords])
}

export const listRecentWorkspaces = async (): Promise<RecentWorkspaceT[]> => {
	const records = await getRecentRecords()
	return records
		.slice()
		.sort((left, right) => right.lastOpenedAt - left.lastOpenedAt)
		.map((record) => ({
			id: record.id,
			name: record.name,
			lastOpenedAt: record.lastOpenedAt,
			noteCount: record.noteCount ?? 0,
			folderCount: record.folderCount ?? 0,
			displayPath: record.displayPath ?? `/${record.name}`
		}))
}

export const activateRecentWorkspace = async (id: string): Promise<boolean> => {
	const records = await getRecentRecords()
	const record = records.find((candidate) => candidate.id === id)
	if (record === undefined) return false

	const hasPermission = await requestPermission(record.handle)
	if (!hasPermission) return false

	await writeValue(ROOT_KEY, record.handle)
	const nextRecord: RecentWorkspaceRecordT = { ...record, lastOpenedAt: Date.now() }
	const remainingRecords = records.filter((candidate) => candidate.id !== id)
	await writeValue(RECENT_KEY, [nextRecord, ...remainingRecords])
	return true
}
