import './TrashLink.css'

import { Trash } from '@phosphor-icons/react'
import { JSX } from 'react'
import { useLocation } from 'wouter'
import { beginAppTransition } from '@/lib/appTransition'

type TrashLinkPropsT = {
	// Positioning only. Appearance stays with the component so every entry
	// point into Trash looks and animates the same way.
	className?: string
	count?: number
}

export const TrashLink = (props: TrashLinkPropsT): JSX.Element => {
	const [, navigate] = useLocation()
	const className = props.className === undefined ? 'trashLink' : `trashLink ${props.className}`

	return (
		<z-button
			className={className}
			size="sm"
			kind="plain"
			onClick={() => beginAppTransition(() => navigate('/trash'))}
		>
			<Trash weight="bold" />
			<span>Trash</span>
			{props.count !== undefined && props.count > 0 && <z-badge size="sm" accent="neutral">{props.count}</z-badge>}
		</z-button>
	)
}
