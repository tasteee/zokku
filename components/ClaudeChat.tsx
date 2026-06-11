'use client'

import { useRef, useEffect, JSX } from 'react'
import { useDatass } from 'datass'
import { XIcon, PaperPlaneTiltIcon, SpinnerGapIcon } from '@phosphor-icons/react'
import { sendMessageToClaude } from '@/app/actions/claudeChat'

type MessageT = {
	role: 'user' | 'assistant'
	content: string
}

type ClaudeChatPropsT = {
	documentTitle: string
	documentContent: string
	onClose: () => void
}

export const ClaudeChat = (props: ClaudeChatPropsT): JSX.Element => {
	const messages = useDatass.array<MessageT>([])
	const inputText = useDatass.string('')
	const isSending = useDatass.boolean(false)
	const messagesEndRef = useRef<HTMLDivElement | null>(null)
	const textareaRef = useRef<HTMLTextAreaElement | null>(null)

	useEffect(() => {
		messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
	}, [messages.state])

	const handleSend = async (): Promise<void> => {
		const trimmedText = inputText.state.trim()
		const isEmpty = trimmedText.length === 0
		if (isEmpty || isSending.state) return

		const userMessage: MessageT = { role: 'user', content: trimmedText }
		const messagesWithUser = [...messages.state, userMessage]
		messages.set(messagesWithUser)
		inputText.set('')
		isSending.set(true)

		const conversationHistory = messagesWithUser

		const reply = await sendMessageToClaude({
			messages: conversationHistory,
			documentTitle: props.documentTitle,
			documentContent: props.documentContent,
		})

		const assistantMessage: MessageT = { role: 'assistant', content: reply }
		messages.set([...messages.state, assistantMessage])
		isSending.set(false)
	}

	const handleKeyDown = (event: React.KeyboardEvent<HTMLTextAreaElement>): void => {
		const isEnterWithoutShift = event.key === 'Enter' && !event.shiftKey
		if (!isEnterWithoutShift) return

		event.preventDefault()
		handleSend()
	}

	const handleTextareaChange = (event: React.ChangeEvent<HTMLTextAreaElement>): void => {
		inputText.set(event.target.value)
	}

	const isEmptyConversation = messages.state.length === 0

	return (
		<div className="ClaudeChat">
			<div className="ClaudeChatHeader">
				<div className="ClaudeChatHeaderLeft">
					<span className="ClaudeChatHeaderDot" />
					<span className="ClaudeChatHeaderTitle">Ask Claude</span>
				</div>
				<button className="ClaudeChatCloseButton" onClick={props.onClose} title="Close">
					<XIcon size={16} weight="bold" />
				</button>
			</div>

			<div className="ClaudeChatMessages">
				{isEmptyConversation && (
					<div className="ClaudeChatEmptyState">
						<p className="ClaudeChatEmptyStateText">Ask Claude anything about this document.</p>
					</div>
				)}

				{messages.state.map((message: MessageT, index: number) => {
					const isUser = message.role === 'user'
					const bubbleClass = isUser ? 'ClaudeChatBubble ClaudeChatBubbleUser' : 'ClaudeChatBubble ClaudeChatBubbleAssistant'

					return (
						<div key={index} className={bubbleClass}>
							<span className="ClaudeChatBubbleRole">{isUser ? 'You' : 'Claude'}</span>
							<p className="ClaudeChatBubbleContent">{message.content}</p>
						</div>
					)
				})}

				{isSending.state && (
					<div className="ClaudeChatBubble ClaudeChatBubbleAssistant">
						<span className="ClaudeChatBubbleRole">Claude</span>
						<span className="ClaudeChatThinking">
							<SpinnerGapIcon size={14} className="ClaudeChatSpinner" />
							Thinking…
						</span>
					</div>
				)}

				<div ref={messagesEndRef} />
			</div>

			<div className="ClaudeChatInputArea">
				<textarea
					ref={textareaRef}
					className="ClaudeChatTextarea"
					placeholder="Ask about this document… (Enter to send, Shift+Enter for newline)"
					value={inputText.state}
					onChange={handleTextareaChange}
					onKeyDown={handleKeyDown}
					rows={3}
					disabled={isSending.state}
				/>
				<button
					className="ClaudeChatSendButton"
					onClick={handleSend}
					disabled={isSending.state || inputText.state.trim().length === 0}
					title="Send"
				>
					<PaperPlaneTiltIcon size={16} weight="bold" />
				</button>
			</div>
		</div>
	)
}
