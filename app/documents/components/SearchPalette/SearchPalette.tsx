'use client'

import './SearchPalette.css'
import { JSX, useEffect, useRef } from 'react'
import { FileText, MagnifyingGlass, X } from '@phosphor-icons/react'
import { Id } from '@/convex/_generated/dataModel'
import { $folders, $search, FolderT, SearchResultT } from '../../stores'
import { formatRelativeTime } from '../../helpers.ts'
import { HighlightedMatch } from '../HighlightedMatch/HighlightedMatch'

type SearchPalettePropsT = {
	onNavigate: (documentId: Id<'documents'>) => void
}

const SearchStatus = (props: { searchTerm: string }): JSX.Element | null => {
	const results = $search.use.lookup('results') as SearchResultT[]
	const isLoading = $search.use.lookup('isLoading') as boolean
	const hasResults = results.length > 0

	if (!props.searchTerm) return null

	return (
		<div className="searchPaletteStatus">
			{hasResults && <span>{results.length} matches</span>}
			{!hasResults && isLoading && <span>Searching...</span>}
		</div>
	)
}

export const SearchPalette = (props: SearchPalettePropsT): JSX.Element => {
	const inputRef = useRef<HTMLInputElement | null>(null)
	const searchInput = $search.use.lookup('input') as string
	const results = $search.use.lookup('results') as SearchResultT[]
	const folders = $folders.use.lookup('list') as FolderT[]

	const hasResults = results.length > 0
	const hasInput = searchInput.trim().length > 0
	const isResultsEmpty = hasInput && !hasResults

	useEffect(() => {
		const timeoutId = window.setTimeout(() => {
			inputRef.current?.focus()
		}, 0)
		return () => window.clearTimeout(timeoutId)
	}, [])

	const handleClose = (): void => {
		$search.set.lookup('isOpen', false)
		$search.set.lookup('input', '')
		$search.set.lookup('results', [])
		$search.set.lookup('isLoading', false)
	}

	const handleResultClick = (documentId: Id<'documents'>): void => {
		props.onNavigate(documentId)
	}

	return (
		<div className="searchPaletteBackdrop" role="presentation" onMouseDown={handleClose}>
			<section
				className="searchPalette"
				role="dialog"
				aria-modal="true"
				aria-label="Search documents"
				onMouseDown={(event) => event.stopPropagation()}
			>
				<div className="searchPaletteInputRow">
					<MagnifyingGlass weight="bold" />
					<input
						ref={inputRef}
						value={searchInput}
						onChange={(event) => $search.set.lookup('input', event.target.value)}
						placeholder="Search every document..."
						aria-label="Search documents"
					/>
					<button className="searchPaletteClose" type="button" onClick={handleClose} title="Close search">
						<X weight="bold" />
					</button>
				</div>

				<SearchStatus searchTerm={searchInput.trim()} />

				{hasInput && (
					<div className="searchPaletteResults">
						{hasResults && results.map((result) => {
							const folder = folders.find((item) => item._id === result.folderId)
							const folderLabel = folder?.name ?? 'Uncategorized'
							const relativeTime = formatRelativeTime(result.updatedAt)

							return (
								<button
									key={result._id}
									className="searchPaletteResult"
									type="button"
									onClick={() => handleResultClick(result._id)}
								>
									<span className="searchPaletteResultIcon">
										<FileText weight="bold" />
									</span>
									<span className="searchPaletteResultBody">
										<span className="searchPaletteResultMeta">
											{result.matchType} match · {folderLabel} · Edited {relativeTime}
										</span>
										<span className="searchPaletteResultTitle">
											<HighlightedMatch text={result.title} query={searchInput.trim()} />
										</span>
										<span className="searchPaletteResultSnippet">
											<HighlightedMatch text={result.snippet} query={searchInput.trim()} />
										</span>
									</span>
								</button>
							)
						})}

						{isResultsEmpty && (
							<div className="searchPaletteEmpty">
								<div className="searchPaletteEmptyGlyph">
									<MagnifyingGlass weight="bold" />
								</div>
								<h2>No matches</h2>
								<p>Try another phrase or a smaller fragment of text.</p>
							</div>
						)}
					</div>
				)}
			</section>
		</div>
	)
}
