export const WORKSPACE_GUIDE_FILENAME = 'Zokku Guide.md'

export const workspaceGuideMarkdown = `# Welcome to Zokku

This workspace is backed directly by this folder on your computer. Every document you create in Zokku is a normal Markdown file, so your content stays portable and readable outside the app.

> [!TIP]
> Keep this guide around as a quick reference. You can edit it, move it into a folder, or delete it whenever you no longer need it.

## Standard Markdown refresher

### Headings

Use one to six hash characters:

\`\`\`md
# Heading 1
## Heading 2
### Heading 3
#### Heading 4
##### Heading 5
###### Heading 6
\`\`\`

### Emphasis

\`\`\`md
**bold**
*italic*
~~strikethrough~~
\`inline code\`
\`\`\`

### Lists

\`\`\`md
- First item
- Second item
  - Nested item

1. First step
2. Second step
\`\`\`

### Task lists

\`\`\`md
- [ ] Not finished
- [x] Finished
\`\`\`

### Links

\`\`\`md
[OpenAI](https://openai.com)
\`\`\`

To link to another Zokku document, use a normal Markdown link to its local Markdown path:

\`\`\`md
[Architecture notes](</Work/architecture-notes.md>)
\`\`\`

Zokku understands these links in preview and bundles linked documents into self-contained HTML exports.

### Images

\`\`\`md
![Alt text](https://example.com/image.png)
\`\`\`

You can also paste or drag images into the editor and let Zokku insert them for you.

### Inline icons

Zokku can render an inline icon from the MingCute collection in Iconify. Use \`:icon[name]:\`, where the icon name is written in lowercase hyphenated form.

\`\`\`md
Continue :icon[arrow-right-line]:
Saved :icon[check-circle-line]: successfully.
\`\`\`

Use inline icons sparingly when a small visual cue makes a label or sentence easier to scan. The collection is intentionally restricted to MingCute so documents keep a consistent icon style. Invalid names render as a warning-colored question icon.

### Inline separators

Use \`:separator:\` between short pieces of inline content when you want a subtle one-pixel vertical hairline.

\`\`\`md
Design :separator: Engineering :separator: Product
\`\`\`

Use separators for compact metadata, labels, or short navigation-like rows. Do not use them as a replacement for normal sentence punctuation.

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

Use fenced code blocks and optionally add a language for syntax highlighting:

\`\`\`md
\`\`\`ts
const greeting = 'hello'
\`\`\`
\`\`\`

You can also include a filename in the fence metadata:

\`\`\`md
\`\`\`ts filename=example.ts
export const value = 42
\`\`\`
\`\`\`

## Zokku custom blocks

Zokku extensions use the same blockquote-style callout syntax familiar from GitHub and Obsidian. Each custom block starts with \`> [!TYPE]\` followed by its content.

### Eyebrow

Use an eyebrow immediately above a heading when you want a compact category, section label, or product-area identifier. A standard eyebrow ends with an 80px hairline rule.

\`\`\`md
> [!EYEBROW]
> PRODUCT STRATEGY

## Where we are going
\`\`\`

Use the \`FULL\` variant when the rule should consume all remaining horizontal space after the label, with a 16px gap:

\`\`\`md
> [!EYEBROW FULL]
> PRODUCT STRATEGY
\`\`\`

### Subheading

Use a subheading to introduce a section with more weight than an eyebrow but without adding another level to the document's semantic heading hierarchy.

\`\`\`md
> [!SUBHEADING]
> What changed this quarter
\`\`\`

### Note

Use a note for supporting context that is useful but not urgent or action-oriented.

\`\`\`md
> [!NOTE]
> This behavior only applies to local workspaces.
\`\`\`

### Tip

Use a tip for recommendations, shortcuts, best practices, or something that helps the reader work more effectively.

\`\`\`md
> [!TIP]
> Use document links instead of duplicating the same explanation in multiple files.
\`\`\`

### Warning

Use a warning when the reader should slow down because an action could cause a mistake, data loss, or an unexpected result.

\`\`\`md
> [!WARNING]
> Renaming a document also renames the underlying Markdown file.
\`\`\`

### Important

Use important for information the reader should not miss, especially when it affects a decision or the interpretation of the surrounding section.

\`\`\`md
> [!IMPORTANT]
> Exported HTML includes linked documents only when Zokku can resolve their local links.
\`\`\`

### Big

Use big text for a short statement that deserves more visual weight than body copy but should not become part of the document heading hierarchy.

\`\`\`md
> [!BIG]
> One workspace. Plain Markdown. No backend required.
\`\`\`

### Small

Use small text for supporting detail, secondary explanations, disclaimers, or low-priority context that still needs to read like prose.

\`\`\`md
> [!SMALL]
> This setting is stored only in your browser.
\`\`\`

### Muted

Use muted text when the normal body size is appropriate but the content should have less visual emphasis.

\`\`\`md
> [!MUTED]
> Last reviewed on August 17.
\`\`\`

### Center

Use center for short standalone content that benefits from centered presentation. Avoid it for long paragraphs because centered body copy is harder to read.

\`\`\`md
> [!CENTER]
> End of report
\`\`\`

### Caption

Use caption for compact metadata or explanatory text tied to an image, table, example, or other nearby piece of content.

\`\`\`md
> [!CAPTION]
> Figure 1. Workspace architecture overview.
\`\`\`

### Stats

Use a stat block to make a key number scannable. Bold the value so Zokku can distinguish it from the smaller label.

For a label below the value:

\`\`\`md
> [!STAT]
> **73%**
> Adoption rate
\`\`\`

For a label above the value:

\`\`\`md
> [!STAT TOP]
> Adoption rate
> **73%**
\`\`\`

Stats work best for concise metrics such as percentages, counts, currency values, durations, or scores rather than long prose.

### Todo

Use todo for an author-facing reminder that is useful while drafting but should not appear in exported HTML.

\`\`\`md
> [!TODO]
> Add the final migration timeline before publishing.
\`\`\`

## A good default structure

A clean Zokku document often looks something like this:

\`\`\`md
> [!EYEBROW FULL]
> PROJECT BRIEF

# Local-first workspace :icon[folder-open-line]:

A short introduction to the document.

Product :separator: Design :separator: Engineering

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

---

That is enough to get started. Zokku intentionally stays close to normal Markdown, so most Markdown knowledge transfers directly.
`
