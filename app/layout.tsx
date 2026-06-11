import './base.css'
import './main.css'

import { JSX } from 'react'
import type { Metadata } from 'next'
import { DM_Mono, DM_Sans } from 'next/font/google'
import { ConvexAuthNextjsServerProvider } from '@convex-dev/auth/nextjs/server'
import { ConvexClientProvider } from '@/components/ConvexClientProvider'
import '@/components/zButton.css'

export const metadata: Metadata = {
	title: 'Zokku',
	description: 'A gorgeous markdown document editor.'
}

const dmSans = DM_Sans({
	subsets: ['latin'],
	weight: ['300', '400', '500', '600', '700', '900'],
	variable: '--font-dm-sans'
})

const dmMono = DM_Mono({
	subsets: ['latin'],
	weight: ['400', '500'],
	variable: '--font-dm-mono'
})
type RootLayoutPropsT = {
	children: React.ReactNode
}

const RootLayout = (props: RootLayoutPropsT): JSX.Element => {
	return (
		<ConvexAuthNextjsServerProvider>
			<html lang="en" className={`${dmSans.className} ${dmMono.className}`}>
				<body>
					<ConvexClientProvider>{props.children}</ConvexClientProvider>
				</body>
			</html>
		</ConvexAuthNextjsServerProvider>
	)
}

export default RootLayout
