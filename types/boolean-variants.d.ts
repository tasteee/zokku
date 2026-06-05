type BoolishT = boolean | undefined

// OnlyOneTruePropT<
type OnlyOneTruePropT<KeysT extends string, ActiveKeyT extends KeysT> = {
	[KeyT in ActiveKeyT]: true
} & {
	[KeyT in Exclude<KeysT, ActiveKeyT>]?: false | undefined
}

type ZeroOrOneTruePropT<KeysT extends string> =
	| Partial<Record<KeysT, false | undefined>>
	| {
			[KeyT in KeysT]: OnlyOneTruePropT<KeysT, KeyT>
	  }[KeysT]
