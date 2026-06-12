import { JSX } from 'react'

type HighlightedMatchPropsT = {
	text: string
	query: string
}

export const HighlightedMatch = (props: HighlightedMatchPropsT): JSX.Element => {
	const normalizedQuery = props.query.trim().toLocaleLowerCase()
	const matchIndex = props.text.toLocaleLowerCase().indexOf(normalizedQuery)

	if (!normalizedQuery || matchIndex < 0) return <>{props.text}</>

	const before = props.text.slice(0, matchIndex)
	const match = props.text.slice(matchIndex, matchIndex + normalizedQuery.length)
	const after = props.text.slice(matchIndex + normalizedQuery.length)

	return (
		<>
			{before}
			<mark>{match}</mark>
			{after}
		</>
	)
}
