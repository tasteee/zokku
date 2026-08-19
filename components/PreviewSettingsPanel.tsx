'use client'

import './PreviewSettings.css'
import { JSX } from 'react'
import { SlidersHorizontalIcon } from '@phosphor-icons/react'
import { minBaseFontSize, maxBaseFontSize, baseFontSizeStep } from '@/components/previewSettings'
import type { PreviewSettingsT, PreviewThemeT } from '@/components/previewSettings'

type PreviewSettingsPropsT = {
	settings: PreviewSettingsT
	onChange: (next: PreviewSettingsT) => void
}

export const PreviewSettings = (props: PreviewSettingsPropsT): JSX.Element => {
	const handleThemeChange = (event: CustomEvent<{ value: PreviewThemeT }>): void =>
		props.onChange({ ...props.settings, theme: event.detail.value, font: 'sans', scale: 'compact' })
	const handleFontSizeChange = (event: CustomEvent<{ value: number }>): void =>
		props.onChange({ ...props.settings, font: 'sans', scale: 'compact', baseFontSize: event.detail.value })

	return (
		<z-popover placement="bottom-end">
			<z-button slot="trigger" kind="ghost" size="sm" title="Preview settings" aria-label="Preview settings">
				<SlidersHorizontalIcon size={16} weight="bold" />
			</z-button>
			<div className="previewSettingsPanelBody">
				<div className="previewSettingsGroup">
					<z-label>Theme</z-label>
					<z-toggle-group type="single" onChange={handleThemeChange}>
						<z-toggle-group-item value="dark" is-pressed={props.settings.theme === 'dark'}>Dark</z-toggle-group-item>
						<z-toggle-group-item value="light" is-pressed={props.settings.theme === 'light'}>Light</z-toggle-group-item>
					</z-toggle-group>
				</div>
				<z-field label="Base font size">
					<z-number-input
						value={props.settings.baseFontSize}
						min={minBaseFontSize}
						max={maxBaseFontSize}
						step={baseFontSizeStep}
						has-stepper-buttons
						onChange={handleFontSizeChange}
					/>
				</z-field>
			</div>
		</z-popover>
	)
}
