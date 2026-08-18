'use client'

export const APP_TRANSITION_KEY = 'zokku-app-transition'

export const beginAppTransition = (navigate: () => void, rootSelector = '.documentsPage'): void => {
	const root = document.querySelector<HTMLElement>(rootSelector)
	sessionStorage.setItem(APP_TRANSITION_KEY, '1')
	if (root === null) {
		navigate()
		return
	}
	root.dataset.transition = 'out'
	window.setTimeout(navigate, 300)
}

export const shouldFadeIntoRoute = (): boolean => {
	return typeof window !== 'undefined' && sessionStorage.getItem(APP_TRANSITION_KEY) === '1'
}

export const completeAppTransition = (): void => {
	if (typeof window === 'undefined') return
	sessionStorage.removeItem(APP_TRANSITION_KEY)
}
