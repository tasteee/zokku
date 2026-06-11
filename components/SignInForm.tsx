'use client'

import './SignInForm.css'
import { JSX, useState } from 'react'
import { useAuthActions } from '@convex-dev/auth/react'
import { useRouter } from 'next/navigation'

type AuthMode = 'signIn' | 'signUp'

export const SignInForm = (): JSX.Element => {
	const { signIn } = useAuthActions()
	const router = useRouter()
	const [mode, setMode] = useState<AuthMode>('signIn')
	const [email, setEmail] = useState('')
	const [password, setPassword] = useState('')
	const [errorMessage, setErrorMessage] = useState<string | null>(null)
	const [isSubmitting, setIsSubmitting] = useState(false)

	const isSignUp = mode === 'signUp'
	const pageTitle = isSignUp ? 'Create account' : 'Welcome back'
	const pageSubtitle = isSignUp ? 'Sign up to start writing.' : 'Sign in to your documents.'
	const buttonLabel = isSubmitting ? (isSignUp ? 'Creating...' : 'Signing in...') : isSignUp ? 'Create account' : 'Sign in'
	const togglePrompt = isSignUp ? 'Already have an account?' : 'New here?'
	const toggleLabel = isSignUp ? 'Sign in' : 'Create account'

	const handleSubmit = async (event: React.FormEvent<HTMLFormElement>): Promise<void> => {
		event.preventDefault()
		setErrorMessage(null)
		setIsSubmitting(true)

		const formData = new FormData()
		formData.set('email', email)
		formData.set('password', password)
		formData.set('flow', mode)

		try {
			await signIn('password', formData)
			router.push('/documents')
		} catch (caughtError) {
			const isError = caughtError instanceof Error
			const fallbackMessage = 'Something went wrong. Please try again.'
			setErrorMessage(isError ? caughtError.message : fallbackMessage)
		} finally {
			setIsSubmitting(false)
		}
	}

	const handleToggleMode = (): void => {
		setMode(isSignUp ? 'signIn' : 'signUp')
		setErrorMessage(null)
	}

	return (
		<div className="AuthShell">
			<div className="AuthCard">
				<div className="AuthCardHeader">
					<p className="AuthBrand">
						<span
							style={{
								display: 'inline-block',
								width: '0.4375rem',
								height: '0.4375rem',
								borderRadius: '999px',
								background: 'var(--accent)',
								marginRight: '0.5rem',
								verticalAlign: '0.1em'
							}}
						/>
						Zokku
					</p>
					<h1 className="AuthTitle">{pageTitle}</h1>
					<p className="AuthSubtitle">{pageSubtitle}</p>
				</div>

				<form className="AuthForm" onSubmit={handleSubmit}>
					{errorMessage !== null && <p className="AuthError">{errorMessage}</p>}

					<div className="AuthFieldGroup">
						<label className="AuthLabel" htmlFor="email">
							Email
						</label>
						<input
							id="email"
							className="AuthInput"
							type="email"
							value={email}
							onChange={(event) => setEmail(event.target.value)}
							placeholder="you@example.com"
							autoComplete="email"
							required
						/>
					</div>

					<div className="AuthFieldGroup">
						<label className="AuthLabel" htmlFor="password">
							Password
						</label>
						<input
							id="password"
							className="AuthInput"
							type="password"
							value={password}
							onChange={(event) => setPassword(event.target.value)}
							placeholder="••••••••"
							autoComplete={isSignUp ? 'new-password' : 'current-password'}
							required
						/>
					</div>

					<button className="AuthSubmitButton" type="submit" disabled={isSubmitting}>
						{buttonLabel}
					</button>
				</form>

				<p className="AuthToggle">
					{togglePrompt}{' '}
					<button className="AuthToggleLink" type="button" onClick={handleToggleMode}>
						{toggleLabel}
					</button>
				</p>
			</div>
		</div>
	)
}
