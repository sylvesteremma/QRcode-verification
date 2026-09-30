# Fix 404 Errors & TypeScript Issues Implementation Plan

## Repository Research

### Current State Analysis
The project is a Next.js 14 App Router SEMEK QR Verification system with:
- 2 existing pages: `/` (home) and `/verify` (verification)
- 28 API routes implemented (all under `/app/api/**`)
- Full UI component library (Button, Card, Input, Badge, Alert, Modal, Table, Tabs, Pagination, Spinner, Select, Textarea)
- React Query hooks for all data operations

### Root Cause of 404 Errors
The home page (`app/page.tsx`) contains navigation links to **5 non-existent pages**:
1. `/complaints` - File a complaint form
2. `/complaints/track` - Track complaint status
3. `/news` - News & announcements listing
4. `/products` - Browse products listing
5. `/contact` - Customer support contact form

Additionally, the middleware references `/admin/login` which also does not exist.

### TypeScript Errors Found (2)
1. **`app/verify/page.tsx:112`** - `leftIcon` prop passed to `<Input>` but the Input component does not declare/support this prop.
2. **`app/verify/page.tsx:197`** - `new Date(result.batch.productionDate)` where `productionDate` is typed as `string | undefined`, causing strict mode error.

## Files and Modules

### Files to Modify (Existing)
- `components/ui/input.tsx` — Add `leftIcon` / `rightIcon` props support
- `app/verify/page.tsx` — Fix Date construction with undefined guard
- `description.txt` — Track all modifications per project convention

### Files to Create (New - Missing Pages)
- `app/complaints/page.tsx` — Public complaint submission form
- `app/complaints/track/page.tsx` — Public complaint tracking lookup
- `app/news/page.tsx` — Public news listing page
- `app/news/[slug]/page.tsx` — Public news detail page
- `app/products/page.tsx` — Public products listing page
- `app/contact/page.tsx` — Public contact form page
- `app/admin/login/page.tsx` — Admin login page (referenced by middleware)

## Implementation Steps

### Step 1: Fix Input component (Dependency: None)
Add optional `leftIcon` and `rightIcon` props to `InputProps` interface in `components/ui/input.tsx`. Render the icon slots inside a flex wrapper around the `<input>` element.

### Step 2: Fix TypeScript errors in verify page (Dependency: Step 1)
- Line 197: Add nullish guard: `result.batch.productionDate && new Date(result.batch.productionDate).toLocaleDateString()`
- Line 200: Same guard for `expiryDate`

### Step 3: Create `/complaints` page (Dependency: None)
Form with fields: fullName, email, phone, category, subject, message, productId, batchNumber, verificationCode. Uses `useCreateComplaint` hook + react-hook-form + zod. Shows success state with reference number.

### Step 4: Create `/complaints/track` page (Dependency: None)
Form with fields: reference, email. Uses `useTrackComplaint` hook. Displays complaint status timeline, details, and status message.

### Step 5: Create `/news` listing page (Dependency: None)
Uses `useNews` hook with PUBLISHED status filter. Displays cards with title, excerpt, published date, featured image. Links to `/news/[slug]`. Pagination support.

### Step 6: Create `/news/[slug]` detail page (Dependency: None)
Server component fetches single news post by slug. Displays full article, author, publish date, featured image. Includes feedback submission form using `useCreateFeedback` hook and approved feedback list below.

### Step 7: Create `/products` listing page (Dependency: None)
Uses `useProducts` hook with ACTIVE status filter. Product grid with image, name, type, size, SKU. Links to verification for each product.

### Step 8: Create `/contact` page (Dependency: None)
Form with fields: fullName, email, phone, subject, message. Uses `useCreateContact` hook. Shows success confirmation after submission.

### Step 9: Create `/admin/login` page (Dependency: None)
Form with email/password. Uses `useLogin` hook. Redirects to `/admin` on success (or the `next` query param). Matches existing design pattern.

### Step 10: Update description.txt (Dependency: All steps above)
Document every created/modified file per project memory convention.

### Step 11: Validation (Dependency: All steps above)
- Run `npm run typecheck` — ensure 0 TypeScript errors
- Run `npm run lint` — ensure 0 lint errors
- Run `npm run build` — ensure production build succeeds
- Start dev server (`npm run dev`) and verify:
  - Home page loads without errors
  - All 6 feature links navigate to valid pages (no 404)
  - Admin login page loads at `/admin/login`
  - Verify page works without console errors

## Dependencies and Considerations
- All pages must follow the existing design system: `bg-hero-gradient`, card-based layout, same `Button` variants, same typography scale.
- Public pages reference `/api/*` routes (28 already exist) via React Query hooks already defined in `lib/api/hooks.ts`.
- The `/news/[slug]` page will need a server-side fetch or a client component using `useNews` with slug filtering; simplest approach is client component filtering by slug.
- Admin login is referenced by `middleware.ts` (redirects unauthenticated `/admin/*` to `/admin/login`), so creating this page prevents redirect loops.
- The `Badge` component uses `color` prop in `app/verify/page.tsx` but the component defines `variant` — this is already working because TypeScript did not flag it (checking... actually it's used as `<Badge color="success">` but the prop is named `variant`). **Need to check if this is also an error.** Wait, the typecheck output didn't flag it. The Badge's color prop might be falling through to HTML attributes. Let's verify and fix if needed (change `color=` to `variant=` in verify page).

## Validation
- `npm run typecheck` → exit code 0
- `npm run lint` → exit code 0  
- `npm run build` → exit code 0
- Manual smoke test: home page links → `/complaints`, `/complaints/track`, `/news`, `/products`, `/contact` all return HTTP 200 with rendered content
- `/admin/login` returns HTTP 200

## Risks
- **Risk: More TypeScript errors in newly created pages using hooks** — Mitigation: Follow the exact pattern from `app/verify/page.tsx` for hook usage, which is already compiling (except the 2 known issues).
- **Risk: Badge `color` vs `variant` prop mismatch** — Mitigation: Search verify page for `color=` on Badge, replace with `variant=` to match the component API.
- **Risk: News detail page by slug** — Mitigation: The `useNews` hook fetches paginated list; we'll filter client-side or use the `GET /api/news/[id]` endpoint. Since the route param is `slug` not `id`, we fetch the news list and match by slug.
- **Risk: Database not seeded / no data to display** — Mitigation: Pages handle empty state gracefully using the DataTable component's built-in empty state and manual conditional rendering.
