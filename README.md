# Ajaia Docs: Lightweight Collaborative Document Editor

A full-stack document editor modelled on Google Docs. Users can:
- create and format rich-text documents on a page-style editor
- import and download files
- comment on documents
- see other people's saved changes live, without reloading
- share with Google Docs–style roles and link access

- **Live product URL:** _TODO: add deployment URL_
- **Walkthrough video:** see `VIDEO_URL.txt`

## Test accounts (for reviewing sharing)

Authentication is mocked with seeded users. There are no passwords: pick a user on the sign-in page, and use **Switch user** in the top bar to change users.

| User | Email | Role in the demo |
| --- | --- | --- |
| Alice Owner | `alice@ajaia.test` | Owns the seeded "Welcome to Ajaia Docs" document and manages its sharing |
| Bob Collaborator | `bob@ajaia.test` | **Editor** on Alice's document: can view, comment and edit (and share, while the owner allows it) |
| Erin Commenter | `erin@ajaia.test` | **Commenter** on Alice's document: can view and comment, but not edit |
| Dave Viewer | `dave@ajaia.test` | **Viewer** on Alice's document: read-only, no comments |
| Carol Outsider | `carol@ajaia.test` | Has no access to Alice's document |

**Sharing flow to review:**
1. Sign in as **Alice** and create a document.
2. Click **Share**. Add `bob@ajaia.test` as **Editor**, `erin@ajaia.test` as **Commenter** and `dave@ajaia.test` as **Viewer**.
3. Click **Switch user** and sign in as **Bob**. The document appears under **Shared with me** with an "Editor" badge, and Bob can edit it.
4. Sign in as **Erin**. The document shows "Comment only". Select text, click **Add comment** and post a comment; Erin can't change the text.
5. Sign in as **Dave**. The document shows "View only": no editing toolbar, no comments, and the title and content are read-only.
6. Back as **Alice**, open **Share** and change Dave's role to **Editor** from the dropdown, or choose **Remove access**. The change applies on Dave's next page load.
7. Sign in as **Carol**. The document is not listed, and opening its URL shows "Document not found".
8. Back as **Alice**, open **Share** and set **General access** to **Anyone with the link**, as **Viewer** or **Editor**. Click **Copy link**.
9. Sign in as **Carol** and open the copied link. Carol can now open it with the link's role ("Link shared by Alice · Viewer"). Switch General access back to **Restricted** and Carol loses access again.
10. As **Alice**, open **Share → ⚙ Settings** and untick "Viewers and commenters can see the option to download, print, and copy". Dave and Erin lose **Download**, **Print** and **Make a copy**, and copying text is blocked.
11. As **Alice**, choose **Transfer ownership** in Bob's dropdown. Bob becomes the owner and Alice becomes an editor.

## Core capabilities

### 1. Document creation and editing
- Create a new document (**New document**, or **File → New document**).
- Rename a document by clicking its title (or **File → Rename**).
- Edit content in the browser on a Letter-size page, Google Docs style. Changes autosave, and the status shows *Saving… / All changes saved*.
- Save and reopen documents from the dashboard.
- The dashboard has search, an "Owned by" filter (anyone / me / not me) and sorting.

**Menu bar.** Items you can't use for your role are hidden.

| Menu | Items |
| --- | --- |
| File | New document, Open, Import, Make a copy (optionally "Share it with the same people"), Share (Share with others, Copy link), Download (.html, .md, .txt, PDF), Rename, Delete, Print |
| Edit | Undo, Redo, Cut, Copy, Paste, Select all, Delete, Find and replace |
| View | Mode (Editing / Viewing), Show outline, Show word count, Zoom (50–200%), Full screen |
| Insert | Image, Table (size grid), Equation (inline, block, chemical), Emoji, Horizontal line, Code block, Quote, Link, Comment |
| Format | Text (bold, italic, underline, strikethrough, superscript, subscript, code, font size up/down), Paragraph styles, Align & indent, Line & paragraph spacing, Bullets & numbering, Table (insert/delete rows and columns, merge/unmerge cells, header row), Clear formatting |
| Tools | Word count (with "Display word count while typing") |
| Help | Keyboard shortcuts |

**Toolbar**, in Google Docs order:
- **History and view:** undo, redo, print, paint format, zoom.
- **Styles:** Normal text, Title, Subtitle, Heading 1–6. As in Google Docs, applying a style to a paragraph resets its font size and font; bold, italic, colour and links are kept.
- **Font:** font family (Arial, Georgia, Times New Roman…) and font size with −/+.
- **Text:** bold, italic, underline, strikethrough, text color and highlight color (Google's palette).
- **Insert:** link, comment, image.
- **Paragraph:** alignment (left, center, right, justify), line spacing (Single, 1.15, 1.5, Double), checklist, bulleted and numbered lists, decrease/increase indent, clear formatting.
- **Blocks:** quote, code block, horizontal line, table, equation, emoji.
- **Mode switch:** Editing or Viewing.

**Content details:**

| Feature | Details |
| --- | --- |
| Links | Dialog for link text and URL (edit or remove), auto-link while typing, link on paste. `javascript:` URLs are blocked |
| Tables | Resizable columns; a table toolbar appears inside a table; Backspace in an empty table removes it |
| Equations | Inline and block equations plus chemical equations (mhchem), written in a visual editor (MathLive) and rendered with KaTeX. Click an equation to edit it |
| Images | Upload PNG, JPEG, GIF or WebP (max 2 MB; photos over 1 MB are compressed in the browser), with width presets |
| Find and replace | Highlights every match, steps through them, Match case, Replace or Replace all |
| Comments | Select text and click **Add comment**. Threads appear in the right margin with replies, Resolve/Reopen, Delete and "Show resolved". The commented text is highlighted, and clicking it opens its thread |
| Outline | Titles and headings in a side panel; click to jump |
| Word count | Words, characters, characters excluding spaces, for the selection or the whole document |
| Print / PDF | Print-friendly layout; choose "Save as PDF" in the print dialog |

**Keyboard shortcuts** follow Google Docs: Ctrl+B/I/U, Alt+Shift+5, Ctrl+. and Ctrl+,, Ctrl+Shift+. and Ctrl+Shift+, (font size), Ctrl+Alt+0–6 (styles), Ctrl+Shift+L/E/R/J (align), Ctrl+Shift+7/8/9 (lists), Ctrl+[ and Ctrl+] (indent), Ctrl+\ (clear formatting), Ctrl+K (link), Ctrl+Alt+M (comment), Ctrl+H or Ctrl+F (find), Ctrl+P (print), Ctrl+Shift+C (word count) and Ctrl+/ (shortcut list).

### 2. File upload
- Upload a file to turn it into a **new editable document** (**Import file** on the dashboard).
- **Supported file types: `.txt`, `.md`, `.docx` only. Maximum size 2 MB.** This is also stated in the UI next to the Import button.
- Formatting is preserved. Markdown and Word headings, emphasis and lists carry over. **Images embedded in `.docx` files** are imported, and **math in `.md` files** (`$...$` and ```` ```math ```` blocks) becomes editable equations.
- Any other file type is rejected with an error message.
- Images can also be uploaded straight into a document from the editor toolbar.
- **File → Import** in the editor does the same as the dashboard's **Import file**.

### 3. Sharing
Sharing works like Google Docs, with four roles:

| Role | View | Comment | Edit and rename | Share and change roles | Change share settings, transfer ownership, delete |
| --- | --- | --- | --- | --- | --- |
| **Owner** (creator) | ✓ | ✓ | ✓ | ✓ | ✓ |
| **Editor** | ✓ | ✓ | ✓ | ✓ if "Editors can change permissions and share" is on | — |
| **Commenter** | ✓ | ✓ | — | — | — |
| **Viewer** | ✓ | — | — | — | — |

**The Share dialog:**
- **Add people:** enter an email and choose **Viewer**, **Commenter** or **Editor** (Editor is the default).
- **People with access:** change anyone's role, **Remove access**, or (owner only, for editors) **Transfer ownership**. The previous owner stays on as an editor.
- **General access:**
  - **Restricted** (default): only people added can open the document.
  - **Anyone with the link**, as **Viewer**, **Commenter** or **Editor**.
- **Copy link.**
- **⚙ Settings** (owner only), both on by default as in Google Docs:
  - **Editors can change permissions and share.**
  - **Viewers and commenters can see the option to download, print, and copy.** When it's off, they lose Download, Print and Make a copy, and copying text is blocked. The server also refuses their copy requests.

**How access works:**
- A person gets the **stronger** of their own role and the link role.
- Link access never grants share settings, ownership or delete.
- People who open a link-shared document see "Link shared by <owner>" and don't get it under **Shared with me**.
- If you're signed out when you open a link, you sign in and come straight back to the document.
- Because auth is mocked, "anyone" means anyone signed in to the app.

**What each role sees:**
- **Commenters** see "Comment only": the document is read-only, but **Add comment** and the comment margin work.
- **Viewers** see "View only" with no comments.
- Every rule is enforced on the server, not just hidden in the UI.
- The dashboard separates **My documents** from **Shared with me**, and shows your role on each shared document.

### 4. Persistence
- Documents, formatting, sharing data, uploaded images and comments are stored in **PostgreSQL** through Prisma.
- **Several people in one document:** an open document checks for changes every 3 seconds. When someone else saves, their changes appear in place without a page reload, and a notice says who edited it.
- **No silent overwrites:** every save says which revision it was based on. If someone else saved first, the save is rejected and a banner offers **Load latest version** or **Keep my version**. Changes are not merged character by character as in Google Docs; see ARCHITECTURE.md.
- Images are served only to users who can view the document they belong to.
- Documents remain after a refresh, formatting is preserved (stored as HTML), and shared access works across users and sessions.

### 5. Validation and error handling
- Every API input is validated: empty or too-long titles, invalid email, oversized content, malformed JSON, unsupported or oversized uploads, corrupt `.docx` files.
- Image types are checked from the file contents, not the claimed type. SVG is refused.
- Errors are shown in the UI. A failed save can be retried, and the browser warns before you leave with unsaved changes.
- Comments, version names and share settings are validated too: empty or too-long comments, unknown roles, and ownership transfers to anyone but an existing editor are all rejected.
- Documents a user cannot access return 404.

## Local setup and run instructions

**Prerequisites:** Node.js 20+ and Docker (or any PostgreSQL 14+ instance).

```bash
# 1. Install dependencies
npm install

# 2. Configure environment (default points at the Docker Postgres below)
cp .env.example .env

# 3. Start PostgreSQL (localhost:5433)
docker compose up -d

# 4. Create the database tables
npx prisma migrate dev

# 5. Seed the test accounts and sample document
npm run db:seed

# 6. Start the app
npm run dev
```

Open http://localhost:3000 and pick a test account.

If you use your own Postgres instead of Docker, set `DATABASE_URL` in `.env` to its connection string before step 4.

### Automated tests

```bash
npm test
```

There are 26 Vitest tests:
- the sharing/permission rules:
  - owner, editor, commenter, viewer and outsider
  - "Editors can share" and "Viewers can download/print/copy"
  - role changes, link access and stronger-role-wins
  - ownership transfer and invalid share targets
- file-import conversion (`.txt` escaping, Markdown formatting, unsupported and oversized files, corrupt `.docx`)
- image type detection (including rejecting SVG)
- math handling (chemical-equation normalisation, Markdown math import)

### Other commands

| Command | Purpose |
| --- | --- |
| `npm run build` | Production build |
| `npm run start` | Run the production build |
| `npm run lint` | ESLint |

## Deployment

Deployed on **Vercel** (free) with **Neon** Postgres (free), so reviewers don't pay for anything.

1. Create a Neon Postgres database and copy its connection string.
2. Import the repository into Vercel and set the `DATABASE_URL` environment variable.
3. Vercel runs `npm run vercel-build`, which applies migrations, seeds the test accounts (safe to re-run) and builds the app.

## Project structure

```
prisma/schema.prisma       data model (User, Document, DocumentShare, Image, Comment)
prisma/seed.ts             seeded test accounts and sample document

src/app/                   pages: sign-in, dashboard, editor
src/app/api/               backend API route handlers (Node.js)

src/lib/                   shared logic
  access.ts                permission rules (unit tested)
  documents.ts             loads a document and enforces permissions; dashboard listing
  validation.ts            request schemas (Zod)
  http.ts                  route helpers: errors, JSON parsing, uploads
  import.ts                .txt / .md / .docx to HTML (unit tested)
  export.ts                File > Download (.html, .md, .txt)
  images.ts, image-store.ts  image type detection (unit tested) and storage
  math.ts                  equation helpers for the editor and importer (unit tested)
  uploads.ts               upload limits and accepted formats, shared by client and server
  api.ts                   typed fetch helpers for the browser

src/hooks/                 reusable React hooks (async actions, dismiss, file picker, shortcuts, toasts)
src/components/ui/         generic UI: dialogs, dropdown select, popover, avatar, error and toast messages
src/components/            document editor, share dialog, dashboard list and actions
src/components/editor/     menu bar, toolbar, panels and dialogs, TipTap extensions,
                           and useDocumentSync (autosave, live updates, conflict handling)

tests/                     automated tests
```

## Related documents
- `ARCHITECTURE.md`: architecture note (what was prioritised and why)
- `AI_WORKFLOW.md`: AI workflow note
- `SUBMISSION.md`: exactly what is included, and status
