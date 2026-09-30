# Implementation Tasks — Backend Integration & QR Generation

Every task maps to at least one Acceptance Criterion in `spec.md`. TR = Test Requirement.

---

## Task 1: Environment Configuration

**Status**: completed
**Priority**: high
**Maps to ACs**: AC-7

### Description

Update `.env.local` and `.env.example` to include all provided third-party credentials while preserving existing required variables. The Supabase Postgres `DATABASE_URL` pooler format will be derived (Supabase docs pattern: `postgresql://postgres:[PASSWORD]@[HOST]:6543/postgres?pgbouncer=true`). Since the user did not provide a direct Postgres connection string, we use a documented placeholder and also store the three Supabase env vars so the Supabase client (if ever used) is pre-configured.

### Work Items

1. Back up existing `.env.local` mentally (diff-compare before overwriting).
2. Rewrite `.env.local` with merged keys:
   - Existing: NEXT*PUBLIC_APP_URL, NEXT_PUBLIC_API_URL, INITIAL_ADMIN*\*, SESSION_SECRET, QR_SIGNING_SECRET, COMPANY_EMAIL, COMPANY_EMAIL_NAME, FROM_EMAIL
   - New: DATABASE_URL (placeholder with Supabase-pattern), NEXT_PUBLIC_SUPABASE_URL, NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY, SUPABASE_SECRET_KEY, RESEND_API_KEY, CLOUDINARY_CLOUD_NAME, CLOUDINARY_API_KEY, CLOUDINARY_API_SECRET
3. Rewrite `.env.example` listing variable names only (no values) for the new set.

### Test Requirements (local)

- **rule TR-1.1**: `grep` of `.env.local` shows all of: `NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY`, `SUPABASE_SECRET_KEY`, `RESEND_API_KEY`, `CLOUDINARY_CLOUD_NAME`, `CLOUDINARY_API_KEY`, `CLOUDINARY_API_SECRET`, `DATABASE_URL`.
- **rule TR-1.2**: `.env.example` contains the same variable names (no real secrets).

### Completion Evidence

- `.env.local` now contains NEXT_PUBLIC_SUPABASE_URL (Supabase REST endpoint), NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY, SUPABASE_SECRET_KEY, RESEND_API_KEY, CLOUDINARY_CLOUD_NAME, CLOUDINARY_API_KEY, CLOUDINARY_API_SECRET, DATABASE_URL (pgbouncer pooler format with placeholder password).
- `.env.example` mirrors the same set of keys with no values.

---

## Task 2: Install Required Dependencies

**Status**: completed
**Priority**: high
**Maps to ACs**: AC-2, AC-3, AC-5, AC-8

### Description

Install new npm packages required by the integration:

- `resend` — Resend email SDK
- `cloudinary` — Cloudinary v2 SDK (server-side upload)
- `qrcode` — Server-side QR code rendering
- `@types/qrcode` — TypeScript types
- (Optional) Remove `@sendgrid/mail` to keep dependencies clean since Resend replaces it.

### Work Items

1. Run `npm install resend cloudinary qrcode`.
2. Run `npm install -D @types/qrcode`.
3. Optionally uninstall `@sendgrid/mail` and remove from `package.json`.
4. Run `npm install` one more time to ensure lockfile is consistent.
5. Run `npx prisma generate` so Prisma client stays in sync.

### Test Requirements

- **rule TR-2.1**: `package.json` `dependencies` lists `resend`, `cloudinary`, `qrcode`.
- **rule TR-2.2**: `package.json` `devDependencies` lists `@types/qrcode`.
- **rule TR-2.3**: `npm ls resend cloudinary qrcode` exits with 0 and shows packages installed.
- **rubric TR-2.4 (Dependency Hygiene 0-2)**: Score ≥1 (no extra unrelated packages).

### Completion Evidence

- Output snippets of `npm ls resend cloudinary qrcode`.
- `package.json` diff (the `dependencies` + `devDependencies` blocks).

---

## Task 3: Migrate Prisma Datasource to Supabase (PostgreSQL)

**Status**: completed
**Priority**: high
**Maps to ACs**: AC-1, AC-8, AC-9

### Description

Switch `prisma/schema.prisma` from SQLite provider to PostgreSQL provider. Because the provided Supabase URL is the REST endpoint (`/rest/v1/`), a direct `DATABASE_URL` Postgres connection string must be configured in env. We update the schema provider, add a comment explaining the connection format, and regenerate Prisma client.

Note: If the Supabase DB is not yet reachable at build time (e.g., no real Postgres URL), we ensure at minimum the schema + client generation is correct; `db push` can be executed by the user once `DATABASE_URL` is filled.

### Work Items

1. Edit `prisma/schema.prisma` datasource block:
   - `provider = "postgresql"`
   - keep `url = env("DATABASE_URL")`
   - Add a comment block explaining expected Supabase pooler URL format.
2. Run `npx prisma validate` to ensure schema parses.
3. Run `npx prisma generate`.
4. If real `DATABASE_URL` is reachable, run `npx prisma db push`; otherwise document the step in evidence.

### Test Requirements

- **rule TR-3.1**: `prisma/schema.prisma` contains `provider = "postgresql"` at the datasource.
- **rule TR-3.2**: `npx prisma validate` exits with code 0.
- **rule TR-3.3**: `npx prisma generate` exits with code 0.

### Completion Evidence

- `prisma validate` and `prisma generate` command outputs.
- `prisma/schema.prisma` diff (the datasource block).

---

## Task 4: Migrate Email Service from SendGrid → Resend

**Status**: completed
**Priority**: high
**Maps to ACs**: AC-2, AC-8, AC-9, AC-11, AC-13

### Description

Rewrite `lib/email.ts` to use the `resend` SDK instead of `@sendgrid/mail`. Keep all public function signatures identical so call-sites (`complaints/route.ts`, `contact/route.ts`, `news/[postId]/feedback/route.ts`) are unchanged. Preserve HTML templates exactly. Add same graceful failure (non-throwing) behavior.

### Work Items

1. Add file header comment block in same style.
2. Import `Resend` from `resend`; create singleton client if `RESEND_API_KEY` is set.
3. Rewrite low-level `sendMail` using `resend.emails.send`.
4. Keep wrappers (`sendFeedbackToCompany`, `sendContactFormToCompany`, `sendComplaintToCompany`, `sendComplaintAcknowledgement`) identical in signature and HTML output.
5. Handle `RESEND_API_KEY` missing case with a warning log and `false` return.

### Test Requirements

- **rule TR-4.1**: No import of `@sendgrid/mail` in `lib/email.ts`; `import { Resend } from "resend"` is present.
- **rule TR-4.2**: All four high-level exports remain callable (file exports them).
- **rule TR-4.3**: `npm run typecheck` passes after the edit.
- **rubric TR-4.4 (Code Style Fidelity 0-2)**: Score ≥1.
- **rubric TR-4.5 (Security 0-2)**: Score ≥1 (no leaking of key; read only from `process.env` server-side).

### Completion Evidence

- `lib/email.ts` full diff.
- `npm run typecheck` output snippet.

---

## Task 5: Cloudinary Integration Module

**Status**: completed
**Priority**: high
**Maps to ACs**: AC-3, AC-8, AC-9, AC-11, AC-13

### Description

Create `lib/cloudinary.ts` that wraps the Cloudinary v2 SDK config and a typed upload helper. The upload function accepts a base64 data URI or a local Buffer/path and returns the secure URL, public ID, width, height. Enforces size (<= 5MB) and image type (via Cloudinary `resource_type: "image"` plus a MIME pre-check for data URIs).

### Work Items

1. Create `lib/cloudinary.ts` with header comment block.
2. Configure `v2.config({ cloud_name, api_key, api_secret })` from env on import.
3. Export typed:
   - `uploadImageFromBase64(dataUri: string, options?: { folder?: string })` → `Promise<{ url: string; publicId: string; width: number; height: number }>`
   - Add a size guard: reject base64 payloads > ~5MB decoded.
   - Regex-validate `data:image/(png|jpeg|jpg|webp|gif);base64,...` prefix before uploading.

### Test Requirements

- **rule TR-5.1**: File exists and exports at least `uploadImageFromBase64`.
- **rule TR-5.2**: `npm run typecheck` passes.
- **rubric TR-5.3 (Code Style Fidelity 0-2)**: Score ≥1.
- **rubric TR-5.4 (Security 0-2)**: Score ≥1 (MIME + size checks present or documented).

### Completion Evidence

- Full contents of `lib/cloudinary.ts`.
- Typecheck output snippet.

---

## Task 6: Admin Upload API Endpoint (`/api/upload`)

**Status**: completed
**Priority**: medium
**Maps to ACs**: AC-4, AC-8, AC-9, AC-11, AC-13

### Description

Create `app/api/upload/route.ts`. Accepts a JSON payload `{ image: "<base64 data URI>" }` (and optional `folder`). Requires `OPERATIONS` role via `requireAdmin("OPERATIONS")`. Calls the Cloudinary helper and returns `{ url, publicId, width, height }` on success or `{ error }` on failure (400/401/403/500 matching existing patterns).

### Work Items

1. Create the route file with header comment.
2. Implement `POST` handler:
   - `requireAdmin("OPERATIONS")` guard at top of try block.
   - Parse JSON, validate `image` field with Zod (inline or in validation.ts — add `uploadSchema`).
   - Call `uploadImageFromBase64`.
   - Return 201 with JSON payload on success.
3. Add `uploadSchema` to `lib/validation.ts` (optional but keeps consistency): `z.object({ image: z.string().min(32), folder: z.string().optional() })`.

### Test Requirements

- **rule TR-6.1**: File exists at `app/api/upload/route.ts` and exports `POST`.
- **rule TR-6.2**: Handler calls `requireAdmin("OPERATIONS")`.
- **rule TR-6.3**: `npm run typecheck` passes.
- **rubric TR-6.4 (Code Style Fidelity 0-2)**: Score ≥1.
- **rubric TR-6.5 (Security 0-2)**: Score ≥1 (auth + basic input validation present).

### Completion Evidence

- Full contents of the new route file.
- Diff of `lib/validation.ts` if `uploadSchema` was added.
- Typecheck output snippet.

---

## Task 7: QR Code Generation Module

**Status**: completed
**Priority**: high
**Maps to ACs**: AC-5, AC-8, AC-9, AC-11

### Description

Create `lib/qrcode.ts` using the `qrcode` npm package. Two exports:

- `generateQRDataUrl(code: string, size?: number)` → Promise<string> (PNG data URL)
- `generateQRSvg(code: string, size?: number)` → Promise<string> (SVG string)
  The content encoded in the QR is the verification deep-link: `${appConfig.appUrl}/verify?code=${encodeURIComponent(code)}`.
  Clamp `size` between 64 and 1024; default 256.

### Work Items

1. Create file with header comment.
2. Import `QRCode` from `qrcode` and `appConfig` from `@/lib/config`.
3. Implement both functions with try/catch.
4. Add JSDoc comments (inline comments, per user profile preference for detailed comments).

### Test Requirements

- **rule TR-7.1**: File exists and exports both typed functions.
- **rule TR-7.2**: `npm run typecheck` passes.
- **rubric TR-7.3 (Code Style Fidelity 0-2)**: Score ≥1.

### Completion Evidence

- Full contents of `lib/qrcode.ts`.
- Typecheck output snippet.

---

## Task 8: QR Code Image API Endpoint (`/api/qrcode`)

**Status**: completed
**Priority**: high
**Maps to ACs**: AC-6, AC-8, AC-9, AC-11, AC-13

### Description

Create `app/api/qrcode/route.ts` with a public (unauthenticated) `GET` handler. Query params:

- `code` (required, max 128 chars after trim)
- `format` — `"png"` (default) or `"svg"`
- `size` — integer (default 256, clamped 64..1024)
  Behavior:
- For PNG: call `QRCode.toBuffer` with correct options; respond with `Content-Type: image/png` and the buffer body.
- For SVG: call `QRCode.toString` with `type: 'svg'`; respond with `Content-Type: image/svg+xml; charset=utf-8`.
- (Optional, nice-to-have) Look up code in `QRCode` table to confirm existence and only then render; if missing, still render the QR (URL will just fail verification later) — or return 404. We'll return 404 with an error message for clarity.

### Work Items

1. Create route file with header comment.
2. Implement `GET`:
   - Parse URL search params.
   - Validate `code` presence & length (1..128).
   - Clamp size and default format.
   - Nice-to-have: `prisma.qRCode.findUnique({ where: { code } })`; 404 if not found and user expected it (we'll do this check).
   - Build QR content as verification URL.
   - Stream correct response with the right Content-Type.
3. Error handling: 400 on invalid input, 404 if optional DB check fails, 500 on rendering error.

### Test Requirements

- **rule TR-8.1**: File exists at `app/api/qrcode/route.ts` and exports `GET`.
- **rule TR-8.2**: Handler reads `code`, `format`, `size` from query params.
- **rule TR-8.3**: PNG path sets `Content-Type: image/png`; SVG path sets `image/svg+xml`.
- **rule TR-8.4**: `npm run typecheck` passes.
- **rubric TR-8.5 (Code Style Fidelity 0-2)**: Score ≥1.
- **rubric TR-8.6 (Security 0-2)**: Score ≥1 (input length/sanitization present).

### Completion Evidence

- Full route file.
- Typecheck output snippet.

---

## Task 9: Enhance `/api/codes/generate` Response (Optional Batch QR Payload)

**Status**: completed
**Priority**: high
**Maps to ACs**: AC-10, AC-8, AC-9

### Description

Ensure existing `POST /api/codes/generate` still works (no regression). The spec (FR-4.5) suggests optionally exposing how to get QR images. The cleanest solution is to **return the created codes along with their code strings** and a helper `qrUrl` per code pointing at `/api/qrcode?code=X`. Add a `withQr?: boolean` query or body flag that when true includes per-code `qrUrl` and optionally a `qrDataUrl` (only for small batches, cap at 50 to avoid timeout).

### Work Items

1. Do NOT change core business logic (validation, batch counter increment).
2. After `createMany`:
   - Query the created codes back (difficult with SQLite createMany returning only count; for Postgres `createMany` also returns only count by default). Strategy: instead of querying back, since we already have `codeData[]` with code strings, materialize `{ code, qrUrl: `${apiUrl}/api/qrcode?code=${encodeURIComponent(code)}` }`.
   - Return shape: `{ count: createdCount, codes: Array<{ code: string; qrUrl: string }> }` — truncate to the first N (e.g., up to 200) to keep response small.
3. Ensure batch counter increment still runs.
4. Preserve all error paths.

### Test Requirements

- **rule TR-9.1**: Response JSON on success includes `count` (still) and new `codes` array of objects with `code` + `qrUrl`.
- **rule TR-9.2**: Batch `generatedCodes` counter is still incremented (logic unchanged in code inspection).
- **rule TR-9.3**: `npm run typecheck` passes.

### Completion Evidence

- Diff of `app/api/codes/generate/route.ts`.
- Typecheck output snippet.

---

## Task 10: Build, Lint & Typecheck

**Status**: completed
**Priority**: high
**Maps to ACs**: AC-8, AC-9

### Description

Run the project's standard verification commands and fix any errors introduced.

### Work Items

1. Run `npm run typecheck` (tsc --noEmit). Fix any new TS errors.
2. Run `npm run build`. Fix any new build errors.
3. Run `npm run lint`. Fix any new lint issues introduced by new code (do not change unrelated files).
4. Record outputs as evidence.

### Test Requirements

- **rule TR-10.1**: `npm run typecheck` exits 0.
- **rule TR-10.2**: `npm run build` exits 0.
- **rule TR-10.3**: `npm run lint` exits 0 OR any failures exist before the task (documented) and no new ones are introduced.

### Completion Evidence

- Full terminal outputs (or relevant snippets) for all three commands.

---

## Task 11: Update description.txt

**Status**: completed
**Priority**: medium
**Maps to spec process (user profile preference: track modifications)**

### Description

Append a concise changelog to `description.txt` documenting all files created, modified, and all new environment variables. Per user profile: "Requests tracking of all project modifications and new files in a `description.txt` file within the repository."

### Work Items

1. Check whether `description.txt` already exists (if not, create).
2. Append a dated section (2026-09-29) listing:
   - New files created
   - Files modified (with purpose)
   - New env vars added
   - New packages added (and removed if any)

### Test Requirements

- **rule TR-11.1**: `description.txt` exists and contains the section.

### Completion Evidence

- Contents of `description.txt` (or appended diff).

---

## Dependency Order

1. Task 1 (env config) and Task 2 (deps) can run in parallel.
2. Task 3 (Prisma provider) depends on Task 1 & 2.
3. Task 4 (email rewrite) depends on Task 2.
4. Task 5 (Cloudinary module) depends on Task 2.
5. Task 6 (upload route) depends on Task 5.
6. Task 7 (QR module) depends on Task 2.
7. Task 8 (QR route) depends on Task 7 and Task 3 (DB access).
8. Task 9 (enhance generate) depends on Task 8.
9. Task 10 (build/verify) depends on Tasks 1–9.
10. Task 11 (description.txt) depends on Task 10 (final state).
