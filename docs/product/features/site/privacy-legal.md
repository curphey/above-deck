# Privacy & Legal Compliance — Feature Specification

**Feature:** Privacy Policy, Cookie Policy, Cookie Consent, DSAR Form
**Status:** Draft
**Date:** 2026-03-31
**Package:** `packages/site/`
**Stack:** Astro 5 (SSR), React 19 islands, Tailwind CSS + Ant Design 5, Supabase
**License:** GPL — 100% free and open source
**Depends on:** Site Spec (`spec.md`), Data Model (`data-model.md`), API Spec (`api/spec.md`)

---

## 1. Overview

Four components that live in the site footer and handle privacy compliance. Above Deck is a 100% free, open-source, GPL-licensed project. There is no monetisation, no advertising, no data selling. This makes the privacy story unusually clean — the project collects the minimum data needed to make the tools work and the community function.

All four components are accessible without authentication. The privacy policy and cookie policy are static prerendered pages. The DSAR form is an SSR page with a React island. The cookie consent banner is a React island loaded on every page.

### Components

| Component | Route | Rendering | Purpose |
|-----------|-------|-----------|---------|
| Privacy Policy | `/privacy` | Static (prerendered) | What data we collect, why, and your rights |
| Cookie Policy | `/cookies` | Static (prerendered) | Every cookie the site sets, with purpose and lifetime |
| Cookie Consent Banner | (global component) | React island (`client:load`) | First-visit consent capture |
| DSAR Request Form | `/privacy/request` | SSR + React island | Exercise GDPR/CCPA data rights |

---

## 2. Privacy Policy Page (`/privacy`)

### 2.1 Page Structure

Static MDX page in Astro content collection or standalone `.astro` page. Uses `ContentLayout` with table of contents sidebar. All section text is written by humans (lawyers and project maintainers) — this spec defines structure only.

### 2.2 Required Sections

#### Section 1: Who We Are

- Project identity: Above Deck is an open-source project, GPL-licensed
- Organisational structure: foundation-owned (or specify governance model)
- Not a commercial entity — no shareholders, no investors, no advertising revenue
- Link to GitHub repository
- Contact email for privacy enquiries

#### Section 2: What Data We Collect

Organised by data category, each with: what it is, why we collect it, legal basis, and retention period.

**2a. Account Data**

| Field | Source | Purpose |
|-------|--------|---------|
| Email address | Google OAuth | Authentication, account recovery, DSAR verification |
| Display name | Google OAuth (editable) | Community identity |
| Avatar photo URL | Google OAuth (replaceable) | Community identity |

Legal basis: Contract (Article 6(1)(b)) — necessary to provide the account service the user requested.

**2b. Boat Data**

| Field | Source | Purpose |
|-------|--------|---------|
| Boat name, type, LOA, beam, draft | User-provided | Tools (energy sizer, passage planner) use boat specs for accurate calculations |
| MMSI | User-provided | AIS identification, unique vessel key |
| Equipment registry | User-provided | Energy sizer, maintenance tracking |
| Maintenance logs | User-provided | Boat management |

Legal basis: Contract (Article 6(1)(b)) — the user adds this data to use the tools.

**2c. Usage Analytics**

| Field | Source | Purpose |
|-------|--------|---------|
| Page views | Umami (self-hosted) | Understand which features are used |
| Referrer URLs | Umami | Understand how people find the project |
| Device type, browser, country | Umami | Platform compatibility decisions |

Collection method: Umami is cookieless, privacy-respecting analytics. No personal data is collected. All data is anonymised and aggregated. No individual user can be identified from analytics data. GDPR-compliant by design.

Legal basis: Legitimate interest (Article 6(1)(f)) — understanding aggregate usage to improve the platform. Users can opt out via cookie consent settings (which disables the Umami script entirely).

**2d. Instrument Data**

| Field | Source | Purpose |
|-------|--------|---------|
| NMEA 2000 instrument readings | Spoke hardware (opt-in) | Real-time boat monitoring, historical data |
| Battery, solar, GPS, wind data | Spoke hardware (opt-in) | Tool accuracy (actual vs estimated) |

Collection method: Only collected if the user (a) installs spoke hardware, (b) connects it to the hub, and (c) explicitly enables data upload. Triple opt-in.

Legal basis: Consent (Article 6(1)(a)) — explicit opt-in at each stage.

**2e. Position Data**

| Field | Source | Purpose |
|-------|--------|---------|
| GPS coordinates | Spoke hardware or browser geolocation | Position sharing, anchor watch, passage logging |

Collection method: Position sharing is off by default. User must explicitly enable it and choose visibility level (boat only, friends, public). Granularity controls available.

Legal basis: Consent (Article 6(1)(a)) — explicit opt-in with granular controls.

**2f. Community Content**

| Field | Source | Purpose |
|-------|--------|---------|
| Almanac entries | User-contributed | Community cruising guide |
| Forum posts | User-contributed | Community discussion |
| Reviews and ratings | User-contributed | Community knowledge |

This content is public by design — the user is contributing to a shared knowledge base. Content is attributed to the user's display name.

Legal basis: Contract (Article 6(1)(b)) — the user chose to publish content to the community.

#### Section 3: What We Do NOT Collect

Explicit statement of what the project does not do:

- No tracking pixels or web beacons
- No third-party analytics (Google Analytics, Mixpanel, Amplitude, etc.)
- No advertising networks or retargeting
- No data selling or sharing with data brokers
- No profiling for commercial purposes
- No cross-site tracking
- No fingerprinting
- No social media tracking widgets

#### Section 4: Data Processors

List of third-party services that process data on behalf of the project:

| Processor | Purpose | Data Processed | Location |
|-----------|---------|----------------|----------|
| Supabase | Database, authentication, file storage | Account data, boat data, community content | EU region (Frankfurt) |
| Fly.io | Go API server hosting | API requests (transient) | Configurable region |
| Cloudflare | CDN, Pages hosting, R2 storage | Static assets, cached pages | Global (edge network) |
| Google | OAuth provider | Email, name, avatar (during auth flow only) | US (Google infrastructure) |

Each processor has a Data Processing Agreement (DPA) in place. Links to each processor's DPA and privacy policy.

#### Section 5: Legal Basis Summary

| Processing Activity | Legal Basis (GDPR Art. 6) |
|---------------------|--------------------------|
| Account creation and authentication | Contract (6(1)(b)) |
| Boat data for tool functionality | Contract (6(1)(b)) |
| Community content (almanac, forums) | Contract (6(1)(b)) |
| Usage analytics (Umami) | Legitimate interest (6(1)(f)) |
| Instrument data upload | Consent (6(1)(a)) |
| Position sharing | Consent (6(1)(a)) |
| Email notifications | Consent (6(1)(a)) |

#### Section 6: Data Retention

| Data Category | Retention Period | Deletion Trigger |
|---------------|-----------------|------------------|
| Account data | Until account deletion | User-initiated or DSAR erasure request |
| Boat data | Until boat removed or account deleted | User-initiated |
| Community content | Indefinite (public knowledge base) | DSAR erasure request (anonymised, not deleted — content preserved, attribution removed) |
| Usage analytics | 24 months rolling | Automatic purge |
| Instrument data | Until user deletes or account deleted | User-initiated |
| Position data | 90 days rolling (historical), real-time deleted on disconnect | Automatic purge / disconnect |
| DSAR request records | 3 years (legal compliance) | Automatic purge |
| Cookie consent records | 3 years (proof of consent) | Automatic purge |

Account deletion behaviour: hard delete of all personal data. Community content is anonymised (attribution replaced with "Deleted User") but the content itself is preserved for the community. This is explained to the user during the deletion flow.

#### Section 7: International Transfers

- Primary database: Supabase EU region (Frankfurt, Germany) — data stays in the EU by default
- CDN: Cloudflare global network — cached static assets served from nearest edge node (no personal data in CDN cache)
- Google OAuth: authentication tokens transit Google's US infrastructure during the OAuth flow only — no personal data stored with Google beyond what the user's own Google account contains
- Transfer safeguards: Standard Contractual Clauses (SCCs) where applicable

#### Section 8: Your Rights

Users have the following rights under GDPR (EU/EEA) and CCPA (California):

| Right | GDPR Article | Description |
|-------|-------------|-------------|
| Access | Art. 15 | Request a copy of all data we hold about you |
| Rectification | Art. 16 | Request correction of inaccurate data |
| Erasure | Art. 17 | Request deletion of your data ("right to be forgotten") |
| Portability | Art. 20 | Receive your data in a structured, machine-readable format (JSON) |
| Restriction | Art. 18 | Request that we limit processing of your data |
| Objection | Art. 21 | Object to processing based on legitimate interest |
| Withdraw consent | Art. 7(3) | Withdraw consent for optional processing (instrument data, position sharing) |

CCPA-specific rights: right to know, right to delete, right to opt-out of sale (not applicable — we never sell data), right to non-discrimination.

How to exercise: link to DSAR form (`/privacy/request`). Also available via email to the project privacy contact.

Response time: 30 days (GDPR), 45 days (CCPA).

#### Section 9: Children

The project does not knowingly collect data from anyone under 16 years of age. If we become aware that data has been collected from a child under 16, we will delete it promptly. Google OAuth enforces its own age restrictions.

#### Section 10: Changes to This Policy

- Material changes: notification via email to all registered users and a banner on the site
- Non-material changes (clarifications, formatting): updated silently, change log maintained at the bottom of the page
- The "last updated" date is always displayed prominently at the top
- Previous versions are available in the project's Git history (link to GitHub)

#### Section 11: Contact

- Project email address for privacy enquiries
- Physical address (if foundation requires one)
- Link to DSAR form for formal requests
- Response time commitment

### 2.3 Page Design

- `ContentLayout` with left sidebar table of contents (same as KB articles)
- "Last updated" date displayed prominently below the page title
- Version history link (to GitHub commits for this file)
- Print-friendly styling (no fixed headers, clean typography)
- No cookie consent needed to read this page

---

## 3. Cookie Policy Page (`/cookies`)

### 3.1 Page Structure

Static MDX page. Same `ContentLayout` as privacy policy.

### 3.2 Cookie Inventory

#### Essential Cookies (No Consent Required)

These cookies are strictly necessary for the site to function. They cannot be disabled.

| Cookie | Purpose | Duration | httpOnly | Secure | SameSite |
|--------|---------|----------|----------|--------|----------|
| `sb-<project>-auth-token` | Supabase access token (JWT). Authenticates API requests. | 1 hour | Yes | Yes | Lax |
| `sb-<project>-auth-token-code-verifier` | PKCE code verifier during OAuth flow. Only exists during the sign-in process. | 10 minutes | Yes | Yes | Lax |
| `ad_returning` | Tracks whether the visitor has signed in before, so the header button shows "Log in" instead of "Sign up with Google". Contains no personal data — just `true` or absent. | 1 year | No | Yes | Lax |
| `ad_cookie_consent` | Stores the user's cookie consent choice. Without this cookie, the consent banner would appear on every page load. | 1 year | No | Yes | Lax |

#### Analytics

| Technology | Cookies Used | Notes |
|-----------|-------------|-------|
| Umami | **None** | Umami is cookieless analytics. It does not set any cookies, does not use localStorage, and does not fingerprint users. It counts page views using a hash of the visitor's IP + user agent, discarded after each session. This is a deliberate choice — we use Umami specifically because it requires no cookies and no consent under the ePrivacy Directive. We still ask for consent to load the Umami script as a courtesy, because we respect user autonomy. |

#### Functional Cookies (Consent Required)

| Cookie | Purpose | Duration | httpOnly | Secure | SameSite |
|--------|---------|----------|----------|--------|----------|
| `ad_theme` | Light/dark mode preference. Prevents flash of wrong theme on page load. Alternative: `localStorage` (but cookies work before JavaScript loads). | 1 year | No | Yes | Lax |
| `ad_one_tap_dismissed` | Records that the user dismissed the Google One Tap popup, so it is not shown again during the session. Only set if One Tap is enabled by admin. | Session | No | Yes | Lax |

#### Third-Party Cookies

**None.** This site does not set or allow any third-party cookies. There are no advertising cookies, no tracking cookies, no social media widgets, no embedded third-party content that sets cookies.

### 3.3 Cookie Count Summary

| Category | Count |
|----------|-------|
| Essential | 4 |
| Analytics (cookies) | 0 |
| Functional | 2 |
| Third-party | 0 |
| **Total** | **6** |

This is an unusually short cookie policy because the project deliberately minimises cookie usage.

### 3.4 Page Design

- Same `ContentLayout` as privacy policy
- Table format for cookie inventory (clear, scannable)
- "Last updated" date at top
- Link back to privacy policy
- Link to cookie consent settings (re-opens the consent modal)

---

## 4. Cookie Consent Banner

### 4.1 Component Architecture

React island component rendered on every page via `BaseLayout.astro`.

```
packages/site/src/components/consent/
  CookieConsentBanner.tsx     — banner + settings modal
  useConsent.ts               — React hook for consent state
  consentApi.ts               — API calls to record consent server-side
```

- Loaded as `client:load` — must render immediately, before any conditional scripts
- No third-party consent management platform (OneTrust, CookieBot, etc.) — the site has six cookies, a CMP would be absurd

### 4.2 Banner Behaviour

**Appearance trigger:** Banner appears when no `ad_cookie_consent` cookie exists (first visit, or cookie expired/cleared).

**Position:** Fixed to the bottom of the viewport, full-width horizontal bar. Does not overlay page content — page has bottom padding when banner is visible.

**Non-blocking:** The user can scroll, navigate, and use all site features while the banner is visible. The banner does not prevent interaction. Essential cookies are always set regardless of consent state.

**Visual design:**

- Matches site theme (light or dark mode follows system/user preference)
- Subtle top border using `Blueprint Grey` (`#2d2d4a` at low opacity)
- Inter body font, concise text
- Two buttons: primary action and secondary action (Ant Design `Button` component)

### 4.3 Banner Content

Two elements only:

1. Brief text explaining that the site uses essential cookies and optional analytics. Links to the cookie policy page (`/cookies`).
2. Two buttons:
   - **"Accept All"** (primary button) — accepts all cookie categories, dismisses banner
   - **"Cookie Settings"** (text/link button) — opens the settings modal

Note: all text/copy to be written by the project maintainer — this spec defines structure, not prose.

### 4.4 Settings Modal

Opened by the "Cookie Settings" button. Ant Design `Modal` component.

**Content:**

| Category | Toggle | Default | Can Disable |
|----------|--------|---------|-------------|
| Essential | Always on (no toggle, greyed-out switch) | On | No |
| Analytics (Umami) | Toggle switch | On | Yes |
| Functional (theme, One Tap) | Toggle switch | On | Yes |

Each category has a brief description explaining what it covers. The essential category explains why it cannot be disabled (authentication, consent storage).

**Buttons:**

- **"Save Preferences"** — saves the selected combination, dismisses banner
- **"Accept All"** — shortcut, same as banner button
- **"Reject All"** — disables all optional categories (analytics off, functional off)

### 4.5 Consent Storage

**Cookie:** `ad_cookie_consent` stores the consent state as a JSON-encoded value:

```json
{
  "essential": true,
  "analytics": true,
  "functional": true,
  "version": 1,
  "timestamp": "2026-03-31T12:00:00Z"
}
```

- Duration: 1 year
- `version` field: incremented when new cookie categories are added — if the stored version is lower than the current version, the banner reappears to collect consent for new categories

**Server-side record:** On consent submission, `POST /api/v1/privacy/consent` records the choice in the `cookie_consent` table (see section 7). This provides GDPR-compliant proof of consent.

- Authenticated users: linked to `user_id`
- Anonymous users: linked to a `session_id` (random UUID generated client-side, stored in the consent cookie)

### 4.6 Conditional Script Loading

The `useConsent()` hook exposes the current consent state to all React components:

```typescript
interface ConsentState {
  essential: boolean;    // always true
  analytics: boolean;
  functional: boolean;
  loaded: boolean;       // true once consent state is resolved
}

function useConsent(): ConsentState;
```

**Conditional behaviour based on consent:**

| Consent Category | If Accepted | If Declined |
|-----------------|-------------|-------------|
| Analytics | Umami `<script>` tag rendered | Umami script not loaded — no page view tracking |
| Functional | `ad_theme` cookie set, One Tap script loaded (if enabled) | Theme falls back to system preference or localStorage, One Tap disabled |

The Umami script must be conditionally rendered in the `<head>` based on consent state. Since the banner is a React island, the initial SSR render should NOT include the Umami script — it is injected client-side after consent is confirmed.

### 4.7 Re-consent

- If the `version` field in `ad_cookie_consent` is lower than the current version defined in the component, the banner reappears
- The user can re-open cookie settings at any time via a link in the footer ("Cookie Settings")
- The footer link triggers the same settings modal as the banner

---

## 5. DSAR Request Form (`/privacy/request`)

### 5.1 Page Structure

SSR Astro page with a React island form component. Uses `ContentLayout`. Available to anyone — authenticated or not.

```
packages/site/src/pages/privacy/request.astro
packages/site/src/components/privacy/DSARForm.tsx
```

### 5.2 Form Fields

| Field | Type | Required | Notes |
|-------|------|----------|-------|
| Email address | Text input (email validation) | Yes | Used for identity verification and response delivery |
| Request type | Dropdown select | Yes | See options below |
| Details | Textarea | No | Free-form text for specifics (e.g., "correct my boat name") |

**Request type options:**

| Value | Label | Description shown to user |
|-------|-------|--------------------------|
| `access` | Access my data | Get a copy of all data we hold about you |
| `rectify` | Correct my data | Request correction of inaccurate information |
| `erase` | Delete my data | Right to be forgotten — permanently delete all your data |
| `export` | Export my data | Download all your data in JSON format |
| `restrict` | Restrict processing | Ask us to limit how we process your data |
| `object` | Object to processing | Object to specific processing activities |
| `withdraw` | Withdraw consent | Withdraw consent for optional data processing |

### 5.3 Identity Verification

Two paths depending on authentication state:

**Authenticated user:**

- Email field is pre-filled and read-only (from session)
- `user_id` is attached to the DSAR record
- Request is immediately verified — no email verification step
- Status starts at `verified`

**Unauthenticated user:**

- Email field is editable
- On submit, a verification email is sent to the provided address with a one-time verification link
- The link calls `POST /api/v1/privacy/dsar/:id/verify` with a signed token
- Request status stays at `received` until email is verified, then moves to `verified`
- Unverified requests are automatically purged after 7 days

### 5.4 Form Submission Flow

1. User fills out the form and submits
2. Client calls `POST /api/v1/privacy/dsar`
3. Server creates a `dsar_requests` record with status `received` (or `verified` if authenticated)
4. If unauthenticated: server sends verification email
5. Server sends confirmation email to the requester with the request ID and expected timeline
6. Server notifies platform admins (email and/or admin dashboard notification)
7. Client shows a confirmation message with:
   - Request reference ID
   - Expected response time (30 days)
   - Note that a confirmation email has been sent
   - If unauthenticated: note that a verification email must be actioned first

### 5.5 Admin Processing

DSAR requests appear in the admin dashboard under a dedicated DSAR queue.

**Admin DSAR Queue (`/admin/dsar`):**

| Column | Content |
|--------|---------|
| Reference ID | UUID (truncated for display) |
| Email | Requester's email |
| Type | Request type label |
| Status | received / verified / processing / completed / rejected |
| Submitted | Date submitted |
| Deadline | 30 days from submission (highlighted if approaching) |
| Actions | View details, update status |

**Status flow:**

```
received → verified → processing → completed
                  ↘ rejected (with reason)
```

- `received`: request submitted, awaiting email verification (unauthenticated only)
- `verified`: email verified (or was authenticated), awaiting admin action
- `processing`: admin has started working on the request
- `completed`: request fulfilled, requester notified
- `rejected`: request invalid (e.g., no matching account), requester notified with reason

**Admin actions per request type:**

| Request Type | Admin Action |
|-------------|-------------|
| Access | Generate JSON export of all user data, send download link to requester |
| Rectify | Make the requested correction, confirm to requester |
| Erase | Trigger hard delete of all user data (same as account deletion in settings), confirm to requester. Community content is anonymised, not deleted. |
| Export | Generate JSON export (same format as Access), send download link |
| Restrict | Flag user record to restrict processing, confirm to requester |
| Object | Review objection, apply restriction or provide justification for continued processing |
| Withdraw | Remove consent flags, disable optional processing, confirm to requester |

**Audit trail:** Every admin action on a DSAR request is logged with timestamp and admin user ID. The `completed_by` field records who processed it. `response_notes` records what was done.

### 5.6 Page Design

- Clean form layout, not intimidating
- Brief introduction explaining what a DSAR is and what rights the user has (link to privacy policy section 8)
- Form uses Ant Design `Form`, `Input`, `Select`, `TextArea` components
- Show the 30-day response commitment prominently
- Success state: confirmation card with reference ID, not just a flash message
- Error state: clear error messages, retry capability

---

## 6. Footer Links

The site footer (`packages/site/src/components/layout/Footer.tsx` or `.astro`) includes a legal/privacy section with the following links:

| Link Label | Route | Notes |
|------------|-------|-------|
| Privacy Policy | `/privacy` | |
| Cookie Policy | `/cookies` | |
| Your Privacy Rights | `/privacy/request` | DSAR form |
| Cookie Settings | (opens modal) | Triggers the cookie consent settings modal via `useConsent()` hook |
| Terms of Use | `/terms` | Placeholder — not spec'd in this document |
| Open Source | (external) | Link to GitHub repository |

Footer link section should be clearly labelled (e.g., "Legal" or "Privacy") and visually grouped.

---

## 7. Data Model

### 7.1 DSAR Requests

```sql
CREATE TABLE dsar_requests (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  email           TEXT NOT NULL,
  user_id         UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  request_type    TEXT NOT NULL CHECK (request_type IN (
                    'access', 'rectify', 'erase', 'export',
                    'restrict', 'object', 'withdraw'
                  )),
  details         TEXT,
  status          TEXT NOT NULL DEFAULT 'received' CHECK (status IN (
                    'received', 'verified', 'processing', 'completed', 'rejected'
                  )),
  verification_token TEXT,               -- hashed token for email verification
  verified_at     TIMESTAMPTZ,
  completed_at    TIMESTAMPTZ,
  completed_by    UUID REFERENCES auth.users(id),
  response_notes  TEXT,
  created_at      TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at      TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- RLS: admins can read/update all. Requester can read their own (by email match if unauth, by user_id if auth).
-- Public can insert (to submit requests).
ALTER TABLE dsar_requests ENABLE ROW LEVEL SECURITY;
```

### 7.2 Cookie Consent Records

```sql
CREATE TABLE cookie_consent (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id         UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  session_id      TEXT,                   -- anonymous session identifier (UUID generated client-side)
  essential       BOOLEAN NOT NULL DEFAULT true,
  analytics       BOOLEAN NOT NULL DEFAULT true,
  functional      BOOLEAN NOT NULL DEFAULT true,
  consent_version INTEGER NOT NULL DEFAULT 1,
  consented_at    TIMESTAMPTZ NOT NULL DEFAULT now(),
  ip_hash         TEXT,                   -- SHA-256 hash of IP address (not raw IP — for GDPR proof without storing PII)
  user_agent      TEXT                    -- browser user agent string (for consent record)
);

-- RLS: authenticated users can read their own. Admins can read all. Public can insert.
ALTER TABLE cookie_consent ENABLE ROW LEVEL SECURITY;

-- Index for lookup by user or session
CREATE INDEX idx_cookie_consent_user_id ON cookie_consent(user_id) WHERE user_id IS NOT NULL;
CREATE INDEX idx_cookie_consent_session_id ON cookie_consent(session_id) WHERE session_id IS NOT NULL;
```

---

## 8. API Endpoints

All endpoints are served by the Go API server (`packages/api/`).

### 8.1 Privacy / DSAR Endpoints

#### POST /api/v1/privacy/dsar

Submit a DSAR request.

**Auth:** None required (unauthenticated requests allowed).

**Request body:**

```json
{
  "email": "user@example.com",
  "request_type": "access",
  "details": "I would like a copy of all data associated with my account."
}
```

**Behaviour:**

1. Validate email format and request type
2. If authenticated: attach `user_id`, set status to `verified`
3. If unauthenticated: generate verification token, send verification email, set status to `received`
4. Insert `dsar_requests` record
5. Send confirmation email to requester
6. Notify admins

**Response:** `201 Created`

```json
{
  "id": "uuid",
  "status": "received",
  "message": "Request submitted. Check your email for verification."
}
```

**Rate limit:** 3 requests per email per 24 hours.

#### POST /api/v1/privacy/dsar/:id/verify

Verify email for an unauthenticated DSAR request.

**Auth:** None (token-based verification).

**Request body:**

```json
{
  "token": "verification-token-from-email"
}
```

**Behaviour:**

1. Validate token against stored hash
2. Update status from `received` to `verified`
3. Set `verified_at` timestamp

**Response:** `200 OK`

#### GET /api/v1/privacy/dsar/:id

Check the status of a DSAR request.

**Auth:** Requires either (a) authenticated user whose `user_id` matches the request, or (b) valid email verification token as query parameter.

**Response:** `200 OK`

```json
{
  "id": "uuid",
  "request_type": "access",
  "status": "processing",
  "created_at": "2026-03-31T12:00:00Z",
  "completed_at": null
}
```

### 8.2 Admin DSAR Endpoints

#### GET /api/v1/admin/dsar

List all DSAR requests.

**Auth:** Admin only (`platform_role = 'admin'`).

**Query params:** `status` (filter), `page`, `per_page`

**Response:** `200 OK` with paginated list of DSAR requests.

#### PATCH /api/v1/admin/dsar/:id

Update a DSAR request status.

**Auth:** Admin only.

**Request body:**

```json
{
  "status": "completed",
  "response_notes": "Data export sent to user's email."
}
```

**Behaviour:**

1. Update status, `completed_at`, `completed_by`
2. If status is `completed` or `rejected`: send notification email to requester
3. Log the action in audit trail

### 8.3 Consent Endpoints

#### POST /api/v1/privacy/consent

Record a cookie consent choice.

**Auth:** None required (anonymous consent is valid).

**Request body:**

```json
{
  "session_id": "client-generated-uuid",
  "essential": true,
  "analytics": true,
  "functional": false,
  "consent_version": 1
}
```

**Behaviour:**

1. If authenticated: attach `user_id`
2. Hash the client IP (SHA-256, not stored raw)
3. Record `user_agent` from request headers
4. Insert `cookie_consent` record
5. Do NOT update or overwrite previous records — each consent action is a new row (audit trail)

**Response:** `201 Created`

#### GET /api/v1/privacy/consent

Get current consent state for an authenticated user.

**Auth:** Required (returns the most recent consent record for the authenticated user).

**Response:** `200 OK`

```json
{
  "essential": true,
  "analytics": true,
  "functional": true,
  "consent_version": 1,
  "consented_at": "2026-03-31T12:00:00Z"
}
```

### 8.4 Data Export Endpoint

#### GET /api/v1/privacy/export

Export all user data as JSON.

**Auth:** Required (authenticated users only — exports their own data).

**Response:** `200 OK` with `Content-Type: application/json` and `Content-Disposition: attachment; filename="above-deck-data-export.json"`

**Export includes:**

- User profile (all fields)
- Boats (all boats owned or co-owned)
- Equipment registry (for owned boats)
- Maintenance logs (for owned boats)
- Passages (as crew or captain)
- Community content (almanac entries, forum posts, reviews)
- Saved tool configurations (routes, energy plans, etc.)
- Social connections (friends, follows)
- Consent history
- DSAR request history

**Does NOT include:**

- Other users' data (even if connected)
- Aggregated analytics
- Admin/moderation records

---

## 9. Implementation Notes

### 9.1 File Structure

```
packages/site/src/
  pages/
    privacy.astro                          # Privacy policy page
    cookies.astro                          # Cookie policy page
    privacy/
      request.astro                        # DSAR form page
    terms.astro                            # Terms of use (placeholder)
  components/
    consent/
      CookieConsentBanner.tsx              # Banner + settings modal
      useConsent.ts                        # Consent state hook
      consentApi.ts                        # API client for consent endpoints
    privacy/
      DSARForm.tsx                         # DSAR request form
```

### 9.2 Consent Hook Integration

The `useConsent()` hook must be available globally. Recommended: wrap the app in a consent provider or use Zustand for consent state. The hook reads from the `ad_cookie_consent` cookie on mount and provides the current state to all consumers.

Conditional script loading pattern for Umami in `BaseLayout.astro`:

```astro
---
// Server-side: read cookie to determine initial consent state
const consentCookie = Astro.cookies.get('ad_cookie_consent');
const consent = consentCookie ? JSON.parse(consentCookie.value) : null;
const analyticsConsented = consent?.analytics ?? false;
---

<head>
  {analyticsConsented && (
    <script
      defer
      src="https://analytics.example.com/script.js"
      data-website-id="your-website-id"
    />
  )}
</head>
```

Client-side: the React consent banner updates the cookie and triggers a page reload (or dynamic script injection) when analytics consent changes.

### 9.3 Testing

| Test | Type | What It Verifies |
|------|------|-----------------|
| Banner appears on first visit | Playwright e2e | No `ad_cookie_consent` cookie → banner visible |
| Banner does not appear on return visit | Playwright e2e | Cookie exists → banner not visible |
| Accept All sets correct cookie | Playwright e2e | Cookie contains `{"essential":true,"analytics":true,"functional":true}` |
| Reject analytics disables Umami | Playwright e2e | Umami script tag not in DOM |
| DSAR form submits correctly | Playwright e2e | Form submission → confirmation shown |
| DSAR form validation | Vitest unit | Email validation, required fields |
| useConsent hook returns correct state | Vitest unit | Hook reads cookie, returns parsed state |
| Consent API records choice | Vitest unit / integration | POST /api/v1/privacy/consent creates record |
| Admin DSAR queue loads | Playwright e2e | Admin sees pending requests |
| Data export includes all user data | Integration | Export JSON contains expected keys |
| Re-consent on version bump | Playwright e2e | Lower version in cookie → banner reappears |

### 9.4 Build Phase

These components belong in **Phase 1: Foundation** (from `spec.md` section 15). The cookie consent banner must be in place before any analytics or functional cookies are set. The privacy and cookie policy pages should launch with the site. The DSAR form can follow shortly after, but should be available before any user data is collected.

---

## 10. Open Questions

1. **Foundation entity:** What legal entity operates the project? This affects the "Who We Are" section and the data controller identity. Placeholder until governance structure is finalised.
2. **DPO:** Does the project need a Data Protection Officer? Likely not required (not a public authority, not large-scale systematic monitoring), but worth confirming.
3. **UK GDPR:** Post-Brexit, UK has its own GDPR. If UK users are a significant audience, the privacy policy should reference UK GDPR and the ICO as supervisory authority.
4. **Community content deletion vs anonymisation:** The spec says community content is anonymised on account deletion. Should this be configurable — let the user choose between anonymisation and full deletion? Full deletion would remove the content entirely, which may affect other community members who replied to it.
5. **Consent for embedded content:** If blog posts or KB articles embed YouTube videos (via `astro-embed`), YouTube sets cookies. This would need to be addressed in the cookie policy and consent banner. Consider privacy-enhanced mode (`youtube-nocookie.com`) or click-to-load.
