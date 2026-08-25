import { CSSProperties, JSX, ReactNode, useEffect, useRef } from 'react'
import { useLocation, useSearch } from 'wouter'
import { $transitions, DEFAULT_FADE_IN_DURATION, DEFAULT_FADE_OUT_DURATION } from '@/lib/transitions.store'
import type { TransitionStatusT } from '@/lib/transitions.store'

type FadingPagePropsT = {
	children: ReactNode
}

// 'waiting' holds whatever the fade out left on screen, so it stays faded out.
const transitionByStatus: Record<TransitionStatusT, string> = {
	'idle': 'idle',
	'fading-out': 'out',
	'waiting': 'out',
	'fading-in': 'in'
}

/*
	The stylesheet animates for exactly as long as the store holds each status.
	Handing the store's durations to CSS as custom properties keeps the two from
	drifting: a status that ends early snaps the page back mid-animation, and
	one that ends late leaves it sitting on the last frame.
*/
const durationStyle = {
	'--fade-out-duration': `${DEFAULT_FADE_OUT_DURATION}ms`,
	'--fade-in-duration': `${DEFAULT_FADE_IN_DURATION}ms`
} as CSSProperties

export const FadingPage = (props: FadingPagePropsT): JSX.Element => {
	const status = $transitions.status.use() as TransitionStatusT
	const [pathname] = useLocation()
	const search = useSearch()

	// Documents are addressed by `?id=`, so the search counts as part of the
	// location here: following a link from one document to another keeps the
	// same pathname, and a pathname-only check would leave that fade stuck.
	const location = `${pathname}?${search}`
	const previousLocation = useRef(location)

	// This wrapper sits above the router outlet, so a changed location is the
	// signal that the navigation the fade out was waiting on has landed.
	useEffect(() => {
		if (location === previousLocation.current) return
		previousLocation.current = location
		if ($transitions.status.state !== 'waiting') return
		$transitions.fadeIn()
	}, [location])

	return <div className="fadingPage" data-transition={transitionByStatus[status]} style={durationStyle}>{props.children}</div>
}
