'use client'

import type { CSSProperties } from 'react'
import { datass } from 'datass'

export type PreviewThemeT = 'dark' | 'light'
export type PreviewFontT = 'sans'
export type PreviewScaleT = 'compact'

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

export const minBaseFontSize = 14
export const maxBaseFontSize = 24
export const baseFontSizeStep = 1

export const defaultPreviewSettings: PreviewSettingsT = {
	theme: 'dark',
	font: 'sans',
	scale: 'compact',
	baseFontSize: 20
}

const storageKey = 'zokku.previewSettings'

const clampBaseFontSize = (size: number): number => {
	if (size < minBaseFontSize) return minBaseFontSize
	if (size > maxBaseFontSize) return maxBaseFontSize
	return size
}

const isPreviewTheme = (value: unknown): value is PreviewThemeT => value === 'dark' || value === 'light'

// Font and type scale are product decisions now, not reader preferences. Old
// stored serif/mono/default/spacious values are intentionally normalized away.
const normalizeStoredSettings = (raw: unknown): PreviewSettingsT => {
	if (typeof raw !== 'object' || raw === null) return defaultPreviewSettings
	const stored = raw as Record<string, unknown>
	const theme = isPreviewTheme(stored.theme) ? stored.theme : defaultPreviewSettings.theme
	const rawBaseFontSize = stored.baseFontSize
	const baseFontSize = typeof rawBaseFontSize === 'number' && Number.isFinite(rawBaseFontSize)
		? clampBaseFontSize(rawBaseFontSize)
		: defaultPreviewSettings.baseFontSize
	return { theme, font: 'sans', scale: 'compact', baseFontSize }
}

export const loadPreviewSettings = (): PreviewSettingsT => {
	if (typeof window === 'undefined') return defaultPreviewSettings
	const rawValue = window.localStorage.getItem(storageKey)
	if (rawValue === null) return defaultPreviewSettings
	try {
		return normalizeStoredSettings(JSON.parse(rawValue) as unknown)
	} catch {
		return defaultPreviewSettings
	}
}

export const savePreviewSettings = (settings: PreviewSettingsT): void => {
	if (typeof window === 'undefined') return
	const normalized: PreviewSettingsT = { ...settings, font: 'sans', scale: 'compact' }
	window.localStorage.setItem(storageKey, JSON.stringify(normalized))
}

export const $previewSettings = datass.object<PreviewSettingsT>(defaultPreviewSettings)

const FIXED_STEP_RATIOS = [0.579, 0.694, 0.833, 1] as const
const COMPACT_STEP_RATIOS = [1.2, 1.44, 1.728, 2.074, 2.488] as const

export const getPreviewSurfaceStyle = (settings: PreviewSettingsT): CSSProperties => {
	const base = settings.baseFontSize
	const vars: Record<string, string> = { '--base-font-size': `${base}px` }

	for (const [index, ratio] of FIXED_STEP_RATIOS.entries()) vars[`--font-size-${index}`] = `${(base * ratio).toFixed(3)}px`
	for (const [index, ratio] of COMPACT_STEP_RATIOS.entries()) vars[`--font-size-${index + 4}`] = `${(base * ratio).toFixed(3)}px`

	return vars as CSSProperties
}
