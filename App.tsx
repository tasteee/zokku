import { JSX } from 'react'
import { Redirect, Route, Router, Switch } from 'wouter'
import { ZestRegistration } from '@/components/ZestRegistration'
import { FadingPage } from '@/components/FadingPage'
import { useTrailingSlashLocation } from '@/lib/routerLocation'
import HomePage from '@/app/page'
import DocumentsPage from '@/app/documents/page'
import DocumentEditorPage from '@/app/documents/editor/page'
import DocumentPreviewPage from '@/app/documents/preview/page'
import TrashPage from '@/app/trash/page'

// Vite resolves BASE_URL to the `base` set in vite.config.ts ('/zokku/' on
// GitHub Pages, '/' elsewhere). wouter wants it without the trailing slash.
const BASE_PATH = import.meta.env.BASE_URL.replace(/\/$/, '')

/*
	The shell the old app/layout.tsx used to render. ZestRegistration and
	FadingPage sit above the routes so they survive navigation: the fade is
	driven by a store and would restart if the wrapper remounted per route.
*/
export const App = (): JSX.Element => {
	return (
		<Router base={BASE_PATH} hook={useTrailingSlashLocation}>
			<ZestRegistration />
			<FadingPage>
				<Switch>
					<Route path="/" component={HomePage} />
					<Route path="/documents" component={DocumentsPage} />
					<Route path="/documents/editor" component={DocumentEditorPage} />
					<Route path="/documents/preview" component={DocumentPreviewPage} />
					<Route path="/trash" component={TrashPage} />
					<Route path="/sign-in"><Redirect to="/" /></Route>
					<Route><Redirect to="/" /></Route>
				</Switch>
			</FadingPage>
		</Router>
	)
}
