import { $transitions } from '@/lib/transitions.store'

/*
	Fades the app shell out and navigates once it is fully faded. The shell
	element sits above the router outlet, so it survives the route change;
	FadingPage watches the location and fades the new route back in. Nothing
	writes to the element directly, because an imperative attribute on a node
	React owns is exactly how a fade gets stuck.

	Durations come from the store defaults, which FadingPage also hands to the
	stylesheet, so the timing lives in one place.
*/
export const beginAppTransition = (navigate: () => void): void => {
	$transitions.fadeOut({ onFadedOut: navigate })
}
