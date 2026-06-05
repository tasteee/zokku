import { Sidebar } from '@/components/Sidebar'
import { JSX } from 'react'

type AppLayoutPropsT = {
	children: React.ReactNode
}

const AppLayout = (props: AppLayoutPropsT): JSX.Element => {
	return (
		<div className="AppShell">
			<Sidebar />
			<main className="MainArea">{props.children}</main>
		</div>
	)
}

export default AppLayout
