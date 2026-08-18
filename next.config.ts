import type { NextConfig } from 'next'

const isGitHubPages = process.env.DEPLOY_TARGET === 'github-pages'

const nextConfig: NextConfig = {
	output: 'export',
	trailingSlash: true,
	basePath: isGitHubPages ? '/zokku' : '',

	typescript: {
		ignoreBuildErrors: true
	}
}

export default nextConfig
