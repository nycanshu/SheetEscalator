# SheetEscalator — Software Requirements Specification (SRS)

> **Project:** SheetEscalator — Next.js app for extracting "pending" rows from uploaded Excel files and sending escalation emails.

---

# 1. Introduction

## 1.1 Purpose

This SRS describes the functional and non-functional requirements, architecture, API design, data model, folder structure, and development practices for *SheetEscalator*. The goal is a lightweight serverless web app (Next.js) that parses uploaded Excel files, filters pending entries, persists them in the browser (IndexedDB), and supports sending escalation emails via a serverless email endpoint.

## 1.2 Scope

* Upload Excel files (XLSX/CSV) from the browser.
* Parse the sheet and identify "pending" rows using the rule: `Pending Since (Days) > TAT (Days)`.
* Pending days : Pending since - TAT days
* Persist parsed & filtered data in client-side IndexedDB (Dexie).
* Provide a dashboard to view, filter, and send escalation emails.
* Send e-mails through a serverless API route using an email provider (nodemailer + SMTP).
* No server-side persistence required (no DB). Vercel hosting for frontend + serverless functions (or api ).

## 1.3 Definitions and Acronyms

* UI — User Interface
* API — Application Programming Interface
* SRS — Software Requirements Specification
* XLSX — Excel workbook format
* TAT — Turnaround Time

---

# 2. User Stories

1. As a user, I want to upload an Excel file and see rows that are pending so I can escalate them.
2. As a user, I want to compose and send an email to the escalation authority for a selected row.
3. As a user, I want the parsed results to persist across page reloads until I upload a new file.
4. As a user, I want a simple UI to view mail-sent status for each entry.
5. As a developer, I want clean folder structure, singletons for shared clients, and well-defined APIs.

---

# 3. Functional Requirements

## 3.1 Upload & Parse

* Endpoint: `POST /api/parse-excel`
* Input: multipart/form-data with field `file` (XLSX/CSV) or raw arrayBuffer if parsed client-side.
* Behavior: parse uploaded file, validate required columns, identify pending rows and respond with JSON array of pending entries.
* Validation: required columns must exist: `Department`, `File/Activity`, `Current Level`, `Pending Since (Days)`, `TAT (Days)`, `Next Level`, `Escalation Authority Email`, `Remarks`, `Mail Sent Status`.

## 3.2 Frontend persistence

* Use IndexedDB via Dexie.js with a single DB named `PendingFilesDB` and two stores: `uploads` and `records`.
* Default behavior: clear old `records` on new upload (overwrite mode).

## 3.3 Dashboard

* Read from IndexedDB and render table with columns: `Department`, `File/Activity`, `Current Level`, `Pending Since (Days)`, `TAT (Days)`, `Next Level`, `Escalation Authority Email`, `Remarks`, `Mail Sent Status`.
* Provide UI elements: search, sort by columns, pagination (client-side), filters (department, mailSent status), bulk-select and bulk-send actions.

## 3.4 Email flow

* Endpoint: `POST /api/send-mail`
* Input: `{ to, subject, body, records: [{id,...}], sendMode: 'single'|'bulk' }`
* Behavior: send single or bulk email(s), return success/failure per recipient, update front-end state and IndexedDB `mailSent` flag on success.
* Rate-limiting & retries: implement simple retry logic and return detailed per-recipient results.

## 3.5 Error handling

* Return HTTP 4xx on client errors (invalid file, missing fields) with helpful messages.
* Return HTTP 5xx on server errors with a generic error message and a server-side log.

---

# 4. Non-Functional Requirements

* **Performance:** The app should parse typical small/medium Excel files (≤ 10k rows) within reasonable time (a few seconds). Parsing occurs server-side or client-side depending on performance testing.

* **Scalability:** Stateless serverless endpoints; all persistence is client-side. Email sending must be throttled to avoid provider limits.

* **Security:** Use env vars for SMTP/API keys. Sanitize all input. Limit file size (e.g., 10 MB). CORS policy should allow only the app origin.

* **Privacy:** All user data remains local in IndexedDB unless user triggers the `/api/send-mail` endpoint which uses the data to send email; do not log full row contents in server logs.

---

# 5. High-Level Architecture

* **Client (Next.js React, Use Shadcn Components):** Upload page, Dashboard, Email modal, IndexedDB (Dexie) persistence.
* **Serverless (Next.js API routes):** `/api/parse-excel`, `/api/send-mail`, optional `/api/healthcheck`.
* **Email provider:** SMTP via nodemailer.

---

# 6. Folder Structure (Suggested you can plan and update if needed)

```
/ (root)
├─ app/                          # Next.js app router pages
│  ├─ page.tsx                   # Home / Upload
│  ├─ dashboard/                 # Dashboard route
│  │  └─ page.tsx
│  └─ settings/                  # Email configuration (only for admin devs)
│     └─ page.tsx
├─ src/
│  ├─ components/
│  │  ├─ UploadForm.tsx
│  │  ├─ PendingTable.tsx
│  │  ├─ EmailModal.tsx
│  │  └─ Pagination.tsx
│  ├─ lib/
│  │  ├─ excel.ts                # shared parse helpers (use server or client)
│  │  ├─ mailer.ts               # singleton mailer client wrapper
│  │  └─ dexieClient.ts          # singleton Dexie instance + schema
│  ├─ hooks/
│  │  └─ usePendingData.ts
│  └─ styles/
├─ prisma/ (optional for future)
├─ public/
├─ .env.local
└─ package.json
```

---

# 7. API Design (Detailed)

## 7.1 `POST /api/parse-excel`

**Description:** Accepts an uploaded Excel or CSV, validates, parses, filters, and returns pending rows.
**Request:** `multipart/form-data` with `file` field.
**Response (200):**

```json
{ "uploadId": "uuid", "pendingCount": 3, "pending": [{...}, {...}] }
```

**Errors:** 400 for invalid file / missing columns.

## 7.2 `POST /api/send-mail`

**Description:** Send email(s) for selected records.
**Request JSON:**

```json
{
  "to": "email@example.com",
  "subject": "...",
  "body": "...",
  "records": [ {"id": 123, "fileActivity": "..."} ],
  "sendMode": "single"
}
```

**Response (200):**

```json
{ "results": [ { "id": 123, "status": "sent" }, { "id": 124, "status": "failed", "error": "..." } ] }
```

## 7.3 Security & Rate-limiting

* All send-mail requests require server-side env config present. If not configured, returns 503.
* Basic server-side rate limiting (per IP) recommended to avoid spam; configurable via env variable.

---

# 8. Data Model (IndexedDB / Dexie)

```ts
// Dexie schema
db.version(1).stores({
  uploads: '++id, filename, uploadedAt',
  records: '++id, uploadId, department, fileActivity, pendingSince, tatDays, escalationEmail, mailSent'
});

// Record example
{
  id: 1,
  uploadId: 10,
  department: "Operation",
  fileActivity: "Procurement File",
  currentLevel: "GM (O&M)",
  pendingSince: 12,
  tatDays: 5,
  nextLevel: "MD",
  escalationEmail: "guptavivekkumar87@gmail.com",
  remarks: "-",
  mailSent: false
}
```

---

# 9. Detailed Component & Module Specs

## 9.1 `dexieClient.ts` (singleton)

* Exports a single DB instance; ensures only one Dexie instance is created.
* Provides helper methods: `saveUpload`, `saveRecords`, `getAllRecords`, `clearRecords`, `updateRecord`.

## 9.2 `excel.ts`

* Centralized parsing code. Prefer server-side parsing in `/api/parse-excel` for large files.
* Validate headers and map to normalized keys.
* Provide `parseBufferToRows(buffer)` and `filterPending(rows)` utilities.

## 9.3 `mailer.ts` (singleton)

* Wraps SMTP using nodemailer.
* Exposes `sendMail({to, subject, body})` returning `{ success, id?, error? }`.
* Implements exponential-backoff retry for transient errors.

## 9.4 React components

* `UploadForm` — upload flow, progress indicator, call `/api/parse-excel`, store results to Dexie.
* `PendingTable` — consumes Dexie via `usePendingData` hook, renders table, supports sort, search, bulk select.
* `EmailModal` — template editor (subject + body), placeholders for template variables ({{fileActivity}}, {{department}}).

---

# 10. Error Handling & Logging

* Client: show toasts for success/failures. Validate file size/type before upload (use react hot toasts).
* Server: structured logs (don't log full rows) and return helpful 4xx/5xx responses.
* Email: return per-recipient results; UI marks failures and allows retry.

---

# 11. Environment & Configuration

Environment variables (Vercel .env.local):

```
EMAIL_PROVIDER=sendgrid|resend|smtp
EMAIL_API_KEY=...
SMTP_HOST=...
SMTP_PORT=587
SMTP_USER=...
SMTP_PASS=...
MAX_UPLOAD_SIZE_MB=10
RATE_LIMIT_PER_MIN=30
```

---

#

---

# 12. Deployment & Ops

* Host on Vercel (Next.js). Use environment variables for email provider.
* Monitor email sending rates and errors. Add a health-check endpoint.
* Keep build small. Consider parsing server-side for large files to avoid blocking client.

---

# 15. Appendix: Sample Sequences

## Upload Flow

1. User selects file → `POST /api/parse-excel`.
2. Server parses, returns pending rows and `uploadId`.
3. Frontend stores rows in IndexedDB under `uploadId` and navigates to `/dashboard`.

## Send Mail Flow

1. User selects rows → opens compose modal.
2. Frontend issues `POST /api/send-mail` with recipients and content.
3. Server returns per-recipient results → frontend updates Dexie (`mailSent=true`) and UI.

---

# End of Document

*Prepared for: SheetEscalator — lightweight serverless Next.js app (IndexedDB persistence, serverless email sending)*
