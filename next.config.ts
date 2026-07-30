import type { NextConfig } from 'next'

const nextConfig: NextConfig = {
	output: 'standalone',

	typescript: {
		ignoreBuildErrors: true
	},

	async rewrites() {
		const convexUrl = process.env.NEXT_PUBLIC_CONVEX_URL
		if (!convexUrl) return []

		return [
			{
				source: '/api/auth/:path*',
				destination: `${convexUrl.replace('.cloud', '.site')}/api/auth/:path*`
			}
		]
	}
}

export default nextConfig
