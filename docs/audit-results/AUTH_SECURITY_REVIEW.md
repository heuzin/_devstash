# Auth Security Review

**Last audited:** 2026-10-02
**Scope:** NextAuth v5 config (`src/auth.ts`, `src/auth.config.ts`), Credentials + GitHub providers, `POST /api/auth/register`, email verification (`src/lib/auth/verification-token.ts`, `/verify-email`, resend action), forgot/reset password (`src/lib/auth/password-reset-token.ts`, `/forgot-password`, `/reset-password`, `requestPasswordReset`/`resetPassword` actions), profile Server Actions (`src/actions/profile.ts`: `changePassword`, `deleteAccount`), `src/proxy.ts` route protection, and shared validation in `src/lib/validations/auth.ts`.

## Findings

### 🟠 High

- **File:** `src/auth.ts:39-52`, `src/app/api/auth/register/route.ts:10-70`, `src/actions/auth.ts:19-50,55-79,81-105`, `src/actions/profile.ts:13-52`
- **Issue:** No rate limiting or lockout exists anywhere in the codebase on any authentication-adjacent endpoint (confirmed via repo-wide search — no rate-limit/throttle library, Upstash, or custom limiter is present). This affects:
  - Credentials login (`authorize` in `src/auth.ts`) — unlimited password-guessing/credential-stuffing attempts per email, with no lockout or backoff.
  - `POST /api/auth/register` — unlimited account-creation attempts; each successful-validation request runs a 12-round bcrypt hash (`route.ts:31`) before any existing-user check short-circuits later attempts, so an attacker can cheaply drive CPU-expensive hashing work on the server (hashing-cost DoS amplification) just by varying the email.
  - `resendVerificationEmail`, `requestPasswordReset`, `resetPassword`, `changePassword` — all can be called repeatedly with no backoff, enabling outbound-email spam/cost abuse (Resend API) and brute-forcing of reset/verification tokens or the current-password check.
  NextAuth/Auth.js does not provide any of this on its own — it is purely custom-code responsibility.
- **Fix:** Add a rate limiter keyed by IP (and, where applicable, by email) in front of these code paths. Since this runs on serverless/edge functions, an in-memory limiter will not work across invocations — use a shared store such as `@upstash/ratelimit` backed by Upstash Redis or Vercel KV. At minimum: limit `POST /api/auth/register` and the credentials `authorize` callback to a handful of attempts per IP+email per minute, and limit `resendVerificationEmail`/`requestPasswordReset` to e.g. 1 request per minute and 5/hour per email.

### 🟡 Medium

- **File:** `src/auth.ts:43-49`
- **Issue:** Timing-based account enumeration in the credentials `authorize` callback. When the email doesn't exist, or the user has no password (OAuth-only), the function returns `null` immediately after the `findUnique` lookup. When the email exists and has a password, it additionally `await`s `bcryptjs.compare`, which is deliberately slow. This creates a measurable response-time difference that lets an attacker distinguish "this email has a password-based account" from "this email doesn't exist / is OAuth-only" purely by timing repeated login attempts — independent of the error message shown.
- **Fix:** Always perform a bcrypt compare of equal cost, even when no matching user/password is found, e.g.:
  ```ts
  const user = await prisma.user.findUnique({ where: { email: parsed.data.email } });
  const hash = user?.password ?? DUMMY_BCRYPT_HASH; // a fixed, precomputed 12-round hash
  const isValid = await bcryptjs.compare(parsed.data.password, hash);
  if (!user?.password || !isValid) return null;
  ```

- **File:** `src/actions/auth.ts:63-79`
- **Issue:** `requestPasswordReset` returns an identical generic message in all cases (good), but the *timing* differs: when the account exists and has a password, the action `await`s `createPasswordResetToken` (DB delete + insert) and `sendPasswordResetEmail` (an outbound network call to Resend) before returning. When the account doesn't exist or is OAuth-only, it returns immediately after the single lookup. The extra network round-trip to Resend is easily large enough (tens to hundreds of ms) to be distinguished by an attacker timing responses, defeating the purpose of the generic response and re-introducing the enumeration this flow was explicitly built to avoid.
- **Fix:** Don't let the email-send latency leak into the response timing — fire the token-create + email-send off without awaiting it in the request path (e.g. hand off to a background task / `after()` in Next.js), or pad the "doesn't exist" branch with an artificial delay that matches the typical duration of the token-create + send path.

- **File:** `src/lib/site-url.ts:3-8` (consumed by `src/actions/auth.ts:42,71` and `src/app/api/auth/register/route.ts:50`)
- **Issue:** `getSiteUrl()` builds the absolute base URL for password-reset and email-verification links directly from the incoming `host` request header, with no validation against an allow-list. If this header ever reaches the app unvalidated (misconfigured reverse proxy, direct-to-origin access, multi-tenant routing), a request with a forged `Host` header could cause the generated reset/verify link to point at an attacker-controlled domain, leaking the real single-use token to that domain's server logs if the recipient clicks it. (Verified via web search that this class of issue is mitigated on platforms like Vercel, which route by Host/SNI before the request reaches app code — but the application code itself does no validation, so the protection is purely incidental to the current hosting choice, not something the code enforces.)
- **Fix:** Derive the base URL for security-sensitive emailed links from a trusted, server-configured environment variable (e.g. reuse `AUTH_URL`/add `NEXT_PUBLIC_SITE_URL`) rather than the request's `Host` header, falling back to the header only for local development.

### 🔵 Low

- **File:** `src/app/api/auth/register/route.ts:23-29`
- **Issue:** Registration returns a distinct `409` with "An account with this email already exists" for duplicate emails, disclosing account existence. This is a common and largely accepted trade-off for sign-up flows (the user needs to be told to sign in instead) and is intentionally different from the no-enumeration requirement on forgot-password, so it is flagged as informational rather than a real defect — but worth being aware it's a deliberate enumeration surface if that's ever reconsidered.
- **Fix (optional):** If stricter enumeration resistance is desired, consider a "check your email" response for both new and duplicate registrations, with duplicate accounts receiving a "someone tried to register with your email" notice instead of a reset/verify link. Not recommended unless this becomes a product requirement — the current behavior is standard.

- **File:** `src/app/(auth)/verify-email/page.tsx:10-11`
- **Issue:** The single-use email-verification token is consumed as a side effect of a bare `GET /verify-email?token=...` request inside a server component's render, with no user-confirmation step (contrast with `/reset-password`, which only consumes the token on explicit form submission). Automated link processing — corporate email security gateways, antivirus "safe link" prefetchers, chat-app link unfurlers — commonly follow links found in emails, which would consume the token before the real recipient clicks it, silently breaking the verification flow until the user requests a new email. This is a self-DoS/reliability issue rather than an auth bypass, but it undermines the single-use guarantee the token was designed to provide.
- **Fix:** Require an explicit confirmation action (e.g. a "Verify my email" button that calls a Server Action) before consuming the token, mirroring the pattern already used on `/reset-password`.

## Passed Checks

- **Password hashing:** `bcryptjs` at cost factor 12 is used consistently for registration (`src/app/api/auth/register/route.ts:31`), password reset (`src/actions/auth.ts:91`), and change-password (`src/actions/profile.ts:45`) — within the recommended 10-12+ range, and no plaintext password is ever logged, stored, or echoed back in any response reviewed.
- **Token generation:** both email-verification and password-reset tokens use `randomBytes(32).toString("hex")` (`src/lib/auth/verification-token.ts:10`, `src/lib/auth/password-reset-token.ts:15`) — 256 bits of cryptographically secure randomness, not predictable.
- **Token expiration:** enforced on consumption via an explicit `record.expires < new Date()` check (`verification-token.ts:30`, `password-reset-token.ts:36`), not just relied upon implicitly.
- **Token single-use:** both flows delete the token transactionally together with the state change it authorizes (`verification-token.ts:36-42`, `password-reset-token.ts:44-50`), and a `P2025` (record already consumed) is caught and treated as `invalid`, closing the race where a token could be used twice concurrently.
- **Token scoping:** password-reset tokens use a `reset-password:` identifier prefix distinct from the plain-email identifier used by verification tokens (`password-reset-token.ts:7-9`, checked on consumption at `password-reset-token.ts:32`), so a token minted for one flow cannot be replayed against the other. Both token types are bound to the email encoded in their identifier, not a client-supplied id.
- **Forgot-password response content:** returns the same generic message regardless of whether the account exists or has a password set (`src/actions/auth.ts:63-79`) — satisfies response-content enumeration protection (see Medium finding above for the separate *timing* side-channel).
- **Profile mutation identity:** `changePassword` and `deleteAccount` both re-derive the acting user from the server-side session via `auth()` (`src/actions/profile.ts:27-30, 55-56`) and never trust a client-supplied id/email.
- **Change-password correctness:** verifies the current password server-side with `bcryptjs.compare` before writing the new hash (`src/actions/profile.ts:40-45`).
- **Account deletion:** scoped to `session.user.id` (`src/actions/profile.ts:60`), gated behind an explicit confirmation `AlertDialog` client-side (`src/components/profile/delete-account-dialog.tsx`), relies on the schema's `onDelete: Cascade` relations to clean up items/collections/accounts/sessions (`prisma/schema.prisma`), and calls `signOut` immediately after deletion to invalidate the session (`src/actions/profile.ts:61`).
- **No mass assignment:** every Prisma `create`/`update` touching `User` sets only explicit, allow-listed fields built from parsed/validated input (password hash, `emailVerified`) — none spread a raw request body into a Prisma call.
- **OAuth account-linking:** the GitHub provider is configured with no `allowDangerousEmailAccountLinking` override (`src/auth.config.ts:10`), so Auth.js's secure default (linking disabled) prevents an attacker from taking over an existing email/password account by signing in with GitHub using the same email.
- **Resend-verification scope:** `resendVerificationEmail` requires an active session and only ever emails the signed-in user's own address (`src/actions/auth.ts:24-43`) — it cannot be used to probe or spam arbitrary addresses.
- **Input validation:** all auth-adjacent Server Actions and the register route validate input with shared Zod schemas (`src/lib/validations/auth.ts`) before touching the database, and email is consistently trimmed/lowercased before lookups.
- **Route protection:** `src/proxy.ts` correctly gates `/dashboard/:path*` and `/profile/:path*` behind `req.auth`, redirecting to `/sign-in` with the original URL preserved as `callbackUrl`.

## Out of Scope (handled by NextAuth)

CSRF protection, cookie flags (`httpOnly`/`secure`/`sameSite`) on NextAuth's session/callback cookies, OAuth `state`/PKCE handling for the GitHub provider, and JWT signing/verification mechanics were not evaluated — these are managed internally by Auth.js v5 and are not the custom code this audit targets.
