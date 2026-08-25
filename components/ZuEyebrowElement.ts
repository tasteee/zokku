import { c, css, h } from 'atomico'

const props = {
	full: { type: Boolean, value: () => false, reflect: true }
}

const styles = css`
	:host {
		display: flex;
		align-items: center;
		gap: 16px;
		width: 100%;
		color: var(--primary);
		font-family: inherit;
		font-size: var(--font-size-1, 0.694rem);
		font-weight: 700;
		line-height: var(--line-height-small, 1.55);
		letter-spacing: 0.12em;
		text-transform: uppercase;
		margin-bottom: var(--spacing-4, 1rem);
	}

	:host::after {
		content: '';
		flex: 0 0 80px;
		height: 1px;
		background: currentColor;
		opacity: 0.35;
	}

	:host([full])::after {
		flex: 1 1 auto;
		min-width: 32px;
	}
`

const ZuEyebrow = c(() => h('host', { shadowDom: true, children: h('slot') }), { props, styles: [styles] })

if (!customElements.get('zu-eyebrow')) customElements.define('zu-eyebrow', ZuEyebrow)
