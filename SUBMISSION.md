# Submission: Full Stack Product Engineer (Ajaia LLC)

## Links
- **Google Drive folder:** _TODO_
- **Live product URL:** _TODO_
- **Walkthrough video:** in `VIDEO_URL.txt`

## Credentials / seeded test accounts
No passwords. Pick a user on the sign-in page, and use **Switch user** to change users.

| Email | Purpose |
| --- | --- |
| `alice@ajaia.test` | Owner of the seeded document; manages its sharing |
| `bob@ajaia.test` | Editor on Alice's document (can edit) |
| `erin@ajaia.test` | Commenter on Alice's document (can comment, not edit) |
| `dave@ajaia.test` | Viewer on Alice's document (read-only) |
| `carol@ajaia.test` | Outsider (no access) |

## What is included

| Item | Location |
| --- | --- |
| Source code | `src/`, `prisma/`, `tests/`, `scripts/`, plus config files (`package.json`, `package-lock.json`, `tsconfig.json`, `next.config.ts`, `vitest.config.ts`, `eslint.config.mjs`, `postcss.config.mjs`, `docker-compose.yml`, `.env.example`) |
| README with local setup and run instructions | `README.md` |
| Architecture note | `ARCHITECTURE.md` |
| AI workflow note | `AI_WORKFLOW.md` |
| This file | `SUBMISSION.md` |
| Live product URL | Listed above and in `README.md` |
| Walkthrough video URL | `VIDEO_URL.txt` |
| Screenshots / demo GIF | Not included: the live URL needs no setup, and local setup is fully scripted in `README.md` |

Not included: `node_modules/`, `.next/`, `.next-smoke/`, `public/mathlive/` (copied from `node_modules` on install) and `.env`. These are generated or local-only.

## How to run locally
See **Local setup and run instructions** in `README.md`. In short: `npm install`, `cp .env.example .env`, `docker compose up -d`, `npx prisma migrate dev`, `npm run db:seed`, `npm run dev`.

## Status

### What is working (end to end)
- Create, rename, edit, autosave, reopen and delete documents.
- Rich text:
  - bold, italic, underline, strikethrough
  - H1–H4
  - bulleted, numbered and task lists
  - quote, divider, code block
  - links
  - tables
  - inline, block and chemical equations
  - emoji
  - image upload with width control
  - undo/redo
- File upload: `.txt`, `.md` or `.docx` (max 2 MB) becomes a new editable document. Images in `.docx` files and math in `.md` files are kept. Images can also be uploaded into a document (PNG, JPEG, GIF, WebP).
- Sharing with Google Docs–style roles:
  - The owner adds people as **Viewer** or **Editor**, changes roles and removes access from the Share dialog.
  - **General access** can be set to **Restricted** or **Anyone with the link** (as Viewer, Commenter or Editor), and **Copy link** shares the URL.
  - Editors can edit. Viewers get a read-only document.
  - All rules are enforced on the server.
  - The dashboard shows owned and shared documents separately, with your role on each shared document.
- Google Docs–style editor:
  - **Menu bar:** File, Edit, View, Insert, Format, Tools, Help.
  - **Toolbar:** styles (Title, Subtitle, H1–H6), fonts and sizes, text and highlight colour, alignment, line spacing, indent, paint format, zoom, clear formatting.
  - **Document tools:** find and replace, word count, outline, keyboard shortcuts, Editing/Viewing mode.
- **Comments:** threads, replies, resolve and reopen.
- **Several editors at once:** other people's saved changes appear live without a reload, and a stale save is blocked with **Load latest version** / **Keep my version** instead of silently overwriting.
- **Make a copy**, and **Download** as .html, .md, .txt or PDF (via print).
- **Sharing:**
  - Commenter role
  - "Editors can change permissions and share" and "Viewers and commenters can download, print, and copy" settings
  - Transfer ownership
- Dashboard search, owner filter and sort.
- Persistence in PostgreSQL across refreshes and users.
- Validation and error handling throughout.
- 26 automated tests.

### What is incomplete
- Character-level real-time co-editing (changes sync by polling every 3 seconds; simultaneous edits conflict instead of merging).
- Real authentication (auth is mocked with seeded users).
- Suggesting mode, headers/footers, page setup and .docx download.
- Anonymous (signed-out) link access.
- Notification emails.

### What I would build next with another 2–4 hours
1. Live co-editing with Yjs and WebSockets.
2. API integration tests against a test database.
3. Suggesting mode.
4. .docx download.
