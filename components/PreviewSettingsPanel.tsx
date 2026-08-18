'use client'

import './PreviewSettings.css'
import { useState, useRef, useEffect, JSX } from 'react'
import { SlidersHorizontalIcon, MinusIcon, PlusIcon } from '@phosphor-icons/react'
import {
	previewThemeOptions,
	minBaseFontSize,
	maxBaseFontSize,
	baseFontSizeStep
} from '@/components/previewSettings'
import type { PreviewSettingsT, PreviewOptionT, PreviewThemeT } from '@/components/previewSettings'

type SegmentButtonPropsT<ValueT extends string> = {
	option: PreviewOptionT<ValueT>
	isActive: boolean
	onSelect: (next: ValueT) => void
}

const SegmentButton = <ValueT extends string>(props: SegmentButtonPropsT<ValueT>): JSX.Element => (
	<button className={props.isActive ? 'PreviewSettingsSegment isActive' : 'PreviewSettingsSegment'} onClick={() => props.onSelect(props.option.value)}>
		{props.option.label}
	</button>
)

type SegmentedPropsT<ValueT extends string> = {
	label: string
	options: PreviewOptionT<ValueT>[]
	value: ValueT
	onSelect: (next: ValueT) => void
}

const Segmented = <ValueT extends string>(props: SegmentedPropsT<ValueT>): JSX.Element => (
	<div className="PreviewSettingsGroup">
		<span className="PreviewSettingsGroupLabel">{props.label}</span>
		<div className="PreviewSettingsSegmented">
			{props.options.map((option) => <SegmentButton key={option.value} option={option} isActive={option.value === props.value} onSelect={props.onSelect} />)}
		</div>
	</div>
)

type PreviewSettingsPropsT = {
	settings: PreviewSettingsT
	onChange: (next: PreviewSettingsT) => void
}

export const PreviewSettings = (props: PreviewSettingsPropsT): JSX.Element => {
	const [isOpen, setIsOpen] = useState(false)
	const rootRef = useRef<HTMLDivElement | null>(null)

	useEffect(() => {
		if (!isOpen) return
		const handlePointerDown = (event: PointerEvent): void => {
			if (rootRef.current?.contains(event.target as Node)) return
			setIsOpen(false)
		}
		const handleKeyDown = (event: KeyboardEvent): void => {
			if (event.key === 'Escape') setIsOpen(false)
		}
		window.addEventListener('pointerdown', handlePointerDown)
		window.addEventListener('keydown', handleKeyDown)
		return () => {
			window.removeEventListener('pointerdown', handlePointerDown)
			window.removeEventListener('keydown', handleKeyDown)
		}
	}, [isOpen])

	const handleThemeSelect = (theme: PreviewThemeT): void => props.onChange({ ...props.settings, theme, font: 'sans', scale: 'compact' })
	const handleDecreaseSize = (): void => props.onChange({ ...props.settings, font: 'sans', scale: 'compact', baseFontSize: Math.max(minBaseFontSize, props.settings.baseFontSize - baseFontSizeStep) })
	const handleIncreaseSize = (): void => props.onChange({ ...props.settings, font: 'sans', scale: 'compact', baseFontSize: Math.min(maxBaseFontSize, props.settings.baseFontSize + baseFontSizeStep) })
	const triggerClassName = isOpen ? 'PreviewSettingsTrigger isOpen' : 'PreviewSettingsTrigger'

	return (
		<div ref={rootRef} className="PreviewSettingsRoot">
			<button className={triggerClassName} onClick={() => setIsOpen(!isOpen)} title="Preview settings" aria-label="Preview settings">
				<SlidersHorizontalIcon size={16} weight="bold" />
			</button>
			{isOpen && (
				<div className="PreviewSettingsPanel">
					<Segmented label="Theme" options={previewThemeOptions} value={props.settings.theme} onSelect={handleThemeSelect} />
					<div className="PreviewSettingsGroup">
						<span className="PreviewSettingsGroupLabel">Base font size</span>
						<div className="PreviewSettingsStepper">
							<button className="PreviewSettingsStepperButton" onClick={handleDecreaseSize} disabled={props.settings.baseFontSize <= minBaseFontSize} aria-label="Decrease base font size"><MinusIcon size={14} weight="bold" /></button>
							<span className="PreviewSettingsStepperValue">{props.settings.baseFontSize}px</span>
							<button className="PreviewSettingsStepperButton" onClick={handleIncreaseSize} disabled={props.settings.baseFontSize >= maxBaseFontSize} aria-label="Increase base font size"><PlusIcon size={14} weight="bold" /></button>
						</div>
					</div>
				</div>
			)}
		</div>
	)
}
