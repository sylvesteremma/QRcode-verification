# Backend Integration & QR Code Generation — Specification

## Problem
The SEMEK QR verification platform currently uses:
- **SQLite + Prisma** (local file database) instead of a managed production database
- **SendGrid** for email, but credentials for **Resend** have been provided
- **No image storage service** (product/news images are URLs only, no upload capability)
- **No QR code image generation** (codes exist in the database but no visual QR images are produced for printing/packaging)

The provided third-party credentials (Supabase, Resend, Cloudinary) must be wired into the backend, and QR code image generation must be added.

## Users
1. **Admin / Operations users** — generate batches of QR codes, upload product images, manage content
2. **Admin / Auditor users** — view scans, complaints, reports
3. **End consumers** — verify products via QR scan (uses the verify endpoint, unchanged)

## Goals
1. Wire **Supabase** into the backend as the data layer (Prisma datasource)
2. Replace **SendGrid** with **Resend** for all outbound email (complaints, contact, feedback)
3. Integrate **Cloudinary** for secure server-side image uploads (products, news featured images)
4. Add a **QR code image generation endpoint** that produces scannable PNG/SVG images from stored codes
5. Ensure existing API routes, auth, and business logic continue to work without regression

## Non-Goals
- Rewriting the UI/admin front-end pages (out of scope unless strictly required by new endpoints)
- Changing the verification flow / scan logic itself
- Replacing Prisma ORM with raw Supabase client — Prisma remains the DB access layer
- Adding Supabase Auth (current JWT cookie auth via jose is retained)

---

## Functional Requirements

### FR-1: Supabase Database Integration
- **FR-1.1**: Prisma `datasource db` provider must be set to `postgresql`.
- **FR-1.2**: `DATABASE_URL` environment variable must point to the Supabase Postgres connection pooler.
- **FR-1.3**: All existing Prisma models (AdminUser, Product, Batch, QRCode, ScanEvent, Alert, Complaint, NewsPost, Feedback, AuditLog) must migrate cleanly to Supabase without schema changes.
- **FR-1.4**: `prisma generate` and `prisma db push` (or migrate) must succeed against the Supabase DB.
- **FR-1.5**: Seed script (`prisma/seed.ts`) must run successfully on the Supabase-backed DB.

### FR-2: Resend Email Integration
- **FR-2.1**: Remove dependency on `@sendgrid/mail`; install and use `resend` SDK.
- **FR-2.2**: All existing email functions in `lib/email.ts` must deliver via Resend API:
  - `sendFeedbackToCompany`
  - `sendContactFormToCompany`
  - `sendComplaintToCompany`
  - `sendComplaintAcknowledgement`
- **FR-2.3**: Read `RESEND_API_KEY`, `FROM_EMAIL`, `COMPANY_EMAIL`, `COMPANY_EMAIL_NAME` from env.
- **FR-2.4**: Graceful degradation: if API key is missing, log a warning and return `false` without throwing.
- **FR-2.5**: Same HTML email templates retained (no visual redesign).

### FR-3: Cloudinary Image Upload
- **FR-3.1**: Install `cloudinary` SDK v2 and configure with `CLOUDINARY_CLOUD_NAME`, `CLOUDINARY_API_KEY`, `CLOUDINARY_API_SECRET`.
- **FR-3.2**: Create an admin-protected API endpoint `POST /api/upload` that:
  - Accepts a base64 or binary image (multipart form-data or JSON base64 payload)
  - Requires at least `OPERATIONS` role
  - Uploads to Cloudinary folder `semek/` (or similar)
  - Returns the secure URL, public ID, and dimensions
- **FR-3.3**: Helper module `lib/cloudinary.ts` encapsulates SDK setup and upload function.
- **FR-3.4**: Validation rejects non-image MIME types and files > 5 MB.

### FR-4: QR Code Image Generation
- **FR-4.1**: Install the `qrcode` package (server-side QR rendering) plus its types.
- **FR-4.2**: Add module `lib/qrcode.ts` exporting:
  - `generateQRDataUrl(code: string, opts?)` → returns PNG data URL (base64)
  - `generateQRSvg(code: string, opts?)` → returns SVG string
  - Verification URL embedded in QR: `{appUrl}/verify?code={code}`
- **FR-4.3**: Add public (unauthenticated) API endpoint `GET /api/qrcode` accepting:
  - `code` (required, string) — the verification code
  - `format` (optional) — `png` (default) or `svg`
  - `size` (optional, number, default 256, max 1024)
  - For PNG: responds with `image/png` Content-Type (binary buffer)
  - For SVG: responds with `image/svg+xml` Content-Type (UTF-8 string)
- **FR-4.4**: Endpoint validates the code exists in `QRCode` table (optional but recommended — at minimum sanitize input length).
- **FR-4.5**: Update `POST /api/codes/generate` response payload to include (for each code or as a batch option) the QR image URL(s). At minimum, expose a helper route for rendering.

### FR-5: Environment Configuration
- **FR-5.1**: Update `.env.local` with:
  - Supabase-derived `DATABASE_URL` (Postgres pooler connection string)
  - `NEXT_PUBLIC_SUPABASE_URL`
  - `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY`
  - `SUPABASE_SECRET_KEY`
  - `RESEND_API_KEY`
  - `CLOUDINARY_CLOUD_NAME`
  - `CLOUDINARY_API_KEY`
  - `CLOUDINARY_API_SECRET`
  - Existing keys preserved (SESSION_SECRET, QR_SIGNING_SECRET, initial admin, URLs, email from/company)
- **FR-5.2**: Update `.env.example` with the new variable names (no real values).

### FR-6: Backward Compatibility
- **FR-6.1**: All existing API routes must respond as before (same JSON shapes, same auth requirements).
- **FR-6.2**: `next build` succeeds with no TypeScript errors.
- **FR-6.3**: `next lint` passes (or any pre-existing lint issues unrelated to our changes do not increase).

---

## Non-Functional Requirements

### NFR-1: Security
- All admin routes continue to require signed session cookies.
- SERVER-ONLY env vars (SUPABASE_SECRET_KEY, RESEND_API_KEY, CLOUDINARY_API_SECRET, SESSION_SECRET, QR_SIGNING_SECRET, DATABASE_URL) must NEVER be prefixed with `NEXT_PUBLIC_` and must NOT leak into client bundles.
- Upload endpoint validates content type and size before Cloudinary upload.
- QR endpoint sanitizes input; no path traversal or injection via `code` param.

### NFR-2: Performance
- QR code generation for a single code completes in < 200 ms.
- Email send attempts are fire-and-forget friendly (never block HTTP responses beyond a short timeout).

### NFR-3: Maintainability
- Each new module (`lib/cloudinary.ts`, `lib/qrcode.ts`) has a single responsibility and clear typed exports.
- Each new API route follows existing patterns: `try/catch`, auth via `requireAdmin`, consistent error JSON shapes, status codes.

---

## Constraints & Dependencies

### Constraints
- Prisma remains the ORM; do NOT introduce a Supabase JS client for data access.
- Keep existing JWT cookie auth; do NOT add Supabase Auth.
- QR code library must render server-side (no canvas dependency on the server).

### Dependencies
- `@prisma/client`, `prisma` (existing)
- New: `resend` (email SDK)
- New: `cloudinary` (v2, image upload)
- New: `qrcode` + `@types/qrcode` (QR generation)
- Existing: `jose`, `bcryptjs`, `zod`, `next` 14

### Assumptions
- Supabase Postgres connection string can be derived from the provided Supabase URL + credentials. If direct pooler URL is not derivable, the project will document what's needed and use the provided keys as placeholders.
- Resend domain/from email is deliverable; DNS/SPF setup is out of scope.
- Cloudinary account permits unsigned server-to-server uploads using the API key/secret pair.

### Open Questions
- None blocking. All new endpoints follow existing conventions in the repo.

---

## Acceptance Criteria

### rule
- **AC-1**: `prisma/schema.prisma` datasource provider is `postgresql` and `url = env("DATABASE_URL")`.
- **AC-2**: `lib/email.ts` imports and uses `resend` (no `@sendgrid/mail` import).
- **AC-3**: `lib/cloudinary.ts` exists, exports an upload function, configured via the three Cloudinary env vars.
- **AC-4**: `app/api/upload/route.ts` exists, implements POST, enforces OPERATIONS+ role via `requireAdmin("OPERATIONS")`, and returns `{ url, publicId, width, height }`-shape JSON on success.
- **AC-5**: `lib/qrcode.ts` exists and exports typed `generateQRDataUrl` and `generateQRSvg` functions.
- **AC-6**: `app/api/qrcode/route.ts` exists and responds to `GET ?code=X&format=png|svg&size=N` with correct Content-Type and a valid image.
- **AC-7**: `.env.local` contains all provided keys (Supabase trio, Resend, Cloudinary trio) plus all previously-required keys.
- **AC-8**: Running `npm run build` succeeds with exit code 0.
- **AC-9**: Running `npm run typecheck` (i.e. `tsc --noEmit`) succeeds with exit code 0.
- **AC-10**: `POST /api/codes/generate` still creates QR codes and increments batch.generatedCodes (no regression).

### rubric
- **AC-11 (Code Style Fidelity, 0-2)**:
  - 2: New files match existing code style exactly: same header comment block format, same error handling patterns, same auth usage, same Zod usage for inputs.
  - 1: Minor inconsistencies (e.g. missing header comments or slightly different error shapes) but functionally correct.
  - 0: Noticeably different code style from existing lib/api files.
- **AC-12 (Dependency Hygiene, 0-2)**:
  - 2: Only required new packages added (resend, cloudinary, qrcode + @types/qrcode); no unused packages; package.json scripts unchanged except as needed.
  - 1: One extra/unnecessary package added.
  - 0: Multiple unnecessary or unrelated packages introduced.
- **AC-13 (Security, 0-2)**:
  - 2: All secrets stay server-only; every admin route uses `requireAdmin`; upload size/content-type checks present; QR route length/sanitizes input.
  - 1: One minor gap (e.g. no size check but content type check present).
  - 0: Any secret leaked via `NEXT_PUBLIC_`, or an admin route missing auth.
