export const WORKSPACE_GUIDE_FILENAME = 'Zokku Guide.md'

export const workspaceGuideMarkdown = `# Zokku Guide

Zokku is a local-first Markdown workspace. Your workspace is an ordinary folder on disk and your documents are ordinary Markdown files.

> [!TIP]
> Keep this file as a reference while learning Zokku. It is a normal document, so you can edit, move, rename, or delete it.

## Zokku custom syntax

Zokku's block extensions use familiar callout syntax: start a block with \`> [!TYPE]\`, then put its content on quoted lines below it.

### Eyebrow

Use an eyebrow immediately above a heading for a compact category or section label. The normal form includes an 80px hairline rule.

\`\`\`md
> [!EYEBROW]
> PRODUCT STRATEGY

## Where we are going
\`\`\`

Use \`FULL\` to let the rule fill the remaining width after a 16px gap.

\`\`\`md
> [!EYEBROW FULL]
> PRODUCT STRATEGY
\`\`\`

### Subheading

Use a subheading to introduce a section with more weight than an eyebrow without adding another semantic heading level.

\`\`\`md
> [!SUBHEADING]
> What changed this quarter
\`\`\`

### Note, tip, warning, and important

Use **note** for useful supporting context, **tip** for advice or shortcuts, **warning** for something that could cause a mistake, and **important** for information the reader should not miss.

\`\`\`md
> [!NOTE]
> This behavior only applies to local workspaces.

> [!TIP]
> Link related documents instead of duplicating content.

> [!WARNING]
> Renaming a document also renames its Markdown file.

> [!IMPORTANT]
> The workspace folder is the source of truth.
\`\`\`

### Big, small, muted, caption, and center

Use **big** for a short high-emphasis statement, **small** for secondary prose, **muted** for normal-sized low-emphasis text, **caption** for compact metadata, and **center** for short standalone content that benefits from centered presentation.

\`\`\`md
> [!BIG]
> One workspace. Plain Markdown.

> [!SMALL]
> A secondary explanation.

> [!MUTED]
> Last reviewed August 17.

> [!CAPTION]
> Figure 1. Workspace architecture.

> [!CENTER]
> End of report
\`\`\`

### Stats

Use a stat block for a concise metric. Bold the value; the other line becomes its label.

\`\`\`md
> [!STAT]
> **73%**
> Adoption rate

> [!STAT TOP]
> Adoption rate
> **73%**
\`\`\`

### Todo

Use todo for an author-only drafting reminder. TODO blocks are removed from exported HTML.

\`\`\`md
> [!TODO]
> Add the final migration timeline.
\`\`\`

## Working in Zokku

### Create or switch a workspace

A workspace is a folder on your computer. From the Workspaces view, choose a folder to create/add a workspace. Inside a workspace, use the **← Workspaces** control in the left rail to return to the workspace grid and switch to another one. Zokku does not move your files into a backend; the selected folder remains the source of truth.

### Create folders

Use the folder-plus control beside **Folders** in the left rail. Give the folder a name and optional description. Selecting a folder scopes the document grid to that folder.

### Create documents

Use **New document**, or select a folder first and create a document there. New documents are Markdown files inside the workspace. You can also add \`.md\` files directly on disk and Zokku will read them.

### Change a document title

Edit the title directly in the editor's top bar. Zokku autosaves your work. Changing the title can rename the underlying Markdown file to match it.

### Preview

The editor shows a live rendered preview beside your Markdown. Use the external-preview icon to open the document in the dedicated preview view. Local links to other Zokku documents navigate within the workspace.

### Preview settings

Use the sliders icon in the preview toolbar. You can choose **Dark** or **Light** and adjust the base reading size. New settings start at **20px**. Zokku intentionally uses its sans-serif typeface and compact type scale for a consistent document system, so font family and type scale are not configurable.

The sun/moon control switches themes directly. Theme changes fade the document content out, switch the theme, and fade it back in.

### Export HTML

Use the export icon in the editor to create a self-contained HTML document. Zokku resolves linked local documents and bundles them into the export, so those links route inside the exported file rather than opening Markdown files on the original computer. Exported documents also include the light/dark theme switcher. Author-only TODO blocks are omitted.

### Link to another document

Use a normal Markdown link to the other document's local Markdown path. The document card's copy-link action can create the correct Zokku link for you.

\`\`\`md
[Architecture notes](</Work/architecture-notes.md>)
\`\`\`

## Markdown refresher

Zokku stays close to standard Markdown. These features work normally.

### Headings

\`\`\`md
# Heading 1
## Heading 2
### Heading 3
#### Heading 4
##### Heading 5
###### Heading 6
\`\`\`

Use heading levels semantically: H1 for the document title, H2 for major sections, then descend through H3-H6 for nested sections.

### Emphasis and inline code

\`\`\`md
**bold**
*italic*
~~strikethrough~~
\`inline code\`
\`\`\`

### Lists and task lists

\`\`\`md
- First item
- Second item
  - Nested item

1. First step
2. Second step

- [ ] Not finished
- [x] Finished
\`\`\`

### Links

\`\`\`md
[OpenAI](https://openai.com)
\`\`\`

### Images and media

\`\`\`md
![Alt text](https://example.com/image.png)
\`\`\`

You can also paste or drag media into the editor and let Zokku insert it.

### Blockquotes

\`\`\`md
> A normal Markdown quotation.
\`\`\`

### Horizontal rules

\`\`\`md
---
\`\`\`

### Tables

\`\`\`md
| Name | Status | Owner |
| --- | --- | --- |
| Zokku | Active | You |
| Notes | Draft | Team |
\`\`\`

### Code blocks

Use fenced code blocks and optionally name the language for syntax highlighting.

\`\`\`md
\`\`\`ts
const greeting = 'hello'
\`\`\`
\`\`\`

Add a filename when useful:

\`\`\`md
\`\`\`ts filename=example.ts
export const value = 42
\`\`\`
\`\`\`

## Example document

\`\`\`md
> [!EYEBROW FULL]
> PROJECT BRIEF

# Local-first workspace

A short introduction to the document.

Product · Design · Engineering

> [!IMPORTANT]
> The workspace folder is the source of truth.

> [!SUBHEADING]
> Current adoption

> [!STAT]
> **73%**
> Adoption rate

## Goals

- Keep files portable
- Keep editing fast
- Make exports self-contained

| Area | Decision |
| --- | --- |
| Storage | Local filesystem |
| Format | Markdown |
| Export | Single HTML file |

> [!TODO]
> Add rollout details.
\`\`\`
`
