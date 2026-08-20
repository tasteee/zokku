import { datass } from 'datass'
import type { LocalDocumentT, LocalFolderT, LocalSearchResultT } from '@/lib/localWorkspace'

export type FolderFilterT = 'all' | 'uncategorized' | string
export type DocumentT = LocalDocumentT
export type FolderT = LocalFolderT
export type SearchResultT = LocalSearchResultT

type SearchStateT = {
	input: string
	isOpen: boolean
	isLoading: boolean
	results: SearchResultT[]
}

type ComposerStateT = {
	folderName: string
	folderDescription: string
	isCreating: boolean
	isOpen: boolean
}

type FoldersStateT = {
	list: FolderT[]
	selectedId: FolderFilterT
	copiedId: string
	isLoading: boolean
}

type DocumentsStateT = {
	list: DocumentT[]
	isLoading: boolean
}

export const $search = datass.object<SearchStateT>({
	input: '',
	isOpen: false,
	isLoading: false,
	results: []
})

export const $composer = datass.object<ComposerStateT>({
	folderName: '',
	folderDescription: '',
	isCreating: false,
	isOpen: false
})

export const $folders = datass.object<FoldersStateT>({
	list: [],
	selectedId: 'all',
	copiedId: '',
	isLoading: true
})

export const $documents = datass.object<DocumentsStateT>({
	list: [],
	isLoading: true
})
