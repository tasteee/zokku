import { JSX } from 'react'
import type { Metadata } from 'next'
import { ConvexAuthNextjsServerProvider } from '@convex-dev/auth/nextjs/server'
import { ConvexClientProvider } from '@/components/ConvexClientProvider'
import './globals.css'

export const metadata: Metadata = {
	title: 'Zokku',
	description: 'A gorgeous markdown document editor.'
}

type RootLayoutPropsT = {
	children: React.ReactNode
}

const RootLayout = (props: RootLayoutPropsT): JSX.Element => {
	return (
		<ConvexAuthNextjsServerProvider>
			<html lang="en">
				<body>
					<ConvexClientProvider>{props.children}</ConvexClientProvider>
				</body>
			</html>
		</ConvexAuthNextjsServerProvider>
	)
}

export default RootLayout
