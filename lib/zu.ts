export const zu = {
	object: {
		hasOneTrueOf: <T extends string>(keys: T[]) => {
			return <Type extends object>(props: Type) => {
				for (const key of keys) {
					const currentKey = key as unknown as keyof Type
					if (currentKey in props && props[currentKey] === true) return true
				}

				return false
			}
		},

		hasOneOf: <T extends string>(keys: T[]) => {
			return <Type extends object>(props: Type) => {
				for (const key of keys) {
					const currentKey = key as unknown as keyof Type
					if (currentKey in props && props[currentKey] !== undefined) return true
				}

				return false
			}
		}
	}
}
