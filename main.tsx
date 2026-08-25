import '@fontsource/dm-sans/latin-300.css'
import '@fontsource/dm-sans/latin-400.css'
import '@fontsource/dm-sans/latin-500.css'
import '@fontsource/dm-sans/latin-600.css'
import '@fontsource/dm-sans/latin-700.css'
import '@fontsource/dm-sans/latin-900.css'
import '@fontsource/dm-mono/latin-400.css'
import '@fontsource/dm-mono/latin-500.css'
import '@fontsource/fraunces/latin-300.css'
import '@fontsource/fraunces/latin-400.css'
import '@fontsource/fraunces/latin-500.css'
import '@fontsource/fraunces/latin-600.css'
import '@fontsource/fraunces/latin-700.css'

import './app/base.css'
import './app/main.css'
import './app/zText.css'
import '@tasteee/zest/ink.css'
import './components/Circular.css'

import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { App } from './App'

const rootElement = document.getElementById('root')
if (rootElement === null) throw new Error('Zokku could not find the #root element to mount into.')

createRoot(rootElement).render(<StrictMode><App /></StrictMode>)
