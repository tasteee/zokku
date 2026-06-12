import React, { JSX } from 'react'

type AppLayoutPropsT = {
	children: React.ReactNode
}

const AppLayout = (props: AppLayoutPropsT): JSX.Element => {
	return <>{props.children}</>
}

export default AppLayout
