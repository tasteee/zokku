type AnyObjectT = Record<string, any>
type AnyArrayT = Array<any>

export const getFirstTruthy = (target: AnyObjectT | AnyArrayT) => {
	for (const key in target) {
		const currentKey = key as unknown as keyof typeof target
		if (target[currentKey]) return currentKey
	}
}
