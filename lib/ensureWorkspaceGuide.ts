import { createDocument, listWorkspace, saveDocument } from '@/lib/localWorkspace'
import { workspaceGuideMarkdown } from '@/lib/workspaceGuide'

const GUIDE_PATH = 'zokku-guide.md'

export const ensureWorkspaceGuide = async (): Promise<void> => {
	const workspace = await listWorkspace()
	const hasGuide = workspace.documents.some((document) => document.path.toLowerCase() === GUIDE_PATH)
	if (hasGuide) return

	const document = await createDocument()
	await saveDocument(document._id, 'Zokku Guide', workspaceGuideMarkdown)
}
