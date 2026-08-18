'use server'

import { readFile } from 'node:fs/promises'
import { join } from 'node:path'
import { renderMarkdown } from '@/app/actions/renderMarkdown'
import { getZokkuDocumentIdFromHref, resolveDocumentHref } from '@/lib/documentLinks'
import type { PreviewSettingsT, PreviewThemeT } from '@/components/previewSettings'
import type { ExportDocumentT } from '@/lib/localDocumentExport'

const FIXED_STEP_RATIOS = [0.579, 0.694, 0.833, 1] as const
const COMPACT_STEP_RATIOS = [1.2, 1.44, 1.728, 2.074, 2.488] as const

type RenderedExportDocumentT = { title: string; html: Record<PreviewThemeT, string> }
const escapeHtml = (text: string): string => text.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;')

const buildSurfaceStyle = (settings: PreviewSettingsT): string => {
	const base = settings.baseFontSize
	const variables: string[] = [`--base-font-size: ${base}px`]
	for (const [index, ratio] of FIXED_STEP_RATIOS.entries()) variables.push(`--font-size-${index}: ${(base * ratio).toFixed(3)}px`)
	for (const [index, ratio] of COMPACT_STEP_RATIOS.entries()) variables.push(`--font-size-${index + 4}: ${(base * ratio).toFixed(3)}px`)
	return variables.join('; ')
}

const rewriteLinkedDocumentHrefs = (html: string, currentDocumentPath: string, documentsById: Map<string, ExportDocumentT>): string => html.replace(/href="([^"]+)"/g, (fullMatch, href: string): string => {
	const resolved = resolveDocumentHref(currentDocumentPath, href)
	if (resolved !== null) return `href="#" data-zokku-document-path="${escapeHtml(resolved.path)}"${resolved.anchor ? ` data-zokku-anchor="${escapeHtml(resolved.anchor)}"` : ''}`
	const linkedDocumentId = getZokkuDocumentIdFromHref(href)
	if (linkedDocumentId === null) return fullMatch
	const linkedDocument = documentsById.get(linkedDocumentId)
	return linkedDocument === undefined ? fullMatch : `href="#" data-zokku-document-path="${escapeHtml(linkedDocument.path)}"`
})
const stripTodoElements = (html: string): string => html.replace(/<[^>]*class="[^"]*\bzTodo\b[^"]*"[^>]*>[\s\S]*?<\/[^>]+>/g, '')
const renderForTheme = async (document: ExportDocumentT, documentsById: Map<string, ExportDocumentT>, theme: PreviewThemeT): Promise<string> => rewriteLinkedDocumentHrefs(stripTodoElements(await renderMarkdown(document.content, theme)), document.path, documentsById)
const renderExportDocument = async (document: ExportDocumentT, documentsById: Map<string, ExportDocumentT>): Promise<RenderedExportDocumentT> => {
	const [light, dark] = await Promise.all([renderForTheme(document, documentsById, 'light'), renderForTheme(document, documentsById, 'dark')])
	return { title: document.title, html: { light, dark } }
}
const serializeForScript = (value: unknown): string => JSON.stringify(value).replace(/</g, '\\u003c')

export const exportLinkedHtml = async (documents: ExportDocumentT[], settings: PreviewSettingsT): Promise<string> => {
	const rootDocument = documents[0]
	if (rootDocument === undefined) throw new Error('No documents were supplied for export')
	const documentsById = new Map<string, ExportDocumentT>()
	for (const document of documents) documentsById.set(document.id, document)
	const renderedDocuments: Record<string, RenderedExportDocumentT> = {}
	for (const document of documents) renderedDocuments[document.path] = await renderExportDocument(document, documentsById)

	const baseCss = await readFile(join(process.cwd(), 'app', 'base.css'), 'utf-8')
	const mainCss = await readFile(join(process.cwd(), 'app', 'main.css'), 'utf-8')
	const previewCss = await readFile(join(process.cwd(), 'components', 'PreviewSettings.css'), 'utf-8')
	const circularCss = await readFile(join(process.cwd(), 'components', 'Circular.css'), 'utf-8')
	const surfaceAttributes = `data-preview-theme="${settings.theme}" data-preview-font="sans" data-preview-scale="compact"`

	return `<!DOCTYPE html>
<html lang="en"><head><meta charset="UTF-8" /><meta name="viewport" content="width=device-width, initial-scale=1.0" /><title>${escapeHtml(rootDocument.title)}</title>
<link rel="preconnect" href="https://fonts.googleapis.com" /><link rel="preconnect" href="https://fonts.gstatic.com" crossorigin />
<link rel="stylesheet" href="https://fonts.googleapis.com/css2?family=DM+Mono:ital,wght@0,400;0,500&family=DM+Sans:ital,opsz,wght@0,9..40,300;0,9..40,400;0,9..40,500;0,9..40,600;0,9..40,700;0,9..40,900&display=swap" />
<style>${baseCss}\n${mainCss}\n${previewCss}\n${circularCss}</style><style>
body { min-height: 100vh; padding: 3rem clamp(1.5rem, 8vw, 6rem); transition: background-color 0ms; }
.Prose { max-width: 52rem; margin: 0 auto; padding-bottom: 64px; }.zokkuExportToolbar { position: fixed; top: 18px; right: 18px; z-index: 30; }.zokkuExportNav { max-width: 52rem; margin: 0 auto 1.5rem; }.zokkuBackButton { display: inline-flex; align-items: center; gap: .45rem; border: 0; padding: 0; background: transparent; color: var(--muted); font: inherit; font-size: .875rem; cursor: pointer; }.zokkuBackButton:hover { color: var(--primary); }.zokkuBackButton[hidden] { display:none; }.zokkuMissingDocument { max-width:52rem; margin:0 auto; padding:4rem 0; }.zokkuMissingDocument p { color:var(--muted); }.zokkuPageContent { opacity:1; }.zokkuPageContent[data-theme-transition="out"] { opacity:0; transition:opacity 300ms ease; }.zokkuPageContent[data-theme-transition="in"] { opacity:1; transition:opacity 500ms ease; }.zokkuThemeToggle svg { width:16px; height:16px; }
</style></head><body ${surfaceAttributes} style="${buildSurfaceStyle(settings)}">
<div class="zokkuExportToolbar"><button id="zokkuThemeToggle" class="zokkuThemeToggle" type="button" aria-label="Switch theme" title="Switch theme"></button></div>
<div id="zokkuPageContent" class="zokkuPageContent" data-theme-transition="idle"><nav class="zokkuExportNav"><button id="zokkuBackButton" class="zokkuBackButton" type="button" hidden aria-label="Back">← Back</button></nav><main id="zokkuApp"><div id="zokkuContent" class="Prose"></div></main></div>
<script>(()=>{const documents=${serializeForScript(renderedDocuments)};const rootPath=${serializeForScript(rootDocument.path)};const contentElement=document.getElementById('zokkuContent');const pageContent=document.getElementById('zokkuPageContent');const backButton=document.getElementById('zokkuBackButton');const themeToggle=document.getElementById('zokkuThemeToggle');const routeHistory=[];let currentPath=rootPath;let currentTheme=${serializeForScript(settings.theme)};let isThemeTransitioning=false;
const sunIcon='<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round"><circle cx="12" cy="12" r="4"></circle><path d="M12 2v2M12 20v2M4.93 4.93l1.41 1.41M17.66 17.66l1.41 1.41M2 12h2M20 12h2M4.93 19.07l1.41-1.41M17.66 6.34l1.41-1.41"></path></svg>';const moonIcon='<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><path d="M20.4 15.4A8 8 0 0 1 8.6 3.6 8.5 8.5 0 1 0 20.4 15.4Z"></path></svg>';
const updateThemeToggle=()=>{themeToggle.innerHTML=currentTheme==='light'?moonIcon:sunIcon;themeToggle.setAttribute('aria-label',currentTheme==='light'?'Switch to dark theme':'Switch to light theme');themeToggle.title=currentTheme==='light'?'Switch to dark theme':'Switch to light theme';};
const renderDocument=(path,anchor='',addToHistory=true)=>{const nextDocument=documents[path];if(!nextDocument){document.title='Document not found';contentElement.className='zokkuMissingDocument';contentElement.innerHTML='<h1>Linked document not found</h1><p>This export does not contain the requested document.</p>';return;}if(addToHistory&&path!==currentPath)routeHistory.push(currentPath);currentPath=path;backButton.hidden=routeHistory.length===0;document.title=nextDocument.title;contentElement.className='Prose';contentElement.innerHTML=nextDocument.html[currentTheme];if(!anchor){window.scrollTo({top:0,behavior:'instant'});return;}requestAnimationFrame(()=>{const anchorElement=document.getElementById(anchor);if(anchorElement)anchorElement.scrollIntoView();});};
const switchTheme=()=>{if(isThemeTransitioning)return;isThemeTransitioning=true;pageContent.dataset.themeTransition='out';window.setTimeout(()=>{currentTheme=currentTheme==='light'?'dark':'light';document.body.dataset.previewTheme=currentTheme;renderDocument(currentPath,'',false);updateThemeToggle();pageContent.dataset.themeTransition='in';window.setTimeout(()=>{pageContent.dataset.themeTransition='idle';isThemeTransitioning=false;},500);},300);};
contentElement.addEventListener('click',(event)=>{const target=event.target;if(!(target instanceof Element))return;const link=target.closest('a[data-zokku-document-path]');if(!(link instanceof HTMLAnchorElement))return;event.preventDefault();const path=link.dataset.zokkuDocumentPath;if(!path)return;renderDocument(path,link.dataset.zokkuAnchor||'');});backButton.addEventListener('click',()=>{const previousPath=routeHistory.pop();if(!previousPath)return;renderDocument(previousPath,'',false);});themeToggle.addEventListener('click',switchTheme);updateThemeToggle();renderDocument(rootPath,'',false);})();</script></body></html>`
}
