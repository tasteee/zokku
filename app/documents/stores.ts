'use client'

import { datass } from 'datass'
import { Id } from '@/convex/_generated/dataModel'

export type FolderFilterT = 'all' | 'uncategorized' | Id<'folders'>

export type DocumentT = {
	_id: Id<'documents'>
	title: string
	content: string
	folderId?: Id<'folders'>
	updatedAt: number
}

export type FolderT = {
	_id: Id<'folders'>
	name: string
	description?: string
}

export type SearchResultT = {
	_id: Id<'documents'>
	title: string
	snippet: string
	matchType: string
	folderId?: Id<'folders'>
	updatedAt: number
}

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
	confirmingFolderId: string | null
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
	isOpen: false,
	confirmingFolderId: null
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
