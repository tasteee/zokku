'use client'

import { useEffect } from 'react'

export const ZestRegistration = (): null => {
	useEffect(() => {
		void import('@tasteee/zest')
	}, [])

	return null
}
