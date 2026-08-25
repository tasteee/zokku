import { renderMarkdownForExport } from '@/app/actions/renderMarkdown'
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

const rewriteLinkedDocumentHrefs = (html: string, currentDocumentPath: string, documentsById: Map<string, ExportDocumentT>): string => {
	return html.replace(/href="([^"]+)"/g, (fullMatch, href: string): string => {
		const resolved = resolveDocumentHref(currentDocumentPath, href)
		if (resolved !== null) {
			const anchorAttribute = resolved.anchor ? ` data-zokku-anchor="${escapeHtml(resolved.anchor)}"` : ''
			return `href="#" data-zokku-document-path="${escapeHtml(resolved.path)}"${anchorAttribute}`
		}

		const linkedDocumentId = getZokkuDocumentIdFromHref(href)
		if (linkedDocumentId === null) return fullMatch
		const linkedDocument = documentsById.get(linkedDocumentId)
		if (linkedDocument === undefined) return fullMatch
		return `href="#" data-zokku-document-path="${escapeHtml(linkedDocument.path)}"`
	})
}

/*
	Zest elements are defined by scripts that the export does not ship, so an
	un-upgraded <z-eyebrow> renders nothing at all: its text lives in the label
	attribute and its markup is generated in a shadow root. Rewriting it to the
	project's own <zu-eyebrow>, which is styled from the document stylesheet,
	keeps the content and the appearance in a standalone file.
*/
const rewriteZestEyebrows = (html: string): string => {
	return html.replace(/<z-eyebrow\b([^>]*)>([\s\S]*?)<\/z-eyebrow>/g, (fullMatch, attributes: string, children: string): string => {
		const labelMatch = attributes.match(/\blabel="([^"]*)"/)
		const content = children.trim() || labelMatch?.[1] || ''
		if (content === '') return fullMatch
		const isFullWidth = /\b(?:is-full-width|full-width|full)\b/.test(attributes)
		const hasRule = /\bhas-rule\b/.test(attributes)
		const modifiers = `${isFullWidth ? ' full' : ''}${hasRule ? '' : ' no-rule'}`
		return `<zu-eyebrow${modifiers}>${content}</zu-eyebrow>`
	})
}

const renderForTheme = async (document: ExportDocumentT, documentsById: Map<string, ExportDocumentT>, theme: PreviewThemeT): Promise<string> => {
	const html = await renderMarkdownForExport(document.content, theme)
	return rewriteLinkedDocumentHrefs(rewriteZestEyebrows(html), document.path, documentsById)
}

const renderExportDocument = async (document: ExportDocumentT, documentsById: Map<string, ExportDocumentT>): Promise<RenderedExportDocumentT> => {
	const [light, dark] = await Promise.all([
		renderForTheme(document, documentsById, 'light'),
		renderForTheme(document, documentsById, 'dark')
	])
	return { title: document.title, html: { light, dark } }
}

const serializeForScript = (value: unknown): string => JSON.stringify(value).replace(/</g, '\\u003c')

const collectApplicationCss = (): string => {
	const chunks: string[] = []
	for (const styleSheet of Array.from(document.styleSheets)) {
		try {
			const rules = Array.from(styleSheet.cssRules)
			for (const rule of rules) chunks.push(rule.cssText)
		} catch {
			// Cross-origin sheets (for example Google Fonts) are intentionally
			// linked separately below and cannot be inspected by the browser.
		}
	}
	return chunks.join('\n')
}

export const exportLinkedHtml = async (documents: ExportDocumentT[], settings: PreviewSettingsT): Promise<string> => {
	const rootDocument = documents[0]
	if (rootDocument === undefined) throw new Error('No documents were supplied for export')

	const documentsById = new Map<string, ExportDocumentT>()
	for (const document of documents) documentsById.set(document.id, document)

	const renderedDocuments: Record<string, RenderedExportDocumentT> = {}
	for (const document of documents) renderedDocuments[document.path] = await renderExportDocument(document, documentsById)

	const serializedDocuments = serializeForScript(renderedDocuments)
	const serializedRootPath = serializeForScript(rootDocument.path)
	const serializedInitialTheme = serializeForScript(settings.theme)
	const applicationCss = collectApplicationCss()
	const surfaceStyle = buildSurfaceStyle(settings)

	return `<!DOCTYPE html>
<html lang="en" data-preview-theme="${settings.theme}">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <title>${escapeHtml(rootDocument.title)}</title>
  <link rel="preconnect" href="https://fonts.googleapis.com" />
  <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin />
  <link rel="stylesheet" href="https://fonts.googleapis.com/css2?family=DM+Mono:wght@400;500&family=DM+Sans:opsz,wght@9..40,300;9..40,400;9..40,500;9..40,600;9..40,700;9..40,900&display=swap" />
  <style>${applicationCss}</style>
  <style>
    /*
      The application stylesheet paints html from the dark app palette and pins
      html/body to height 100%, so without these the themed background stops at
      the first viewport and the app's dark canvas shows through the rest of the
      page. Carrying data-preview-theme on <html> lets the root read the same
      --bg the document does.
    */
    html[data-preview-theme] { background: var(--bg); height: auto; min-height: 100%; }
    html[data-preview-theme='light'] { color-scheme: light; }
    html[data-preview-theme='dark'] { color-scheme: dark; }
    body { height: auto; min-height: 100vh; background: var(--bg); padding: 3rem clamp(1.5rem, 8vw, 6rem); transition: background-color 0ms; }
    .Prose { max-width: 52rem; margin: 0 auto; padding-bottom: 64px; }
    .zokkuExportToolbar { position: fixed; top: 18px; right: 18px; z-index: 30; }
    .zokkuExportNav { max-width: 52rem; margin: 0 auto 1.5rem; }
    .zokkuBackButton { display: inline-flex; align-items: center; gap: .45rem; border: 0; padding: 0; background: transparent; color: var(--muted); font: inherit; font-size: .875rem; cursor: pointer; }
    .zokkuBackButton:hover { color: var(--primary); }
    .zokkuBackButton[hidden] { display: none; }
    .zokkuMissingDocument { max-width: 52rem; margin: 0 auto; padding: 4rem 0; }
    .zokkuMissingDocument p { color: var(--muted); }
    .zokkuPageContent { opacity: 1; }
    .zokkuPageContent[data-theme-transition="out"] { opacity: 0; transition: opacity 1000ms ease; }
    .zokkuPageContent[data-theme-transition="in"] { opacity: 1; transition: opacity 1500ms ease; }
    .zokkuThemeToggle svg { width: 16px; height: 16px; }
  </style>
</head>
<body class="proseRoot" data-preview-theme="${settings.theme}" data-preview-font="sans" data-preview-scale="compact" style="${surfaceStyle}">
  <div class="zokkuExportToolbar"><button id="zokkuThemeToggle" class="zokkuThemeToggle" type="button" aria-label="Switch theme" title="Switch theme"></button></div>
  <div id="zokkuPageContent" class="zokkuPageContent" data-theme-transition="idle">
    <nav class="zokkuExportNav"><button id="zokkuBackButton" class="zokkuBackButton" type="button" hidden aria-label="Back">← Back</button></nav>
    <main><div id="zokkuContent" class="Prose"></div></main>
  </div>
  <script>
    (() => {
      const documents = ${serializedDocuments};
      const rootPath = ${serializedRootPath};
      const contentElement = document.getElementById('zokkuContent');
      const pageContent = document.getElementById('zokkuPageContent');
      const backButton = document.getElementById('zokkuBackButton');
      const themeToggle = document.getElementById('zokkuThemeToggle');
      const routeHistory = [];
      let currentPath = rootPath;
      let currentTheme = ${serializedInitialTheme};
      let isThemeTransitioning = false;
      const sunIcon = '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round"><circle cx="12" cy="12" r="4"></circle><path d="M12 2v2M12 20v2M4.93 4.93l1.41 1.41M17.66 17.66l1.41 1.41M2 12h2M20 12h2M4.93 19.07l1.41-1.41M17.66 6.34l1.41-1.41"></path></svg>';
      const moonIcon = '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><path d="M20.4 15.4A8 8 0 0 1 8.6 3.6 8.5 8.5 0 1 0 20.4 15.4Z"></path></svg>';
      const updateThemeToggle = () => {
        themeToggle.innerHTML = currentTheme === 'light' ? moonIcon : sunIcon;
        const label = currentTheme === 'light' ? 'Switch to dark theme' : 'Switch to light theme';
        themeToggle.setAttribute('aria-label', label);
        themeToggle.title = label;
      };
      const renderDocument = (path, anchor = '', addToHistory = true) => {
        const nextDocument = documents[path];
        if (!nextDocument) {
          document.title = 'Document not found';
          contentElement.className = 'zokkuMissingDocument';
          contentElement.innerHTML = '<h1>Linked document not found</h1><p>This export does not contain the requested document.</p>';
          return;
        }
        if (addToHistory && path !== currentPath) routeHistory.push(currentPath);
        currentPath = path;
        backButton.hidden = routeHistory.length === 0;
        document.title = nextDocument.title;
        contentElement.className = 'Prose';
        contentElement.innerHTML = nextDocument.html[currentTheme];
        if (!anchor) { window.scrollTo({ top: 0, behavior: 'instant' }); return; }
        requestAnimationFrame(() => document.getElementById(anchor)?.scrollIntoView());
      };
      const switchTheme = () => {
        if (isThemeTransitioning) return;
        isThemeTransitioning = true;
        pageContent.dataset.themeTransition = 'out';
        window.setTimeout(() => {
          currentTheme = currentTheme === 'light' ? 'dark' : 'light';
          document.body.dataset.previewTheme = currentTheme;
          document.documentElement.dataset.previewTheme = currentTheme;
          renderDocument(currentPath, '', false);
          updateThemeToggle();
          pageContent.dataset.themeTransition = 'in';
          window.setTimeout(() => { pageContent.dataset.themeTransition = 'idle'; isThemeTransitioning = false; }, 500);
        }, 300);
      };
      contentElement.addEventListener('click', (event) => {
        const target = event.target;
        if (!(target instanceof Element)) return;
        const link = target.closest('a[data-zokku-document-path]');
        if (!(link instanceof HTMLAnchorElement)) return;
        event.preventDefault();
        const path = link.dataset.zokkuDocumentPath;
        if (!path) return;
        renderDocument(path, link.dataset.zokkuAnchor || '');
      });
      backButton.addEventListener('click', () => {
        const previousPath = routeHistory.pop();
        if (!previousPath) return;
        renderDocument(previousPath, '', false);
      });
      themeToggle.addEventListener('click', switchTheme);
      updateThemeToggle();
      renderDocument(rootPath, '', false);
    })();
  </script>
</body>
</html>`
}
