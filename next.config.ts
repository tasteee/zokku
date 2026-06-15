import type { NextConfig } from 'next'

const nextConfig: NextConfig = {
	output: 'standalone',
	async rewrites() {
		return [
			{
				source: '/api/auth/:path*',
				destination: `${process.env.NEXT_PUBLIC_CONVEX_URL!.replace('.cloud', '.site')}/api/auth/:path*`
			}
		]
	}
}

export default nextConfig
