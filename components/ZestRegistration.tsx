import { useEffect } from 'react'

export const ZestRegistration = (): null => {
	useEffect(() => {
		void import('@tasteee/zest')
		void import('@/components/ZuEyebrowElement')
	}, [])

	return null
}
