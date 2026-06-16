'use client'

import type { CSSProperties } from 'react'
import { datass } from 'datass'

// Preview settings let the reader tune how a document renders in the
// preview pane and in exported HTML. Every option maps onto a few base
// design tokens, so the whole type scale and theme cascade from them.

export type PreviewThemeT = 'dark' | 'light'
export type PreviewFontT = 'sans' | 'serif' | 'mono'
export type PreviewScaleT = 'compact' | 'default' | 'spacious'

export type PreviewSettingsT = {
	theme: PreviewThemeT
	font: PreviewFontT
	scale: PreviewScaleT
	baseFontSize: number
}

export type PreviewOptionT<ValueT> = {
	value: ValueT
	label: string
}

export const previewThemeOptions: PreviewOptionT<PreviewThemeT>[] = [
	{ value: 'dark', label: 'Dark' },
	{ value: 'light', label: 'Light' }
]

export const previewFontOptions: PreviewOptionT<PreviewFontT>[] = [
	{ value: 'sans', label: 'Sans' },
	{ value: 'serif', label: 'Serif' },
	{ value: 'mono', label: 'Mono' }
]

export const previewScaleOptions: PreviewOptionT<PreviewScaleT>[] = [
	{ value: 'compact', label: 'Compact' },
	{ value: 'default', label: 'Default' },
	{ value: 'spacious', label: 'Spacious' }
]

export const minBaseFontSize = 14
export const maxBaseFontSize = 24
export const baseFontSizeStep = 1

export const defaultPreviewSettings: PreviewSettingsT = {
	theme: 'dark',
	font: 'sans',
	scale: 'default',
	baseFontSize: 18
}

const storageKey = 'zokku.previewSettings'

const clampBaseFontSize = (size: number): number => {
	const tooSmall = size < minBaseFontSize
	if (tooSmall) return minBaseFontSize
	const tooLarge = size > maxBaseFontSize
	if (tooLarge) return maxBaseFontSize
	return size
}

const isPreviewTheme = (value: unknown): value is PreviewThemeT => {
	return value === 'dark' || value === 'light'
}

const isPreviewFont = (value: unknown): value is PreviewFontT => {
	return value === 'sans' || value === 'serif' || value === 'mono'
}

const isPreviewScale = (value: unknown): value is PreviewScaleT => {
	return value === 'compact' || value === 'default' || value === 'spacious'
}

// Read stored settings, falling back to defaults for any missing or
// malformed field so a partial/old payload never breaks the preview.
const normalizeStoredSettings = (raw: unknown): PreviewSettingsT => {
	const isObject = typeof raw === 'object' && raw !== null
	if (!isObject) return defaultPreviewSettings

	const stored = raw as Record<string, unknown>
	const storedTheme = stored.theme
	const storedFont = stored.font
	const storedScale = stored.scale
	const storedSize = stored.baseFontSize

	const theme = isPreviewTheme(storedTheme) ? storedTheme : defaultPreviewSettings.theme
	const font = isPreviewFont(storedFont) ? storedFont : defaultPreviewSettings.font
	const scale = isPreviewScale(storedScale) ? storedScale : defaultPreviewSettings.scale
	const isSizeValid = typeof storedSize === 'number' && Number.isFinite(storedSize)
	const baseFontSize = isSizeValid ? clampBaseFontSize(storedSize) : defaultPreviewSettings.baseFontSize

	return { theme, font, scale, baseFontSize }
}

export const loadPreviewSettings = (): PreviewSettingsT => {
	const isServer = typeof window === 'undefined'
	if (isServer) return defaultPreviewSettings

	const rawValue = window.localStorage.getItem(storageKey)
	const isMissing = rawValue === null
	if (isMissing) return defaultPreviewSettings

	const parsed = JSON.parse(rawValue) as unknown
	return normalizeStoredSettings(parsed)
}

export const savePreviewSettings = (settings: PreviewSettingsT): void => {
	const isServer = typeof window === 'undefined'
	if (isServer) return

	const serialized = JSON.stringify(settings)
	window.localStorage.setItem(storageKey, serialized)
}

// Shared store for all preview rendering preferences. Initialized with
// defaults; hydrate from localStorage after mount via loadPreviewSettings().
export const $previewSettings = datass.object<PreviewSettingsT>(defaultPreviewSettings)

// Ratios for font-size steps 0–3 are fixed across all scales.
// Steps 4–8 (headings) vary by scale.
const FIXED_STEP_RATIOS = [0.579, 0.694, 0.833, 1] as const

// Per-scale ratios for steps 4–8 (h4 down to display).
// Mirrors the values in PreviewSettings.css but applied directly as inline
// styles so they update immediately — CSS custom property cascading from
// :root through inline overrides is unreliable across browsers.
const SCALE_STEP_RATIOS: Record<PreviewScaleT, readonly number[]> = {
	compact: [1.2, 1.44, 1.728, 2.074, 2.488],
	default: [1.25, 1.563, 1.953, 2.441, 3.052],
	spacious: [1.333, 1.777, 2.369, 3.157, 4.209],
}

// Sets --font-size-0 through --font-size-8 and --base-font-size directly on
// the preview container so every Prose element responds to both base size and
// scale changes without depending on :root custom-property cascade resolution.
export const getPreviewSurfaceStyle = (settings: PreviewSettingsT): CSSProperties => {
	const base = settings.baseFontSize
	const scaleRatios = SCALE_STEP_RATIOS[settings.scale]

	const vars: Record<string, string> = { '--base-font-size': `${base}px` }

	for (const [index, ratio] of FIXED_STEP_RATIOS.entries()) {
		vars[`--font-size-${index}`] = `${(base * ratio).toFixed(3)}px`
	}

	for (const [index, ratio] of scaleRatios.entries()) {
		vars[`--font-size-${index + 4}`] = `${(base * ratio).toFixed(3)}px`
	}

	return vars as CSSProperties
}
