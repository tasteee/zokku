'use client'

import { JSX } from 'react'
import { ConvexAuthNextjsProvider } from '@convex-dev/auth/nextjs'
import { ConvexReactClient } from 'convex/react'

const convex = new ConvexReactClient(process.env.NEXT_PUBLIC_CONVEX_URL!)

type ConvexClientProviderPropsT = {
	children: React.ReactNode
}

export const ConvexClientProvider = (props: ConvexClientProviderPropsT): JSX.Element => {
	return <ConvexAuthNextjsProvider client={convex}>{props.children}</ConvexAuthNextjsProvider>
}
