'use client'

import './SearchPalette.css'
import { JSX, useEffect, useRef } from 'react'
import { FileTextIcon, MagnifyingGlassIcon } from '@phosphor-icons/react'
import { $folders, $search, FolderT, SearchResultT } from '../../stores'
import { formatRelativeTime } from '../../helpers'
import { HighlightedMatch } from '../HighlightedMatch/HighlightedMatch'

type SearchPalettePropsT = {
	onNavigate: (documentId: string) => void
}

const SearchStatus = (props: { searchTerm: string }): JSX.Element | null => {
	const results = $search.use.lookup('results') as SearchResultT[]
	const isLoading = $search.use.lookup('isLoading') as boolean
	if (!props.searchTerm) return null
	return <div className="searchPaletteStatus">{results.length > 0 && <span>{results.length} matches</span>}{results.length === 0 && isLoading && <span>Searching...</span>}</div>
}

export const SearchPalette = (props: SearchPalettePropsT): JSX.Element => {
	const inputRef = useRef<HTMLElement | null>(null)
	const searchInput = $search.use.lookup('input') as string
	const results = $search.use.lookup('results') as SearchResultT[]
	const folders = $folders.use.lookup('list') as FolderT[]
	const hasInput = searchInput.trim().length > 0

	useEffect(() => {
		const timeoutId = window.setTimeout(() => inputRef.current?.focus(), 0)
		return () => window.clearTimeout(timeoutId)
	}, [])

	const handleClose = (): void => {
		$search.set.lookup('isOpen', false)
		$search.set.lookup('input', '')
		$search.set.lookup('results', [])
		$search.set.lookup('isLoading', false)
	}

	return (
		<z-dialog is-open size="lg" onClose={handleClose}>
			<div className="searchPaletteInputRow">
				<MagnifyingGlassIcon weight="bold" />
				<z-input
					ref={inputRef}
					value={searchInput}
					onInput={(event: CustomEvent<{ value: string }>) => $search.set.lookup('input', event.detail.value)}
					placeholder="Search every Markdown file..."
					label="Search documents"
				/>
			</div>
			<SearchStatus searchTerm={searchInput.trim()} />
			{hasInput && (
				<div className="searchPaletteResults">
					{results.map((result) => {
						const folder = folders.find((item) => item._id === result.folderId)
						return (
							<button key={result._id} className="searchPaletteResult" type="button" onClick={() => props.onNavigate(result._id)}>
								<span className="searchPaletteResultIcon"><FileTextIcon weight="bold" /></span>
								<span className="searchPaletteResultBody">
									<span className="searchPaletteResultMeta">{result.matchType} match · {folder?.name ?? 'Workspace root'} · Edited {formatRelativeTime(result.updatedAt)}</span>
									<span className="searchPaletteResultTitle"><HighlightedMatch text={result.title} query={searchInput.trim()} /></span>
									<span className="searchPaletteResultSnippet"><HighlightedMatch text={result.snippet} query={searchInput.trim()} /></span>
								</span>
							</button>
						)
					})}
					{results.length === 0 && !$search.state.isLoading && <z-empty-state heading="No matches" description="Try another phrase or a smaller fragment of text." />}
				</div>
			)}
		</z-dialog>
	)
}
