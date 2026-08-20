import { fileURLToPath } from 'node:url'
import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

/*
	GitHub Pages serves the app from /zokku, everywhere else it is the origin
	root. `base` is the Vite equivalent of the old next.config basePath: it
	rewrites the asset URLs in the built index.html, and App.tsx feeds the same
	value to wouter so route matching and generated hrefs agree with it.
*/
const isGitHubPages = process.env.DEPLOY_TARGET === 'github-pages'

export default defineConfig({
	base: isGitHubPages ? '/zokku/' : '/',
	plugins: [react()],

	resolve: {
		alias: {
			'@': fileURLToPath(new URL('.', import.meta.url))
		}
	},

	build: {
		// `out` is what wrangler.jsonc and the Pages workflow already publish.
		outDir: 'out',
		emptyOutDir: true
	},

	server: {
		port: 3000
	}
})
