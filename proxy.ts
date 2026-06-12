import { convexAuthNextjsMiddleware, createRouteMatcher, nextjsMiddlewareRedirect } from '@convex-dev/auth/nextjs/server'

const isPublicRoute = createRouteMatcher(['/sign-in'])

export const proxy = convexAuthNextjsMiddleware(async (request, { convexAuth }) => {
	const isAuthenticated = await convexAuth.isAuthenticated()
	const isGoingToPublicRoute = isPublicRoute(request)

	console.log('got request: ', request.url)

	if (!isAuthenticated && !isGoingToPublicRoute) {
		console.log('sending to sign in')
		return nextjsMiddlewareRedirect(request, '/sign-in')
	}

	if (isAuthenticated && isGoingToPublicRoute) {
		console.log('sending to home')
		return nextjsMiddlewareRedirect(request, '/')
	}

	console.log('allowing request to proceed', { isAuthenticated, isGoingToPublicRoute, requestUrl: request.url })
})

export const config = {
	matcher: ['/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)']
}
