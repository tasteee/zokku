'use client'

import { getLinkedDocumentPaths } from '@/lib/documentLinks'
import { listWorkspace } from '@/lib/localWorkspace'
import type { LocalDocumentT } from '@/lib/localWorkspace'

export type ExportDocumentT = {
	path: string
	title: string
	content: string
}

const collectLinkedDocuments = (
	document: LocalDocumentT,
	documentsByPath: Map<string, LocalDocumentT>,
	visitedPaths: Set<string>,
	collected: ExportDocumentT[]
): void => {
	if (visitedPaths.has(document.path)) return
	visitedPaths.add(document.path)
	collected.push({ path: document.path, title: document.title, content: document.content })

	const linkedPaths = getLinkedDocumentPaths(document.path, document.content)
	for (const linkedPath of linkedPaths) {
		const linkedDocument = documentsByPath.get(linkedPath)
		if (linkedDocument === undefined) continue
		collectLinkedDocuments(linkedDocument, documentsByPath, visitedPaths, collected)
	}
}

export const getExportDocuments = async (rootDocumentId: string): Promise<ExportDocumentT[]> => {
	const workspace = await listWorkspace()
	const rootDocument = workspace.documents.find((document) => document._id === rootDocumentId)
	if (rootDocument === undefined) throw new Error('Root document not found')

	const documentsByPath = new Map<string, LocalDocumentT>()
	for (const document of workspace.documents) documentsByPath.set(document.path, document)

	const visitedPaths = new Set<string>()
	const collected: ExportDocumentT[] = []
	collectLinkedDocuments(rootDocument, documentsByPath, visitedPaths, collected)
	return collected
}
