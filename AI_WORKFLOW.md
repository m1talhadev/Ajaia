# AI Workflow Note

> **TODO (candidate):** review this note and rewrite it in your own words before submitting. Each section must describe what you actually did.

## Which AI tools I used

- **Claude Code** (Anthropic's CLI coding agent): planning, scaffolding, implementation, tests, verification and documentation drafts.

## Where AI materially sped up my work

- Reading the assignment brief and turning it into a scoped plan and stack choice.
- Scaffolding the Next.js, Prisma and TipTap setup, the database schema, seed data, the API route handlers and the UI components.
- Building the full editor toolbar: tables, task lists, links, equations with MathLive and KaTeX, emoji and images, as custom TipTap extensions.
- Writing the unit tests, and a scripted end-to-end check of the sharing rules across three users.
- Drafting the README, architecture note and submission documents.

## What AI-generated output I changed or rejected

- **Next.js version:** the scaffold installed Next.js 15.5.4, which has a published security advisory (CVE-2025-66478). I upgraded to the patched 15.5.28.
- **`@tiptap/html`:** removed, because it pulls in a vulnerable `happy-dom` package. HTML is instead handled by the editor in the browser.
- **Prisma version:** the npm "latest" tag pointed at a Prisma 8 release candidate. I rejected it and pinned stable Prisma 6.
- **`npm audit fix --force`:** rejected, because it would have forced breaking major upgrades. The remaining advisories are in build-time or development tooling only.
- **Chemical equation arrows:** a test I added caught a regex bug. `\b` does not match between `\longrightarrow` and a digit, so `A\longrightarrow2B` kept the raw LaTeX arrow. I changed the pattern to "not followed by a letter".
- **Image uploads:** I didn't trust the browser-supplied MIME type. Uploads are checked by file signature, and SVG is refused because it can carry script.
- **Separate build folder:** a production build overwrote the `.next` folder used by a running dev server. Builds can now go to a separate folder (`NEXT_DIST_DIR`).
- **Database port:** a Postgres instance was already running on port 5432, so the project uses its own container on 5433 instead of sharing it.
- _TODO (candidate): add any changes you made after reviewing the code or the UI._

## How I verified correctness, UX quality and implementation reliability

**Correctness**
- `npm test`: 26 automated tests covering:
  - the permission rules
  - file-import conversion
  - image type detection
  - math handling
- A scripted end-to-end check against the production build, signed in as Alice (owner), Bob (editor), Dave (viewer) and Carol (no access), confirmed:
  - signed-out requests are rejected
  - the owner, editor, viewer and outsider each get the right access
  - a viewer cannot edit, rename, upload images or change any role
  - promoting or demoting someone takes effect on their next request
  - invalid roles are rejected
  - General access:
    - a restricted document is hidden from outsiders
    - "Anyone with the link" as Viewer gives read-only access, and as Editor gives edit access but never sharing or delete rights
    - switching back to Restricted removes link access while added people keep theirs
    - signed-out visitors are sent to sign-in and returned to the document, and off-site `next` redirects are ignored
  - an outsider gets a 404
  - duplicate and invalid shares are rejected
  - an editor cannot share, change roles or delete
  - input validation errors are returned
  - supported imports work and unsupported file types are rejected
  - image uploads and downloads respect sharing; SVG disguised as PNG is rejected
  - a `.docx` with an embedded image imports the image, and a corrupt `.docx` leaves no partial document
  - Markdown math imports as equation nodes

- Scripted browser checks (headless Chrome via Playwright) against the production build cover:
  - **Editing:** styles, fonts, colours, alignment, spacing, superscript, indent.
  - **Document tools:** find and replace, word count, outline, zoom, Markdown and HTML download, Make a copy.
  - **Content:** equations, tables, emoji, links.
  - **Comments**, including a commenter replying.
  - **Sharing:** the dialog, share settings, and link access for signed-out visitors.
  - **Results:** 28 checks, 0 browser errors.
- These checks caught real bugs:
  - A MathLive option set before the field was on the page crashed the math dialog.
  - Lazy-loaded editors crashed the page when a stale tab couldn't load them.

**Implementation reliability**
- TypeScript type-check, ESLint and `next build` all pass with no errors.
- Dependency audit reviewed. Vulnerable versions were upgraded or removed as listed above.

**UX quality**
- _TODO (candidate): describe your manual browser checks, e.g.:_
  - _each toolbar feature, including tables, equations, emoji and image upload_
  - _autosave status and refresh persistence_
  - _import of each file type_
  - _the sharing flow across two users_
  - _error messages_
