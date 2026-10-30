# Architecture Note

## Overview

| Layer | Choice | Why |
| --- | --- | --- |
| Frontend | Next.js 15 (App Router), React 19, TypeScript, Tailwind CSS | One codebase and one deployment for UI and API |
| Editor | TipTap 3 (ProseMirror) + KaTeX + MathLive | Required formatting plus tables, task lists, links, images and equations as schema-validated nodes, without hand-building `contentEditable` |
| Backend | Next.js route handlers on Node.js (`src/app/api`) | REST endpoints next to the UI, with no separate server to deploy |
| Persistence | PostgreSQL + Prisma | Relational data (owners, shares) fits SQL. Free hosting on Neon, Docker locally |
| Validation / tests | Zod, Vitest | Typed input validation and fast unit tests |
| Deployment | Vercel + Neon | Free for reviewers, with a single build step that also migrates and seeds the database |

**Data model:** `User` 1→N `Document` (owner). `Document` N↔N `User` through `DocumentShare`, which is unique per document/user pair and carries a `role` (`viewer` | `commenter` | `editor`). `Document` stores General access (`linkAccess`, `linkRole`) and the two share settings (`editorsCanShare`, `viewersCanCopy`). `Document` 1→N `Image`, `Comment` (threads, with replies via `parentId`). `Document.revision` counts saves and `lastEditedById` records who saved last; both drive the conflict check below. Document content is stored as HTML produced by the editor.

**API:**
- `GET/POST /api/documents`
- `GET/PATCH/DELETE /api/documents/:id` (PATCH requires `baseRevision`; a stale one returns 409)
- `GET /api/documents/:id/sync?revision=N` (polled by open editors; returns the latest content only when it changed)
- `POST /api/documents/import`
- `POST /api/documents/:id/images`
- `GET /api/images/:imageId`
- `POST /api/documents/:id/shares`
- `PATCH/DELETE /api/documents/:id/shares/:userId` (change role, remove access)
- `PATCH /api/documents/:id/access` (General access; share settings are owner-only)
- `POST /api/documents/:id/owner` (transfer ownership)
- `POST /api/documents/:id/copy` (Make a copy)
- `GET/POST /api/documents/:id/comments`, `PATCH/DELETE /api/documents/:id/comments/:commentId`
- `POST/DELETE /api/session`

## What I prioritised and why

1. **A reliable core editing loop.** Create, rename, edit, autosave and reopen is the product's main job, so it got the most care:
   - Saves are debounced and run one at a time, so an older save can never overwrite a newer one.
   - Failed saves are kept and can be retried.
   - The browser warns before you leave with unsaved changes.
   - Each save carries the revision it was based on and is applied with a conditional update (`WHERE revision = baseRevision`). If another person saved in between, the server returns 409 and the editor shows **Load latest version** / **Keep my version** instead of overwriting their work.
   - Open documents poll every 3 seconds. When the tab has no unsaved changes, newer content is applied to the editor in place (React state and the TipTap document are updated, no page reload) and the cursor is kept where it was.
   - Saving, polling and conflict handling live in one hook (`useDocumentSync`), so the editor component only renders state.
2. **Sharing that is correct and visible, modelled on Google Docs.**
   - There are four roles: owner, editor, commenter and viewer.
   - The Share dialog lets the owner add people with a role, change roles inline, remove access, and set General access: Restricted, or Anyone with the link as Viewer, Commenter or Editor.
   - A person gets the stronger of their own role and the link role.
   - Link access never grants management.
   - Permission rules live in one pure module (`src/lib/access.ts`), and one function (`loadDocument`) enforces them for every page and API route (view, edit or manage).
   - The server enforces every rule, so a viewer's edit request is rejected even if the UI is bypassed.
   - Documents a user cannot access return 404, so document ids can't be probed.
   - The UI always shows whether a document is owned or shared, and with which role.
   - Role-based sharing is one of the brief's optional stretch items. I took it on because it is central to how a docs product is actually used.
3. **A complete editing toolbar.** Beyond the required formatting, the editor covers what people use in real documents:
   - strikethrough, H1–H4, task lists, quotes, dividers, code blocks
   - links, tables, equations (including chemical equations), emoji, and images with adjustable width

   Each is a TipTap extension, so the editor's schema validates content no matter where it came from.
4. **Product-relevant file upload.** Importing `.txt`, `.md` or `.docx` as a new document is the most useful flow for a docs product:
   - Markdown and Word formatting carry over.
   - Images inside `.docx` files are saved as document images.
   - Math in `.md` files becomes equations.
   - The import runs in a database transaction, so a failed import leaves nothing behind.
   - Supported types are stated in the UI and README.
5. **Formatting preserved safely.** Content is stored as HTML because every import source converts to it cleanly. Stored HTML is never injected directly into the page. It is always parsed through the editor schema, which drops unknown tags and scripts.
   - Links reject `javascript:` URLs.
   - KaTeX runs with `trust` off.
   - Uploaded images are checked by their file signature, so SVG is refused.
   - Images are only served to users who can view their document.
6. **A testable, free deployment.** Seeded users and mocked auth let reviewers check the sharing flow in seconds, without sign-up.
   - Images are stored in Postgres rather than an object store, so the deployment needs no extra service.
   - MathLive fonts are served from the app itself.

7. **Google Docs parity where it is most visible.** The menu bar, toolbar order, styles, fonts, colours, comments, find and replace, outline, word count and the Share dialog all follow Google Docs:
   - so reviewers already know how to use it
   - every action is hidden for roles that can't use it, and the server enforces it as well
   - comments store the text they were made on instead of marks in the document, so commenters can comment without being able to edit

## What I intentionally deprioritised

- **True real-time co-editing.** Changes appear within about 3 seconds through polling, and conflicting saves are blocked rather than lost. Two people typing at the same moment are not merged character by character; that needs a CRDT such as Yjs over WebSockets, which is more than this time box allows.
- **Version history.** Left out to keep scope to the brief.
- **Real authentication.** Mocked auth (an httpOnly cookie holding a seeded user id) demonstrates ownership and sharing but is not secure authentication.
- **Google Docs features left out:**
  - **Suggesting mode** (tracked changes)
  - **Headers, footers, page numbers, footnotes and a table of contents**
  - **Page setup:** pages are always US Letter with 1in margins
  - **.docx/.odt download:** Download offers HTML, Markdown, plain text and PDF (via print)
  - **Sharing extras:** anonymous (signed-out) link access ("anyone" means anyone signed in), notification emails, and an ownership-transfer acceptance step
  - **@mentions and assigning comments**
- **Importing into an existing document.** Import always creates a new document.
- **Image clean-up.** An image removed from a document stays stored until the document is deleted.
- **Offline emoji data.** The emoji picker loads its emoji list from the jsDelivr CDN.

## What I would build next with another 2–4 hours

1. **Live co-editing:** replace polling and whole-document saves with Yjs over a WebSocket, with live cursors.
2. **Automated browser tests** in the repo (Playwright) for the menus, toolbar, comments and sharing. These were checked with scripted headless Chrome runs during development but aren't committed yet. Plus API integration tests against a test database.
3. **Suggesting mode**, building on the comment threads.
4. **.docx download.**
