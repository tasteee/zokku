import { datass } from 'datass'

// 'waiting' is the beat between the two fades, held for however long the
// caller needs (navigation, data loading). The page stays faded out for it.
export type TransitionStatusT = 'idle' | 'fading-out' | 'waiting' | 'fading-in'

export type TransitionOptionsT = {
	fadeOutDuration?: number
	waitDuration?: number
	fadeInDuration?: number
	onFadedOut?: () => void
}

type StepT = {
	status: TransitionStatusT
	duration: number
	onEnter?: () => void
}

export const DEFAULT_FADE_OUT_DURATION = 100
const DEFAULT_WAIT_DURATION = 0
export const DEFAULT_FADE_IN_DURATION = 1000

const status = datass.string<TransitionStatusT>('idle')

let pendingTimeoutId = 0

const clearPendingStep = (): void => {
	if (pendingTimeoutId !== 0) window.clearTimeout(pendingTimeoutId)
	pendingTimeoutId = 0
}

// Walks a status chain, holding each status for its duration. Starting a new
// chain cancels whatever the previous one still had scheduled.
const runSteps = (steps: StepT[]): void => {
	clearPendingStep()

	const runStep = (index: number): void => {
		const step = steps[index]
		status.set(step.status)
		if (step.onEnter !== undefined) step.onEnter()

		const isLastStep = index === steps.length - 1
		if (isLastStep) return clearPendingStep()
		pendingTimeoutId = window.setTimeout(() => runStep(index + 1), step.duration)
	}

	runStep(0)
}

// Fade out, run onFadedOut while the page is dark, wait, fade back in.
const start = (options: TransitionOptionsT = {}): void => {
	runSteps([
		{ status: 'fading-out', duration: options.fadeOutDuration ?? DEFAULT_FADE_OUT_DURATION },
		{ status: 'waiting', duration: options.waitDuration ?? DEFAULT_WAIT_DURATION, onEnter: options.onFadedOut },
		{ status: 'fading-in', duration: options.fadeInDuration ?? DEFAULT_FADE_IN_DURATION },
		{ status: 'idle', duration: 0 }
	])
}

// Fade out and stay there, for when something else decides when to fade in.
const fadeOut = (options: Pick<TransitionOptionsT, 'fadeOutDuration' | 'onFadedOut'> = {}): void => {
	runSteps([
		{ status: 'fading-out', duration: options.fadeOutDuration ?? DEFAULT_FADE_OUT_DURATION },
		{ status: 'waiting', duration: 0, onEnter: options.onFadedOut }
	])
}

const fadeIn = (options: Pick<TransitionOptionsT, 'fadeInDuration'> = {}): void => {
	runSteps([
		{ status: 'fading-in', duration: options.fadeInDuration ?? DEFAULT_FADE_IN_DURATION },
		{ status: 'idle', duration: 0 }
	])
}

const reset = (): void => {
	clearPendingStep()
	status.set('idle')
}

export const $transitions = {
	status,
	start,
	fadeOut,
	fadeIn,
	reset
}
