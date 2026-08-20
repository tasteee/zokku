const DB_NAME = 'zokku-folder-metadata'
const DB_VERSION = 1
const STORE_NAME = 'descriptions'

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

const getKey = (workspaceName: string, folderPath: string): string => `${workspaceName}:${folderPath}`

export const saveFolderDescription = async (workspaceName: string, folderPath: string, description: string): Promise<void> => {
	const database = await openDatabase()
	await new Promise<void>((resolve, reject) => {
		const transaction = database.transaction(STORE_NAME, 'readwrite')
		transaction.objectStore(STORE_NAME).put(description.trim(), getKey(workspaceName, folderPath))
		transaction.oncomplete = () => resolve()
		transaction.onerror = () => reject(transaction.error)
	})
	database.close()
}

export const getFolderDescriptions = async (workspaceName: string, folderPaths: string[]): Promise<Map<string, string>> => {
	const database = await openDatabase()
	const entries = await Promise.all(folderPaths.map(async (folderPath): Promise<[string, string]> => {
		const description = await new Promise<string>((resolve, reject) => {
			const transaction = database.transaction(STORE_NAME, 'readonly')
			const request = transaction.objectStore(STORE_NAME).get(getKey(workspaceName, folderPath))
			request.onsuccess = () => resolve(String(request.result ?? ''))
			request.onerror = () => reject(request.error)
		})
		return [folderPath, description]
	}))
	database.close()
	return new Map(entries)
}
