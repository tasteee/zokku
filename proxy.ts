import { convexAuthNextjsMiddleware, createRouteMatcher, nextjsMiddlewareRedirect } from '@convex-dev/auth/nextjs/server'

const isPublicRoute = createRouteMatcher(['/sign-in'])

export const proxy = convexAuthNextjsMiddleware(async (request, { convexAuth }) => {
	const isAuthenticated = await convexAuth.isAuthenticated()
	const isGoingToPublicRoute = isPublicRoute(request)

	if (!isAuthenticated && !isGoingToPublicRoute) {
		return nextjsMiddlewareRedirect(request, '/sign-in')
	}

	if (isAuthenticated && isGoingToPublicRoute) {
		return nextjsMiddlewareRedirect(request, '/')
	}
})

export const config = {
	matcher: ['/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)']
}
