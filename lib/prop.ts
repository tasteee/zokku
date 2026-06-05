export const createPropClassNameSwitch = (map: Record<string, string>) => {
	const fallback = map.default || ''
	const mapEntries = Object.entries(map)

	return (props: AnyObjectT): string => {
		for (const [prop, className] of mapEntries) {
			if (prop === 'default') continue
			if (props[prop as keyof AnyObjectT]) return className
		}

		return fallback
	}
}

// This is a more flexible version of createPropClassNameSwitch that allows for
// multiple class names to be returned based on the props. It will return a string of
// class names separated by spaces for all props that are true.
export const createPropsClassNamesBuilder = (map: Record<string, string>) => {
	const fallback = ''
	const mapEntries = Object.entries(map)

	return (props: AnyObjectT): string => {
		const classNames: string[] = []

		for (const [prop, className] of mapEntries) {
			if (props[prop as keyof AnyObjectT]) {
				classNames.push(className)
			}
		}

		const hasClassNames = classNames.length > 0
		return hasClassNames ? classNames.join(' ') : fallback
	}
}

export const nameMapper = (map: Record<string, string>) => {
	const mapEntries = Object.entries(map)

	return (props: AnyObjectT): Record<string, any> => {
		const mappedProps = {} as Record<string, any>

		for (const [key, mappedKey] of mapEntries) {
			const value = props[key as keyof AnyObjectT]
			const isValueDefined = value !== undefined
			if (isValueDefined) mappedProps[mappedKey] = value
		}

		return mappedProps
	}
}

const createPropSplitter = (customProps: string[]) => {
	return (props: AnyObjectT): [Record<string, any>, Record<string, any>] => {
		const splitCustomProps = {} as Record<string, any>
		const otherProps = {} as Record<string, any>

		for (const key in props) {
			if (customProps.includes(key)) splitCustomProps[key] = props[key as keyof AnyObjectT]
			else otherProps[key] = props[key as keyof AnyObjectT]
		}

		return [splitCustomProps, otherProps]
	}
}

export const prop = {
	classNameSwitch: createPropClassNameSwitch,
	classNamesBuilder: createPropsClassNamesBuilder,
	nameMapper: nameMapper,
	splitter: createPropSplitter
}
