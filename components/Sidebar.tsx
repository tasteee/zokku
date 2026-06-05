'use client'

import { useQuery, useMutation } from 'convex/react'
import { useAuthActions } from '@convex-dev/auth/react'
import { useRouter, usePathname } from 'next/navigation'
import Link from 'next/link'
import { api } from '@/convex/_generated/api'
import { JSX } from 'react'

export const Sidebar = (): JSX.Element => {
	const documents = useQuery(api.documents.list)
	const createDocument = useMutation(api.documents.create)
	const { signOut } = useAuthActions()
	const router = useRouter()
	const pathname = usePathname()

	const handleNew = async (): Promise<void> => {
		const documentId = await createDocument()
		router.push(`/documents/${documentId}`)
	}

	const handleSignOut = async (): Promise<void> => {
		await signOut()
		router.push('/sign-in')
	}

	const hasDocuments = documents !== undefined && documents.length > 0

	return (
		<aside className="Sidebar">
			<div className="SidebarHeader">
				<span className="SidebarBrand">
					<span className="SidebarBrandDot" />
					Zokku
				</span>
				<button className="SidebarNewButton" onClick={handleNew} title="New document">
					+
				</button>
			</div>

			<div className="SidebarList">
				{!hasDocuments && <p className="SidebarEmpty">No documents yet.{'\n'}Hit + to create one.</p>}
				{hasDocuments &&
					documents.map((document) => {
						const documentPath = `/documents/${document._id}`
						const isActive = pathname === documentPath

						return (
							<Link
								key={document._id}
								href={documentPath}
								className="SidebarItem"
								data-active={isActive ? 'true' : 'false'}
							>
								{document.title || 'Untitled'}
							</Link>
						)
					})}
			</div>

			<div className="SidebarFooter">
				<button className="SidebarSignOut" onClick={handleSignOut}>
					Sign out
				</button>
			</div>
		</aside>
	)
}
