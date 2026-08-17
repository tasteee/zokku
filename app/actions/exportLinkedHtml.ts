'use server'

import { readFile } from 'node:fs/promises'
import { join } from 'node:path'
import { renderMarkdown } from '@/app/actions/renderMarkdown'
import { getZokkuDocumentIdFromHref, resolveDocumentHref } from '@/lib/documentLinks'
import type { PreviewSettingsT } from '@/components/previewSettings'
import type { ExportDocumentT } from '@/lib/localDocumentExport'

const FIXED_STEP_RATIOS = [0.579, 0.694, 0.833, 1] as const

const SCALE_STEP_RATIOS: Record<PreviewSettingsT['scale'], readonly number[]> = {
	compact: [1.2, 1.44, 1.728, 2.074, 2.488],
	default: [1.25, 1.563, 1.953, 2.441, 3.052],
	spacious: [1.333, 1.777, 2.369, 3.157, 4.209]
}

const escapeHtml = (text: string): string => {
	return text.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;')
}

const buildSurfaceStyle = (settings: PreviewSettingsT): string => {
	const baseFontSize = settings.baseFontSize
	const scaleRatios = SCALE_STEP_RATIOS[settings.scale]
	const variables: string[] = [`--base-font-size: ${baseFontSize}px`]

	for (const [index, ratio] of FIXED_STEP_RATIOS.entries()) {
		variables.push(`--font-size-${index}: ${(baseFontSize * ratio).toFixed(3)}px`)
	}

	for (const [index, ratio] of scaleRatios.entries()) {
		variables.push(`--font-size-${index + 4}: ${(baseFontSize * ratio).toFixed(3)}px`)
	}

	return variables.join('; ')
}

const getExportHref = (path: string, anchor: string): string => {
	const route = `#/document/${encodeURIComponent(path)}`
	if (!anchor) return route
	return `${route}?anchor=${encodeURIComponent(anchor)}`
}

const rewriteLinkedDocumentHrefs = (
	html: string,
	currentDocumentPath: string,
	documentsById: Map<string, ExportDocumentT>
): string => {
	return html.replace(/href="([^"]+)"/g, (fullMatch, href: string): string => {
		const resolved = resolveDocumentHref(currentDocumentPath, href)
		if (resolved !== null) {
			return `href="${getExportHref(resolved.path, resolved.anchor)}" data-zokku-document-path="${escapeHtml(resolved.path)}"`
		}

		const linkedDocumentId = getZokkuDocumentIdFromHref(href)
		if (linkedDocumentId === null) return fullMatch
		const linkedDocument = documentsById.get(linkedDocumentId)
		if (linkedDocument === undefined) return fullMatch

		return `href="${getExportHref(linkedDocument.path, '')}" data-zokku-document-path="${escapeHtml(linkedDocument.path)}"`
	})
}

const stripTodoElements = (html: string): string => {
	return html.replace(/<[^>]*class="[^"]*\bzTodo\b[^"]*"[^>]*>[\s\S]*?<\/[^>]+>/g, '')
}

const renderExportDocument = async (
	document: ExportDocumentT,
	documentsById: Map<string, ExportDocumentT>
): Promise<{ title: string; html: string }> => {
	const rendered = await renderMarkdown(document.content)
	const withoutTodos = stripTodoElements(rendered)
	const html = rewriteLinkedDocumentHrefs(withoutTodos, document.path, documentsById)
	return { title: document.title, html }
}

const serializeForScript = (value: unknown): string => {
	return JSON.stringify(value).replace(/</g, '\\u003c')
}

export const exportLinkedHtml = async (
	documents: ExportDocumentT[],
	settings: PreviewSettingsT
): Promise<string> => {
	const rootDocument = documents[0]
	if (rootDocument === undefined) throw new Error('No documents were supplied for export')

	const documentsById = new Map<string, ExportDocumentT>()
	for (const document of documents) documentsById.set(document.id, document)

	const renderedDocuments: Record<string, { title: string; html: string }> = {}
	for (const document of documents) renderedDocuments[document.path] = await renderExportDocument(document, documentsById)

	const baseCss = await readFile(join(process.cwd(), 'app', 'base.css'), 'utf-8')
	const mainCss = await readFile(join(process.cwd(), 'app', 'main.css'), 'utf-8')
	const previewCss = await readFile(join(process.cwd(), 'components', 'PreviewSettings.css'), 'utf-8')
	const globalsCss = `${baseCss}\n${mainCss}\n${previewCss}`
	const surfaceAttributes = `data-preview-theme="${settings.theme}" data-preview-font="${settings.font}" data-preview-scale="${settings.scale}"`
	const surfaceStyle = buildSurfaceStyle(settings)
	const serializedDocuments = serializeForScript(renderedDocuments)
	const serializedRootPath = serializeForScript(rootDocument.path)

	return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <title>${escapeHtml(rootDocument.title)}</title>
  <link rel="preconnect" href="https://fonts.googleapis.com" />
  <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin />
  <link rel="stylesheet" href="https://fonts.googleapis.com/css2?family=DM+Mono:ital,wght@0,400;0,500&family=DM+Sans:ital,opsz,wght@0,9..40,300;0,9..40,400;0,9..40,500;0,9..40,600;0,9..40,700;0,9..40,900&family=Fraunces:ital,opsz,wght@0,9..144,300;0,9..144,400;0,9..144,500;0,9..144,600;0,9..144,700&display=swap" />
  <style>${globalsCss}</style>
  <style>
    :root { --font-fraunces: 'Fraunces'; }
    body { padding: 3rem clamp(1.5rem, 8vw, 6rem); }
    .Prose { max-width: 52rem; margin: 0 auto; padding-bottom: 64px; }
    .zokkuMissingDocument { max-width: 52rem; margin: 0 auto; padding: 4rem 0; }
    .zokkuMissingDocument p { color: var(--muted); }
  </style>
</head>
<body ${surfaceAttributes} style="${surfaceStyle}">
  <main id="zokkuApp"><div id="zokkuContent" class="Prose"></div></main>
  <script>
    (() => {
      const documents = ${serializedDocuments};
      const rootPath = ${serializedRootPath};
      const contentElement = document.getElementById('zokkuContent');

      const getRoute = () => {
        const hash = window.location.hash;
        if (!hash.startsWith('#/document/')) return { path: rootPath, anchor: '' };
        const routeValue = hash.slice('#/document/'.length);
        const queryIndex = routeValue.indexOf('?');
        const encodedPath = queryIndex >= 0 ? routeValue.slice(0, queryIndex) : routeValue;
        const query = queryIndex >= 0 ? routeValue.slice(queryIndex + 1) : '';
        const parameters = new URLSearchParams(query);
        return { path: decodeURIComponent(encodedPath), anchor: parameters.get('anchor') || '' };
      };

      const render = () => {
        const route = getRoute();
        const nextDocument = documents[route.path];
        if (!nextDocument) {
          document.title = 'Document not found';
          contentElement.className = 'zokkuMissingDocument';
          contentElement.innerHTML = '<h1>Linked document not found</h1><p>This export does not contain the requested document.</p>';
          return;
        }

        document.title = nextDocument.title;
        contentElement.className = 'Prose';
        contentElement.innerHTML = nextDocument.html;

        if (!route.anchor) {
          window.scrollTo({ top: 0, behavior: 'instant' });
          return;
        }

        requestAnimationFrame(() => {
          const anchorElement = document.getElementById(route.anchor);
          if (anchorElement) anchorElement.scrollIntoView();
        });
      };

      window.addEventListener('hashchange', render);
      render();
    })();
  </script>
</body>
</html>`
}
