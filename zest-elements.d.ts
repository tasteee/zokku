// Type declarations for @tasteee/zest custom elements used as JSX intrinsics.
// The zest package ships Atomico (not React) types, so React's
// JSX.IntrinsicElements has no entries for <z-*> tags without this. Kept
// intentionally loose (`any` props) rather than modeling every attribute —
// see docs at node_modules/@tasteee/zest/README.md and the sibling zest
// source repo for the authoritative per-element attribute/event reference.
import 'react'

declare module 'react' {
	namespace JSX {
		interface IntrinsicElements {
			'z-button': any
			'z-button-group': any
			'z-link': any
			'z-toggle': any
			'z-toggle-group': any
			'z-toggle-group-item': any
			'z-toolbar': any
			'z-toolbar-group': any

			'z-input': any
			'z-textarea': any
			'z-select': any
			'z-combobox': any
			'z-checkbox': any
			'z-radio': any
			'z-radio-group': any
			'z-switch': any
			'z-number-input': any
			'z-field': any

			'z-dialog': any
			'z-alert-dialog': any
			'z-drawer': any
			'z-popover': any
			'z-tooltip': any
			'z-toast': any
			'z-callout': any

			'z-box': any
			'z-card': any
			'z-heading': any
			'z-subheading': any
			'z-eyebrow': any
			'z-text': any
			'z-label': any
			'z-separator': any
			'z-line': any

			'z-badge': any
			'z-stat': any
			'z-status-dot': any
			'z-avatar': any
			'z-progress': any
			'z-skeleton': any
			'z-empty-state': any
			'z-list': any
			'z-list-row': any
			'z-relative-time': any
			'z-copy-button': any
		}
	}
}
