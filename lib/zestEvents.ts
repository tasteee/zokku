/*
	Zest's custom elements report their new value on a CustomEvent they dispatch
	themselves, carrying it as `detail.value`. React cannot deliver that event:
	`onInput`, `onChange` and the rest are names React owns, so it hands the
	listener its own synthetic event, and a synthetic event has no `detail` at
	all. Lowercase `oninput`/`onchange` props are the ones React forwards
	straight to addEventListener, and those receive the element's own event.

	Elements built around a native <input> emit composed `input`/`change` events
	of their own as well. Those cross the shadow boundary and land on the same
	listener without a `detail`, so the value has to be read defensively.
*/
export const onZestValue =
	<ValueT>(handler: (value: ValueT) => void) =>
	(event: Event): void => {
		const detail = (event as CustomEvent<{ value?: ValueT } | null>).detail
		const value = detail?.value
		if (value === undefined) return
		handler(value)
	}
