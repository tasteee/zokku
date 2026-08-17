import './base.css'
import './main.css'
import './zText.css'

import { JSX } from 'react'
import type { Metadata } from 'next'
import { DM_Mono, DM_Sans, Fraunces } from 'next/font/google'
import '@/components/zButton.css'

export const metadata: Metadata = {
	title: 'Zokku',
	description: 'A local-first Markdown workspace.'
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

const fraunces = Fraunces({
	subsets: ['latin'],
	weight: ['300', '400', '500', '600', '700'],
	variable: '--font-fraunces'
})

type RootLayoutPropsT = {
	children: React.ReactNode
}

const RootLayout = (props: RootLayoutPropsT): JSX.Element => {
	return (
		<html lang="en" className={`${dmSans.className} ${dmMono.className} ${fraunces.variable}`}>
			<body>{props.children}</body>
		</html>
	)
}

export default RootLayout
