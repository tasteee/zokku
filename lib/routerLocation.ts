import type { BaseLocationHook } from 'wouter'
import { navigate, usePathname } from 'wouter/use-browser-location'

/*
	Every href in the app ends in a slash, because the old static export served
	each route as its own directory (`trailingSlash: true`) and the deployed
	hosts still resolve those URLs. wouter patterns have no trailing slash, so
	the location is normalized here instead of declaring every route twice.
	This runs before wouter strips the base path off the location, so a base of
	`/zokku` is still intact when it does.
*/
export const useTrailingSlashLocation = ((options = {}) => {
	const pathname = usePathname(options)
	const normalizedPathname = pathname.length > 1 ? pathname.replace(/\/+$/, '') : pathname
	return [normalizedPathname, navigate]
}) as BaseLocationHook
