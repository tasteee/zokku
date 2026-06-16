'use client'

import './PreviewSettings.css'
import { useState, useRef, useEffect, JSX } from 'react'
import { SlidersHorizontalIcon, MinusIcon, PlusIcon } from '@phosphor-icons/react'
import {
	previewThemeOptions,
	previewFontOptions,
	previewScaleOptions,
	minBaseFontSize,
	maxBaseFontSize,
	baseFontSizeStep
} from '@/components/previewSettings'
import type {
	PreviewSettingsT,
	PreviewOptionT,
	PreviewThemeT,
	PreviewFontT,
	PreviewScaleT
} from '@/components/previewSettings'

import { datass } from 'datass'

const $previewSettings = datass.object<PreviewSettingsT>({
	theme: 'light',
	font: 'sans',
	scale: 'medium',
	baseFontSize: 18
})

type SegmentButtonPropsT<ValueT extends string> = {
	option: PreviewOptionT<ValueT>
	isActive: boolean
	onSelect: (next: ValueT) => void
}

const SegmentButton = <ValueT extends string>(props: SegmentButtonPropsT<ValueT>): JSX.Element => {
	const segmentClassName = props.isActive ? 'PreviewSettingsSegment isActive' : 'PreviewSettingsSegment'
	const handleClick = (): void => props.onSelect(props.option.value)

	return (
		<button className={segmentClassName} onClick={handleClick}>
			{props.option.label}
		</button>
	)
}

type SegmentedPropsT<ValueT extends string> = {
	label: string
	options: PreviewOptionT<ValueT>[]
	value: ValueT
	onSelect: (next: ValueT) => void
}

const Segmented = <ValueT extends string>(props: SegmentedPropsT<ValueT>): JSX.Element => {
	return (
		<div className="PreviewSettingsGroup">
			<span className="PreviewSettingsGroupLabel">{props.label}</span>
			<div className="PreviewSettingsSegmented">
				{props.options.map((option) => (
					<SegmentButton
						key={option.value}
						option={option}
						isActive={option.value === props.value}
						onSelect={props.onSelect}
					/>
				))}
			</div>
		</div>
	)
}

type PreviewSettingsPropsT = {
	settings: PreviewSettingsT
	onChange: (next: PreviewSettingsT) => void
}

export const PreviewSettings = (props: PreviewSettingsPropsT): JSX.Element => {
	const [isOpen, setIsOpen] = useState(false)
	const rootRef = useRef<HTMLDivElement | null>(null)

	// Close on an outside click or the Escape key while the panel is open.
	useEffect(() => {
		if (!isOpen) return

		const handlePointerDown = (event: PointerEvent): void => {
			const rootElement = rootRef.current
			if (rootElement === null) return
			const target = event.target as Node
			const isInside = rootElement.contains(target)
			if (isInside) return
			setIsOpen(false)
		}

		const handleKeyDown = (event: KeyboardEvent): void => {
			const isEscape = event.key === 'Escape'
			if (isEscape) setIsOpen(false)
		}

		window.addEventListener('pointerdown', handlePointerDown)
		window.addEventListener('keydown', handleKeyDown)

		return () => {
			window.removeEventListener('pointerdown', handlePointerDown)
			window.removeEventListener('keydown', handleKeyDown)
		}
	}, [isOpen])

	const handleToggle = (): void => setIsOpen(!isOpen)

	const handleThemeSelect = (next: PreviewThemeT): void => {
		props.onChange({ ...props.settings, theme: next })
	}

	const handleFontSelect = (next: PreviewFontT): void => {
		props.onChange({ ...props.settings, font: next })
	}

	const handleScaleSelect = (next: PreviewScaleT): void => {
		props.onChange({ ...props.settings, scale: next })
	}

	const handleDecreaseSize = (): void => {
		const nextSize = props.settings.baseFontSize - baseFontSizeStep
		const clampedSize = Math.max(minBaseFontSize, nextSize)
		props.onChange({ ...props.settings, baseFontSize: clampedSize })
	}

	const handleIncreaseSize = (): void => {
		const nextSize = props.settings.baseFontSize + baseFontSizeStep
		const clampedSize = Math.min(maxBaseFontSize, nextSize)
		props.onChange({ ...props.settings, baseFontSize: clampedSize })
	}

	const triggerClassName = isOpen ? 'PreviewSettingsTrigger isOpen' : 'PreviewSettingsTrigger'
	const isAtMinSize = props.settings.baseFontSize <= minBaseFontSize
	const isAtMaxSize = props.settings.baseFontSize >= maxBaseFontSize

	return (
		<div ref={rootRef} className="PreviewSettingsRoot">
			<button className={triggerClassName} onClick={handleToggle} title="Preview settings" aria-label="Preview settings">
				<SlidersHorizontalIcon size={16} weight="bold" />
			</button>

			{isOpen && (
				<div className="PreviewSettingsPanel">
					<Segmented
						label="Theme"
						options={previewThemeOptions}
						value={props.settings.theme}
						onSelect={handleThemeSelect}
					/>
					<Segmented label="Font" options={previewFontOptions} value={props.settings.font} onSelect={handleFontSelect} />
					<Segmented
						label="Type scale"
						options={previewScaleOptions}
						value={props.settings.scale}
						onSelect={handleScaleSelect}
					/>

					<div className="PreviewSettingsGroup">
						<span className="PreviewSettingsGroupLabel">Base font size</span>
						<div className="PreviewSettingsStepper">
							<button
								className="PreviewSettingsStepperButton"
								onClick={handleDecreaseSize}
								disabled={isAtMinSize}
								aria-label="Decrease base font size"
							>
								<MinusIcon size={14} weight="bold" />
							</button>
							<span className="PreviewSettingsStepperValue">{props.settings.baseFontSize}px</span>
							<button
								className="PreviewSettingsStepperButton"
								onClick={handleIncreaseSize}
								disabled={isAtMaxSize}
								aria-label="Increase base font size"
							>
								<PlusIcon size={14} weight="bold" />
							</button>
						</div>
					</div>
				</div>
			)}
		</div>
	)
}
