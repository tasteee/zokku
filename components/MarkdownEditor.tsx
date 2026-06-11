'use client'

import './MarkdownEditor.css'
import { useRef, JSX } from 'react'
import { Editor } from '@monaco-editor/react'
import type { OnMount, OnChange, BeforeMount, Monaco } from '@monaco-editor/react'
import type { editor as MonacoEditorNS } from 'monaco-editor'
import {
	TextBolderIcon,
	TextItalicIcon,
	TextUnderlineIcon,
	TextStrikethroughIcon,
	CodeIcon,
	LinkSimpleIcon,
	ImageIcon,
	TextHOneIcon,
	QuotesIcon,
	ListBulletsIcon,
	ListNumbersIcon,
	CodeBlockIcon
} from '@phosphor-icons/react'

type MarkdownEditorPropsT = {
	value: string
	onChange: (nextValue: string) => void
}

type ToolbarButtonT = {
	kind: 'button'
	id: string
	title: string
	icon: JSX.Element
	onClick: () => void
}

type ToolbarDividerT = {
	kind: 'divider'
	id: string
}

type ToolbarItemT = ToolbarButtonT | ToolbarDividerT

const ZEST_THEME_NAME = 'zest-markdown'

const editorOptions: MonacoEditorNS.IStandaloneEditorConstructionOptions = {
	fontFamily: 'var(--font-mono), DM Mono, monospace',
	fontSize: 14,
	lineHeight: 24,
	wordWrap: 'on',
	lineNumbers: 'off',
	minimap: { enabled: false },
	folding: false,
	glyphMargin: false,
	renderLineHighlight: 'all',
	scrollBeyondLastLine: false,
	automaticLayout: true,
	padding: { top: 20, bottom: 20 },
	lineDecorationsWidth: 12,
	lineNumbersMinChars: 0,
	overviewRulerLanes: 0,
	overviewRulerBorder: false,
	scrollbar: { vertical: 'auto', horizontal: 'hidden', verticalScrollbarSize: 10 },
	smoothScrolling: true,
	cursorBlinking: 'smooth',
	cursorSmoothCaretAnimation: 'on',
	roundedSelection: false,
	occurrencesHighlight: 'off',
	selectionHighlight: false,
	matchBrackets: 'never',
	guides: { indentation: false },
	contextmenu: true,
	tabSize: 2
}

const defineZestTheme = (monaco: Monaco): void => {
	monaco.editor.defineTheme(ZEST_THEME_NAME, {
		base: 'vs-dark',
		inherit: true,
		rules: [
			{ token: '', foreground: 'a0a0a0' },
			{ token: 'keyword', foreground: 'c8b0e0', fontStyle: 'bold' },
			{ token: 'keyword.md', foreground: 'c8b0e0', fontStyle: 'bold' },
			{ token: 'strong', foreground: 'fafafa', fontStyle: 'bold' },
			{ token: 'emphasis', foreground: 'fafafa', fontStyle: 'italic' },
			{ token: 'string.link', foreground: 'f472b6' },
			{ token: 'string.link.md', foreground: 'f472b6' },
			{ token: 'variable', foreground: 'b0edb8' },
			{ token: 'variable.md', foreground: 'b0edb8' },
			{ token: 'variable.source', foreground: 'b0edb8' },
			{ token: 'tag', foreground: 'a898c8' },
			{ token: 'comment', foreground: '707070', fontStyle: 'italic' },
			{ token: 'string', foreground: 'a0a0a0' }
		],
		colors: {
			'editor.background': '#0a0f0a',
			'editor.foreground': '#a0a0a0',
			'editorCursor.foreground': '#b794f6',
			'editorLineNumber.foreground': '#3a3c3b',
			'editorLineNumber.activeForeground': '#a0a0a0',
			'editor.lineHighlightBackground': '#14181466',
			'editor.lineHighlightBorder': '#00000000',
			'editor.selectionBackground': '#6b46c155',
			'editor.selectionHighlightBackground': '#f472b626',
			'editor.wordHighlightBackground': '#00000000',
			'editorWidget.background': '#141814',
			'editorWidget.border': '#2a2f2a',
			'editorWidget.foreground': '#fafafa',
			'editorSuggestWidget.background': '#141814',
			'editorSuggestWidget.border': '#2a2f2a',
			'editorSuggestWidget.selectedBackground': '#6b46c155',
			'input.background': '#0a0f0a',
			'input.border': '#2a2f2a',
			focusBorder: '#00000000',
			'scrollbarSlider.background': '#2a2f2a80',
			'scrollbarSlider.hoverBackground': '#2a2f2acc',
			'scrollbarSlider.activeBackground': '#3a3c3bcc'
		}
	})
}

export const MarkdownEditor = (props: MarkdownEditorPropsT): JSX.Element => {
	const editorRef = useRef<MonacoEditorNS.IStandaloneCodeEditor | null>(null)
	const monacoRef = useRef<Monaco | null>(null)

	const focusEditor = (): void => {
		const editor = editorRef.current
		if (editor === null) return
		editor.focus()
	}

	const wrapSelection = (before: string, after: string, placeholder: string): void => {
		const editor = editorRef.current
		const monaco = monacoRef.current
		if (editor === null) return
		if (monaco === null) return

		const selection = editor.getSelection()
		const model = editor.getModel()
		if (selection === null) return
		if (model === null) return

		const selectedText = model.getValueInRange(selection)
		const isEmpty = selectedText.length === 0
		const innerText = isEmpty ? placeholder : selectedText
		const replacementText = `${before}${innerText}${after}`

		editor.executeEdits('markdown-toolbar', [{ range: selection, text: replacementText, forceMoveMarkers: true }])

		const startLine = selection.startLineNumber
		const innerStartColumn = selection.startColumn + before.length
		const innerEndColumn = innerStartColumn + innerText.length
		const nextSelection = new monaco.Selection(startLine, innerStartColumn, startLine, innerEndColumn)
		editor.setSelection(nextSelection)
		focusEditor()
	}

	const insertLinkLike = (linkPrefix: string, textPlaceholder: string, urlPlaceholder: string): void => {
		const editor = editorRef.current
		const monaco = monacoRef.current
		if (editor === null) return
		if (monaco === null) return

		const selection = editor.getSelection()
		const model = editor.getModel()
		if (selection === null) return
		if (model === null) return

		const selectedText = model.getValueInRange(selection)
		const isEmpty = selectedText.length === 0
		const labelText = isEmpty ? textPlaceholder : selectedText
		const replacementText = `${linkPrefix}[${labelText}](${urlPlaceholder})`

		editor.executeEdits('markdown-toolbar', [{ range: selection, text: replacementText, forceMoveMarkers: true }])

		const startLine = selection.startLineNumber
		const urlStartColumn = selection.startColumn + linkPrefix.length + 1 + labelText.length + 2
		const urlEndColumn = urlStartColumn + urlPlaceholder.length
		const nextSelection = new monaco.Selection(startLine, urlStartColumn, startLine, urlEndColumn)
		editor.setSelection(nextSelection)
		focusEditor()
	}

	const applyLinePrefix = (prefix: string): void => {
		const editor = editorRef.current
		const monaco = monacoRef.current
		if (editor === null) return
		if (monaco === null) return

		const selection = editor.getSelection()
		const model = editor.getModel()
		if (selection === null) return
		if (model === null) return

		const startLine = selection.startLineNumber
		const endLine = selection.endLineNumber

		const lineCount = endLine - startLine + 1
		const lineNumbers = Array.from({ length: lineCount }, (_unused: unknown, offset: number): number => {
			return startLine + offset
		})

		const edits = lineNumbers.map((lineNumber: number): MonacoEditorNS.IIdentifiedSingleEditOperation => {
			const lineStartRange = new monaco.Range(lineNumber, 1, lineNumber, 1)
			return { range: lineStartRange, text: prefix, forceMoveMarkers: true }
		})

		editor.executeEdits('markdown-toolbar', edits)
		focusEditor()
	}

	const insertCodeBlock = (): void => {
		const editor = editorRef.current
		const monaco = monacoRef.current
		if (editor === null) return
		if (monaco === null) return

		const selection = editor.getSelection()
		const model = editor.getModel()
		if (selection === null) return
		if (model === null) return

		const selectedText = model.getValueInRange(selection)
		const isEmpty = selectedText.length === 0
		const innerText = isEmpty ? 'code' : selectedText
		const replacementText = `\`\`\`\n${innerText}\n\`\`\``

		editor.executeEdits('markdown-toolbar', [{ range: selection, text: replacementText, forceMoveMarkers: true }])
		focusEditor()
	}

	const handleBold = (): void => {
		wrapSelection('**', '**', 'bold text')
	}

	const handleItalic = (): void => {
		wrapSelection('*', '*', 'italic text')
	}

	const handleUnderline = (): void => {
		wrapSelection('<span class="isUnderlined">', '</span>', 'underlined text')
	}

	const handleStrikethrough = (): void => {
		wrapSelection('~~', '~~', 'struck text')
	}

	const handleInlineCode = (): void => {
		wrapSelection('`', '`', 'code')
	}

	const handleLink = (): void => {
		insertLinkLike('', 'link text', 'https://')
	}

	const handleImage = (): void => {
		insertLinkLike('!', 'alt text', 'https://')
	}

	const handleHeading = (): void => {
		applyLinePrefix('# ')
	}

	const handleQuote = (): void => {
		applyLinePrefix('> ')
	}

	const handleBulletList = (): void => {
		applyLinePrefix('- ')
	}

	const handleNumberedList = (): void => {
		applyLinePrefix('1. ')
	}

	const handleCodeBlock = (): void => {
		insertCodeBlock()
	}

	const handleBeforeMount: BeforeMount = (monaco): void => {
		defineZestTheme(monaco)
	}

	const handleEditorMount: OnMount = (editor, monaco): void => {
		editorRef.current = editor
		monacoRef.current = monaco

		const ctrl = monaco.KeyMod.CtrlCmd
		const shift = monaco.KeyMod.Shift

		editor.addAction({
			id: 'zest.bold',
			label: 'Bold',
			keybindings: [ctrl | monaco.KeyCode.KeyB],
			run: handleBold
		})
		editor.addAction({
			id: 'zest.italic',
			label: 'Italic',
			keybindings: [ctrl | monaco.KeyCode.KeyI],
			run: handleItalic
		})
		editor.addAction({
			id: 'zest.underline',
			label: 'Underline',
			keybindings: [ctrl | monaco.KeyCode.KeyU],
			run: handleUnderline
		})
		editor.addAction({
			id: 'zest.strikethrough',
			label: 'Strikethrough',
			keybindings: [ctrl | shift | monaco.KeyCode.KeyX],
			run: handleStrikethrough
		})
		editor.addAction({
			id: 'zest.inlineCode',
			label: 'Inline code',
			keybindings: [ctrl | monaco.KeyCode.KeyE],
			run: handleInlineCode
		})
		editor.addAction({
			id: 'zest.link',
			label: 'Insert link',
			keybindings: [ctrl | monaco.KeyCode.KeyK],
			run: handleLink
		})
	}

	const handleEditorChange: OnChange = (nextValue): void => {
		const safeValue = nextValue ?? ''
		props.onChange(safeValue)
	}

	const iconSize = 16
	const iconWeight = 'bold' as const

	const toolbarItems: ToolbarItemT[] = [
		{
			kind: 'button',
			id: 'bold',
			title: 'Bold  (Ctrl+B)',
			icon: <TextBolderIcon size={iconSize} weight={iconWeight} />,
			onClick: handleBold
		},
		{
			kind: 'button',
			id: 'italic',
			title: 'Italic  (Ctrl+I)',
			icon: <TextItalicIcon size={iconSize} weight={iconWeight} />,
			onClick: handleItalic
		},
		{
			kind: 'button',
			id: 'underline',
			title: 'Underline  (Ctrl+U)',
			icon: <TextUnderlineIcon size={iconSize} weight={iconWeight} />,
			onClick: handleUnderline
		},
		{
			kind: 'button',
			id: 'strikethrough',
			title: 'Strikethrough  (Ctrl+Shift+X)',
			icon: <TextStrikethroughIcon size={iconSize} weight={iconWeight} />,
			onClick: handleStrikethrough
		},
		{
			kind: 'button',
			id: 'inlineCode',
			title: 'Inline code  (Ctrl+E)',
			icon: <CodeIcon size={iconSize} weight={iconWeight} />,
			onClick: handleInlineCode
		},
		{ kind: 'divider', id: 'divider-1' },
		{
			kind: 'button',
			id: 'link',
			title: 'Link  (Ctrl+K)',
			icon: <LinkSimpleIcon size={iconSize} weight={iconWeight} />,
			onClick: handleLink
		},
		{
			kind: 'button',
			id: 'image',
			title: 'Image',
			icon: <ImageIcon size={iconSize} weight={iconWeight} />,
			onClick: handleImage
		},
		{ kind: 'divider', id: 'divider-2' },
		{
			kind: 'button',
			id: 'heading',
			title: 'Heading',
			icon: <TextHOneIcon size={iconSize} weight={iconWeight} />,
			onClick: handleHeading
		},
		{
			kind: 'button',
			id: 'quote',
			title: 'Blockquote',
			icon: <QuotesIcon size={iconSize} weight={iconWeight} />,
			onClick: handleQuote
		},
		{
			kind: 'button',
			id: 'bulletList',
			title: 'Bullet list',
			icon: <ListBulletsIcon size={iconSize} weight={iconWeight} />,
			onClick: handleBulletList
		},
		{
			kind: 'button',
			id: 'numberedList',
			title: 'Numbered list',
			icon: <ListNumbersIcon size={iconSize} weight={iconWeight} />,
			onClick: handleNumberedList
		},
		{
			kind: 'button',
			id: 'codeBlock',
			title: 'Code block',
			icon: <CodeBlockIcon size={iconSize} weight={iconWeight} />,
			onClick: handleCodeBlock
		}
	]

	return (
		<div className="MarkdownEditor">
			<div className="MarkdownToolbar">
				{toolbarItems.map((item: ToolbarItemT): JSX.Element => {
					const isDivider = item.kind === 'divider'
					if (isDivider) return <span key={item.id} className="MarkdownToolbarDivider" aria-hidden="true" />

					return (
						<button
							key={item.id}
							type="button"
							className="MarkdownToolbarButton"
							title={item.title}
							aria-label={item.title}
							onClick={item.onClick}
						>
							{item.icon}
						</button>
					)
				})}
			</div>

			<div className="MarkdownEditorSurface">
				<Editor
					height="100%"
					defaultLanguage="markdown"
					theme={ZEST_THEME_NAME}
					value={props.value}
					onChange={handleEditorChange}
					beforeMount={handleBeforeMount}
					onMount={handleEditorMount}
					options={editorOptions}
				/>
			</div>
		</div>
	)
}
