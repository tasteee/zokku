'use server'

import Anthropic from '@anthropic-ai/sdk'

type MessageT = {
	role: 'user' | 'assistant'
	content: string
}

type SendMessageInputT = {
	messages: MessageT[]
	documentTitle: string
	documentContent: string
}

const anthropic = new Anthropic({
	apiKey: process.env.ANTHROPIC_API_KEY,
})

const buildSystemPrompt = (input: { documentTitle: string; documentContent: string }): string => {
	const hasTitle = input.documentTitle.trim().length > 0
	const hasContent = input.documentContent.trim().length > 0

	const titleSection = hasTitle ? `Document title: ${input.documentTitle}` : 'Document title: (untitled)'
	const contentSection = hasContent
		? `Document content:\n\`\`\`\n${input.documentContent}\n\`\`\``
		: 'Document content: (empty)'

	return `You are a helpful writing assistant. The user is currently editing a document and may ask you questions about it, request edits, ask for summaries, or seek writing help.

${titleSection}

${contentSection}

Be concise and direct. When suggesting edits, quote the relevant passage and show the revision clearly.`
}

export const sendMessageToClaude = async (input: SendMessageInputT): Promise<string> => {
	const systemPrompt = buildSystemPrompt({
		documentTitle: input.documentTitle,
		documentContent: input.documentContent,
	})

	const response = await anthropic.messages.create({
		model: 'claude-opus-4-5',
		max_tokens: 1024,
		system: systemPrompt,
		messages: input.messages,
	})

	const firstBlock = response.content[0]
	const isTextBlock = firstBlock.type === 'text'

	if (!isTextBlock) return 'Sorry, I could not generate a response.'

	return firstBlock.text
}
