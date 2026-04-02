# API & Authentication Specification

**Date:** 2026-03-31
**Status:** Draft
**Component:** Go API Server (`packages/api/`), Supabase Auth
**Depends on:** Data Model (`data-model.md`), Sync Engine (`sync-engine/spec.md`), Technical Architecture
**License:** GPL — 100% free and open source

---

## 1. Authentication

### 1.1 Provider: Supabase Auth with PKCE Flow

Supabase Auth is the sole authentication provider. The PKCE (Proof Key for Code Exchange) flow is required because the site uses SSR — there is no client secret to protect in a server-rendered environment.

**Launch:** Google OAuth only. Single sign-in button.

**Post-launch:** Apple Sign In via the same PKCE flow. Required for iOS App Store compliance if the PWA is distributed via App Store.

No email/password auth. No magic links. Social auth only — reduces password management burden and eliminates credential-stuffing attacks.

### 1.2 Google One Tap (Optional, Admin-Configurable)

Google One Tap (Google Identity Services) shows a native Chrome popup with the user's Google accounts — single tap to sign in, no redirect. **Off by default** to avoid being intrusive to first-time visitors. Platform admins can enable it via site settings.

**How it works (when enabled):**

1. Load `accounts.google.com/gsi/client` script on every page
2. Configure with the project's Google OAuth client ID
3. Chrome detects the user is signed into Google → shows the One Tap popup automatically
4. User taps their account → Google returns a JWT credential
5. Frontend calls `supabase.auth.signInWithIdToken({ provider: 'google', token: credential })`
6. Supabase creates the user (first visit) or logs them in (returning)
7. Session cookies set, page updates to logged-in state — no redirect, no page reload

**Admin configuration (site settings):**

| Setting | Default | Description |
|---------|---------|-------------|
| `one_tap_enabled` | `false` | Enable/disable Google One Tap globally |
| `one_tap_context` | `signin` | Popup text context: `signin`, `signup`, or `use` |
| `one_tap_auto_prompt` | `true` | Show popup automatically vs only on button click |

**Default flow (One Tap off):**

The header button is the primary sign-in mechanism. It triggers the standard PKCE redirect flow via `POST /api/auth/signin`. Button text changes based on cookie:
- No cookie → "Sign up with Google"
- Has `ad_returning=true` cookie → "Log in"

Both paths use the same Google OAuth — the only difference is the button label. Signup and login are the same flow.

**When One Tap is enabled:**

| State | One Tap | Fallback |
|-------|---------|----------|
| New visitor in Chrome | Popup appears automatically | Header button still works |
| Returning user in Chrome | Same popup, faster recognition | Header button still works |
| Safari / Firefox | No popup (Chrome-only) | Header button (PKCE flow) |
| User dismisses popup | Google's cooldown prevents re-show | Header button still works |
| Already logged in | No popup | Avatar + dropdown in header |

### 1.3 Token Lifecycle

| Token | Lifetime | Storage | Purpose |
|-------|----------|---------|---------|
| Access token (JWT) | 1 hour | httpOnly secure cookie | API authentication, RLS enforcement |
| Refresh token | 30 days | httpOnly secure cookie | Silent token renewal |

Both cookies are set with:

- `httpOnly: true` — not accessible to JavaScript (XSS protection)
- `secure: true` — HTTPS only
- `sameSite: lax` — CSRF protection while allowing OAuth redirects
- `path: /` — available to all routes

The access token JWT contains:

```json
{
  "sub": "user-uuid",
  "email": "user@example.com",
  "role": "authenticated",
  "iat": 1711900800,
  "exp": 1711904400,
  "iss": "https://your-project.supabase.co/auth/v1"
}
```

The JWT does **not** contain platform role or boat access information. These are resolved server-side on each request to ensure they reflect the current state.

### 1.4 Auth Endpoints

These are Astro SSR endpoints in `packages/site/src/pages/api/auth/`, not Go API endpoints. They handle the OAuth dance and cookie management.

#### POST /api/auth/signin

Initiates the OAuth flow.

**Request:**

```json
{
  "provider": "google",
  "redirect_to": "/account/profile"
}
```

**Behaviour:**

1. Generate PKCE code verifier and challenge.
2. Store code verifier in httpOnly cookie (short-lived, 10 minutes).
3. Redirect to Supabase Auth URL with provider, PKCE challenge, and redirect URI.

#### GET /api/auth/callback

Handles the OAuth callback from Supabase Auth.

**Query parameters:** `code` (authorization code from Supabase)

**Behaviour:**

1. Exchange authorization code + PKCE code verifier for tokens via Supabase Auth API.
2. Set access token and refresh token as httpOnly secure cookies.
3. Upsert user record in `users` table (create on first login, update `last_seen_at` on subsequent logins).
4. Redirect to the `redirect_to` URL from the signin request (default: `/`).

#### POST /api/auth/signout

Clears the session.

**Behaviour:**

1. Revoke the refresh token via Supabase Auth API.
2. Clear access token and refresh token cookies (set to expired).
3. Return 200 OK.

#### POST /api/auth/refresh

Silently refreshes the access token using the refresh token.

**Behaviour:**

1. Read refresh token from httpOnly cookie.
2. Call Supabase Auth token refresh endpoint.
3. Set new access token and refresh token cookies.
4. Return 200 OK with new expiry timestamp.

**When called:**

- Automatically by the API client middleware when a request returns 401.
- Proactively by the client when the access token is within 5 minutes of expiry.

#### GET /api/auth/me

Returns the current authenticated user's profile.

**Response (200):**

```json
{
  "user": {
    "id": "uuid",
    "email": "user@example.com",
    "display_name": "Mark",
    "photo_url": "https://...",
    "platform_role": "user",
    "boats": [
      {
        "id": "boat-uuid",
        "name": "SV Artemis",
        "role": "owner"
      }
    ]
  }
}
```

**Response (401):** Not authenticated.

### 1.5 Server-Side Session Validation (Astro SSR)

Astro SSR pages validate the session on every request:

```
1. Read access token from httpOnly cookie.
2. Verify JWT signature using Supabase public key (cached in memory).
3. Check expiry. If expired, attempt silent refresh via refresh token.
4. If refresh fails, redirect to sign-in page (for auth-required pages) or render as anonymous.
5. If valid, resolve user from database and inject into Astro.locals.
```

The Supabase JWT public key is fetched once at server startup from `https://<project>.supabase.co/auth/v1/.well-known/jwks.json` and cached. It is refreshed every 24 hours.

### 1.6 Client-Side Session Check (React Islands)

React islands check the session via the Supabase JS client:

```typescript
import { createBrowserClient } from '@supabase/ssr'

const supabase = createBrowserClient(
  SUPABASE_URL,
  SUPABASE_ANON_KEY
)

// The Supabase JS client reads cookies automatically
// and manages token refresh in the background.
const { data: { session } } = await supabase.auth.getSession()
```

React components use the `useAuth()` hook (Zustand store backed by Supabase session) to access the current user.

### 1.7 Token Refresh Flow

```
Client makes API request
  → 401 Unauthorized (access token expired)
    → Client calls POST /api/auth/refresh
      → Refresh token valid?
        → Yes: new access token + refresh token set as cookies, retry original request
        → No: redirect to /api/auth/signin (session fully expired)
```

The Supabase JS client handles this automatically for client-side requests. Server-side (Astro SSR) middleware handles it for page loads.

### 1.8 Spoke Authentication

The spoke (on-boat instance) operates in two auth modes:

**Online mode (hub reachable):**

- User authenticates via the same OAuth flow, served by the spoke's local web server.
- The spoke proxies the auth request to the hub's Supabase Auth.
- JWT tokens are stored locally.
- The spoke validates JWTs using the Supabase public key, cached locally.

**Offline mode (hub unreachable):**

- JWTs are validated against the locally cached Supabase public key.
- The public key is refreshed whenever the spoke syncs with the hub.
- If the access token has expired and no refresh is possible (no internet), the spoke allows continued access for users whose JWT was valid within the last 30 days (the refresh token window). This is a deliberate security trade-off for offshore use.
- A local admin PIN (4-8 digits, set during spoke setup) provides emergency access when no valid JWT exists. This PIN grants full local admin access to the spoke only — it cannot be used to authenticate with the hub.
- The admin PIN is stored as a bcrypt hash in the spoke's local SQLite database.

**Spoke sync authentication:**

- Sync sessions authenticate with the hub using the boat owner's JWT.
- The hub verifies the JWT and resolves boat ownership/access to authorise the sync.
- If the JWT has expired during a long offshore period, the spoke queues sync requests until a user re-authenticates.

### 1.9 API Key Authentication

API keys provide non-interactive authentication for third-party integrations, MCP access, and CI/CD pipelines.

**Generation:**

- Users generate API keys in account settings (`/account/settings`).
- Each key is a 256-bit random value, Base62-encoded, prefixed with `ad_` for identification: `ad_7kR3mX9pQ2vL...`
- The key is displayed once at creation. Only a SHA-256 hash is stored in the database.

**Storage:**

```
api_keys
  id              UUID PRIMARY KEY
  user_id         UUID REFERENCES users(id)
  name            TEXT NOT NULL              -- user-provided label, e.g. "Home Assistant"
  key_hash        TEXT NOT NULL              -- SHA-256 hash of the key
  key_prefix      TEXT NOT NULL              -- first 8 chars for identification in UI
  scope           ENUM('read', 'read_write')
  last_used_at    TIMESTAMPTZ
  expires_at      TIMESTAMPTZ               -- null = no expiry
  created_at      TIMESTAMPTZ DEFAULT now()
  revoked_at      TIMESTAMPTZ               -- null = active
```

**Usage:**

```
Authorization: Bearer ad_7kR3mX9pQ2vL...
```

The Go API server detects the `ad_` prefix to distinguish API keys from JWTs. API key requests resolve to the owning user and inherit that user's permissions. The `scope` field further restricts: a `read` key cannot make write requests.

**Constraints:**

- Maximum 10 active API keys per user.
- API keys are rate limited separately from session auth (see section 3.4).
- API keys cannot access auth endpoints (signin, signout, refresh).
- API keys can be revoked individually in account settings.
- Expired or revoked keys return 401 immediately.

---

## 2. Authorization

### 2.1 Platform Roles

Platform roles are site-wide, stored on `user.platform_role`. They are independent of boat-level roles.

| Role | Capabilities |
|------|-------------|
| `user` | Use the platform, own boats, use tools, participate in community |
| `moderator` | All user capabilities + manage content review queue, flag/hide posts, warn users |
| `admin` | All moderator capabilities + manage users (suspend/delete), site settings, analytics, access any boat's data for support |

### 2.2 Boat Roles

Boat access is determined by the union of two tables:

**Permanent access** via `boat_owners`:

| Role | Access Level |
|------|-------------|
| `owner` | Full access. Can add/remove co-owners, delete boat, transfer ownership. |
| `co_owner` | Full access except: cannot remove original owner, cannot delete boat. |

**Temporary/role-based access** via `boat_access_grants`:

| Role | Default Permissions |
|------|-------------------|
| `captain` | Full operational access for the grant duration. Everything an owner can do except manage ownership or other access grants. |
| `crew` | View boat data, contribute to logbook, use tools, manage routes. |
| `technician` | View boat data, edit equipment registry, manage maintenance. |
| `family` | Read-only monitoring: position, basic status (batteries, bilge, anchor alarm), weather. |

Access grants have optional `start_date` and `end_date` fields. Grants can be revoked at any time by any boat owner. The `permissions` JSONB field on each grant allows per-grant overrides of role defaults.

### 2.3 Checking Boat Access

To determine whether a user can access a boat, the API checks the union of ownership and active grants:

```sql
-- Does user X have access to boat Y?
SELECT EXISTS (
  SELECT 1 FROM boat_owners
  WHERE boat_id = $1 AND user_id = $2

  UNION ALL

  SELECT 1 FROM boat_access_grants
  WHERE boat_id = $1 AND user_id = $2
    AND (start_date IS NULL OR start_date <= CURRENT_DATE)
    AND (end_date IS NULL OR end_date >= CURRENT_DATE)
    AND revoked_at IS NULL
);
```

For permission-specific checks (e.g., "can this user edit equipment on this boat?"), the API resolves the user's role and applicable permissions:

```go
func CanEditEquipment(userID, boatID uuid.UUID) bool {
    // Owners and co-owners: always yes
    if IsOwner(userID, boatID) {
        return true
    }
    // Check access grants
    grant := GetActiveGrant(userID, boatID)
    if grant == nil {
        return false
    }
    // Check explicit permission override first
    if grant.Permissions != nil {
        if v, ok := grant.Permissions["edit_equipment"]; ok {
            return v
        }
    }
    // Fall back to role defaults
    return grant.Role == "captain" || grant.Role == "technician"
}
```

### 2.4 Middleware Chain

Every API request passes through the following middleware chain:

```
Request
  → Rate Limiter (per IP for unauthenticated, per user/key for authenticated)
    → CORS Check (reject disallowed origins)
      → Auth Middleware (extract + validate JWT or API key)
        → User Lookup (resolve user from auth, set on request context)
          → Route Handler
            → Permission Check (platform role, boat role, specific permission)
              → Database Query (Supabase RLS provides defence-in-depth)
```

**Auth middleware** extracts the token from the `Authorization` header or the httpOnly cookie. It validates the JWT signature, checks expiry, and sets the authenticated user on the request context. If no valid token is found, the request continues as unauthenticated (anonymous). Route handlers that require authentication return 401 for anonymous requests.

**Permission checks** happen at two levels:

1. **Go middleware** (application level) — fast, explicit, returns clear error messages. This is the primary enforcement mechanism.
2. **Supabase RLS** (database level) — defence-in-depth. Even if a middleware bug allows an unauthorised request through, RLS prevents data access. RLS policies use `auth.uid()` from the JWT.

Both levels must agree. If either denies access, the request fails.

### 2.5 Admin Access

Platform admins can access any boat's data for support purposes. This access is:

- Logged in the `activity_log` table with `action = 'admin_boat_access'`.
- Not transparent to the boat owner (they do not see admin views in their audit trail).
- Used only for support cases (e.g., user locked out of their boat, data migration, debugging).
- Admin access does not bypass RLS by default. Admin requests use a separate Supabase service role key, which bypasses RLS, only for specific admin endpoints.

---

## 3. API Design

### 3.1 Conventions

**Base URL:** `https://api.abovedeck.io/api/v1`

**Format:** JSON request and response bodies. `Content-Type: application/json`.

**HTTP methods:**

| Method | Usage |
|--------|-------|
| `GET` | Read resources. Never modifies state. |
| `POST` | Create resources or trigger actions. |
| `PATCH` | Partial update of a resource. Only include fields to change. |
| `DELETE` | Remove a resource. |

`PUT` is not used. All updates are partial via `PATCH`.

**Resource naming:**

- Plural nouns: `/boats`, `/users`, `/groups`
- Nested resources: `/boats/:id/equipment`, `/boats/:id/passages/:id/crew`
- Actions as verbs on resources: `/friends/request`, `/friends/accept`

**IDs:** UUIDs in URL paths and response bodies.

### 3.2 Pagination

Cursor-based pagination for all list endpoints. Offset-based pagination is not used — it performs poorly at scale and produces inconsistent results when data changes between pages.

**Request parameters:**

| Parameter | Type | Default | Description |
|-----------|------|---------|-------------|
| `cursor` | string | (none) | Opaque cursor from previous response |
| `limit` | integer | 25 | Items per page (max 100) |

**Response:**

```json
{
  "data": [...],
  "pagination": {
    "next_cursor": "eyJpZCI6IjEyMyJ9",
    "has_more": true,
    "total": 142
  }
}
```

The cursor is a Base64-encoded JSON object containing the sort key(s) of the last item in the current page. The `total` field is included only when the query can compute it cheaply (e.g., small result sets). For large collections, `total` is omitted and only `has_more` is provided.

### 3.3 Filtering and Sorting

List endpoints support filtering via query parameters:

```
GET /api/v1/boats/:id/equipment?category=electrical&status=active&sort=-installed_at
```

- Filter fields are endpoint-specific and documented per endpoint.
- Sort: `sort=field` (ascending), `sort=-field` (descending). Default sort is endpoint-specific.
- Multiple sort fields: `sort=-updated_at,name`

### 3.4 Rate Limiting

Rate limits are enforced per authentication context:

| Context | Read Limit | Write Limit | Window |
|---------|-----------|------------|--------|
| Authenticated user (session) | 100 req/min | 20 req/min | Sliding window |
| API key | 60 req/min | 10 req/min | Sliding window |
| Unauthenticated | 30 req/min | 0 (no writes) | Per IP, sliding window |

**Sensitive endpoints** have tighter limits:

| Endpoint | Limit | Rationale |
|----------|-------|-----------|
| `POST /api/v1/auth/signin` | 10 req/min per IP | Prevent brute force |
| `GET /api/v1/users/search` | 10 req/min | Anti-scraping |
| `GET /api/v1/almanac/entries` | 30 req/min | Anti-scraping |
| `POST /api/v1/sync/*` | 30 req/min | Prevent sync storms |

**Rate limit headers** on every response:

```
X-RateLimit-Limit: 100
X-RateLimit-Remaining: 87
X-RateLimit-Reset: 1711900860
```

When rate limited, the API returns:

```json
{
  "error": {
    "code": "RATE_LIMITED",
    "message": "Rate limit exceeded. Try again in 23 seconds.",
    "status": 429
  }
}
```

### 3.5 CORS

CORS is restricted to known origins:

```
Access-Control-Allow-Origin: https://abovedeck.io
Access-Control-Allow-Methods: GET, POST, PATCH, DELETE, OPTIONS
Access-Control-Allow-Headers: Content-Type, Authorization
Access-Control-Allow-Credentials: true
Access-Control-Max-Age: 86400
```

Additional allowed origins:

- `https://www.abovedeck.io`
- `http://localhost:4321` (Astro dev server, development only)
- Spoke local origins (`http://abovedeck.local`, `http://localhost:8080`)

No wildcard origins. No cross-origin requests from unknown domains.

### 3.6 Request/Response Examples

**Successful response:**

```json
{
  "data": {
    "id": "550e8400-e29b-41d4-a716-446655440000",
    "name": "SV Artemis",
    "mmsi": "235012345",
    "created_at": "2026-01-15T10:30:00Z"
  }
}
```

**List response:**

```json
{
  "data": [
    { "id": "...", "name": "SV Artemis" },
    { "id": "...", "name": "SV Horizon" }
  ],
  "pagination": {
    "next_cursor": "eyJpZCI6IjU1MGU4NDAw...",
    "has_more": false
  }
}
```

**Error response:**

```json
{
  "error": {
    "code": "BOAT_NOT_FOUND",
    "message": "Boat with ID 550e8400-e29b-41d4-a716-446655440000 not found.",
    "status": 404
  }
}
```

**Validation error response:**

```json
{
  "error": {
    "code": "VALIDATION_ERROR",
    "message": "Request validation failed.",
    "status": 422,
    "details": [
      { "field": "name", "message": "Name is required." },
      { "field": "mmsi", "message": "MMSI must be exactly 9 digits." }
    ]
  }
}
```

---

## 4. API Endpoints

All endpoints are prefixed with `/api/v1`. Authentication requirements are noted per endpoint. Boat-scoped endpoints enforce boat access checks (ownership or active access grant) unless otherwise noted.

### 4.1 Auth

Auth endpoints are Astro SSR endpoints, not Go API routes. Documented here for completeness.

| Method | Path | Auth | Description |
|--------|------|------|-------------|
| `POST` | `/api/auth/signin` | No | Initiate OAuth flow |
| `GET` | `/api/auth/callback` | No | Handle OAuth callback, set cookies |
| `POST` | `/api/auth/signout` | Yes | Clear cookies, revoke session |
| `POST` | `/api/auth/refresh` | Refresh token | Refresh access token |
| `GET` | `/api/auth/me` | Yes | Current user profile + boats |

### 4.2 Users

| Method | Path | Auth | Description |
|--------|------|------|-------------|
| `GET` | `/api/v1/users/:id` | Yes | Get user profile (respects privacy settings) |
| `PATCH` | `/api/v1/users/:id` | Yes (self) | Update own profile |
| `GET` | `/api/v1/users/search` | Yes | Search users by display name (rate limited) |
| `DELETE` | `/api/v1/users/:id` | Yes (self or admin) | Delete account (GDPR) |

#### GET /api/v1/users/:id

Returns a user profile filtered by the requesting user's relationship to the target:

- **Self:** All fields.
- **Boat mate:** Fields with visibility `boat_only` or less restrictive.
- **Friend:** Fields with visibility `friends` or less restrictive.
- **Other authenticated user:** Fields with visibility `public` only.
- **Admin:** All fields (logged).

#### PATCH /api/v1/users/:id

Users can only update their own profile. Updatable fields:

```json
{
  "display_name": "Mark C",
  "bio": "Sailing the Med on a Lagoon 42",
  "phone": "+44...",
  "location_city": "Gibraltar",
  "location_country": "GI",
  "sailing_experience": "offshore",
  "certifications": [...],
  "units_preference": "nautical",
  "privacy_settings": { "email": "private", "phone": "boat_only" },
  "position_sharing": "friends"
}
```

Fields not included in the request body are left unchanged (PATCH semantics).

#### DELETE /api/v1/users/:id (GDPR)

- **Self:** User deletes their own account. Requires confirmation via request body: `{ "confirm": true }`.
- **Admin:** Admin deletes a user account. Requires `{ "confirm": true, "reason": "..." }`.

Behaviour:

1. Anonymise user record (`display_name` set to "Deleted User", all PII fields nulled).
2. Preserve logbook entries and community contributions attributed to "Deleted User".
3. End all boat ownership (transfer or orphan — admin handles before deletion).
4. Revoke all access grants.
5. Revoke all API keys.
6. Delete Supabase Auth account.
7. Log the deletion in `activity_log`.

### 4.3 Boats

| Method | Path | Auth | Boat Access | Description |
|--------|------|------|-------------|-------------|
| `POST` | `/api/v1/boats` | Yes | -- | Create a new boat (caller becomes owner) |
| `GET` | `/api/v1/boats` | Yes | -- | List boats the user owns or has access to |
| `GET` | `/api/v1/boats/:id` | Yes | Any | Get boat detail |
| `PATCH` | `/api/v1/boats/:id` | Yes | Owner, co-owner, captain | Update boat profile |
| `DELETE` | `/api/v1/boats/:id` | Yes | Owner only | Delete boat and all associated data |

#### POST /api/v1/boats

Creates a new boat. The authenticated user becomes the `owner`.

```json
{
  "name": "SV Artemis",
  "mmsi": "235012345",
  "type": "catamaran",
  "make": "Lagoon",
  "model": "42",
  "year": 2020,
  "flag": "GB"
}
```

**Response (201):**

```json
{
  "data": {
    "id": "boat-uuid",
    "name": "SV Artemis",
    "mmsi": "235012345",
    "...": "..."
  }
}
```

#### GET /api/v1/boats

Returns all boats the user has access to (union of `boat_owners` and active `boat_access_grants`). Each boat includes the user's role.

```json
{
  "data": [
    {
      "id": "boat-uuid",
      "name": "SV Artemis",
      "mmsi": "235012345",
      "user_role": "owner"
    },
    {
      "id": "boat-uuid-2",
      "name": "SY Horizon",
      "user_role": "captain",
      "grant_end_date": "2026-04-15"
    }
  ]
}
```

### 4.4 Boat Ownership

| Method | Path | Auth | Boat Access | Description |
|--------|------|------|-------------|-------------|
| `GET` | `/api/v1/boats/:id/owners` | Yes | Any | List boat owners |
| `POST` | `/api/v1/boats/:id/owners` | Yes | Owner only | Add co-owner |
| `DELETE` | `/api/v1/boats/:id/owners/:userId` | Yes | Owner only | Remove co-owner |

#### POST /api/v1/boats/:id/owners

Add a co-owner. The target user must already have a platform account.

```json
{
  "user_id": "target-user-uuid",
  "role": "co_owner"
}
```

**Rules:**

- Only the `owner` (not co-owners) can add or remove co-owners.
- The `owner` role cannot be assigned via this endpoint — it is set at boat creation.
- Cannot add someone who is already an owner or co-owner.

#### DELETE /api/v1/boats/:id/owners/:userId

Remove a co-owner. The original `owner` cannot be removed (they must transfer or delete the boat).

### 4.5 Boat Access Grants

| Method | Path | Auth | Boat Access | Description |
|--------|------|------|-------------|-------------|
| `GET` | `/api/v1/boats/:id/access` | Yes | Owner, co-owner | List active access grants |
| `POST` | `/api/v1/boats/:id/access` | Yes | Owner, co-owner | Grant access |
| `DELETE` | `/api/v1/boats/:id/access/:grantId` | Yes | Owner, co-owner | Revoke access grant |

#### POST /api/v1/boats/:id/access

```json
{
  "user_id": "target-user-uuid",
  "role": "captain",
  "start_date": "2026-04-01",
  "end_date": "2026-04-15",
  "permissions": {
    "edit_equipment": true,
    "view_finances": false
  }
}
```

**Rules:**

- Only boat owners (`owner` or `co_owner`) can create access grants.
- The `granted_by` field is automatically set to the authenticated user.
- `start_date` and `end_date` are optional. Null `start_date` means immediate. Null `end_date` means indefinite.
- The `permissions` JSONB overrides role defaults for this specific grant.

#### DELETE /api/v1/boats/:id/access/:grantId

Revokes an access grant. Sets `revoked_at` and `revoked_by` on the grant record (soft delete for audit trail).

### 4.6 Equipment

| Method | Path | Auth | Boat Access | Description |
|--------|------|------|-------------|-------------|
| `GET` | `/api/v1/boats/:id/equipment` | Yes | Any | List equipment |
| `POST` | `/api/v1/boats/:id/equipment` | Yes | Owner, co-owner, captain, technician | Add equipment |
| `GET` | `/api/v1/boats/:id/equipment/:eqId` | Yes | Any | Get equipment detail |
| `PATCH` | `/api/v1/boats/:id/equipment/:eqId` | Yes | Owner, co-owner, captain, technician | Update equipment |
| `DELETE` | `/api/v1/boats/:id/equipment/:eqId` | Yes | Owner, co-owner | Delete equipment |

**Query parameters for GET list:**

- `category` — filter by category (e.g., `electrical`, `navigation`, `safety`)
- `status` — filter by status (`active`, `decommissioned`)
- `sort` — sort field (default: `category,name`)

### 4.7 Maintenance

| Method | Path | Auth | Boat Access | Description |
|--------|------|------|-------------|-------------|
| `GET` | `/api/v1/boats/:id/maintenance` | Yes | Owner, co-owner, captain, technician | List maintenance records |
| `POST` | `/api/v1/boats/:id/maintenance` | Yes | Owner, co-owner, captain, technician | Create maintenance record |
| `GET` | `/api/v1/boats/:id/maintenance/:mId` | Yes | Owner, co-owner, captain, technician | Get maintenance detail |
| `PATCH` | `/api/v1/boats/:id/maintenance/:mId` | Yes | Owner, co-owner, captain, technician | Update maintenance record |
| `DELETE` | `/api/v1/boats/:id/maintenance/:mId` | Yes | Owner, co-owner | Delete maintenance record |

### 4.8 Passages (Logbook)

| Method | Path | Auth | Boat Access | Description |
|--------|------|------|-------------|-------------|
| `GET` | `/api/v1/boats/:id/passages` | Yes | Owner, co-owner, captain, crew | List passages |
| `POST` | `/api/v1/boats/:id/passages` | Yes | Owner, co-owner, captain, crew | Create passage |
| `GET` | `/api/v1/boats/:id/passages/:pId` | Yes | Owner, co-owner, captain, crew | Get passage detail |
| `PATCH` | `/api/v1/boats/:id/passages/:pId` | Yes | Owner, co-owner, captain | Update passage |
| `DELETE` | `/api/v1/boats/:id/passages/:pId` | Yes | Owner, co-owner | Delete passage |

#### POST /api/v1/boats/:id/passages/:pId/crew

Add a crew member to a passage.

```json
{
  "user_id": "crew-user-uuid",
  "role": "crew"
}
```

Or for a non-platform guest:

```json
{
  "guest_name": "Jane Smith",
  "role": "crew"
}
```

| Method | Path | Auth | Boat Access | Description |
|--------|------|------|-------------|-------------|
| `GET` | `/api/v1/boats/:id/passages/:pId/crew` | Yes | Owner, co-owner, captain, crew | List passage crew |
| `POST` | `/api/v1/boats/:id/passages/:pId/crew` | Yes | Owner, co-owner, captain | Add crew member |
| `DELETE` | `/api/v1/boats/:id/passages/:pId/crew/:crewId` | Yes | Owner, co-owner, captain | Remove crew member |

### 4.9 Almanac

Community-curated cruising almanac. All authenticated users can read. Only authenticated users can create entries and reviews. Entries are moderated.

| Method | Path | Auth | Description |
|--------|------|------|-------------|
| `GET` | `/api/v1/almanac/entries` | Yes | Search/filter almanac entries |
| `GET` | `/api/v1/almanac/entries/:id` | Yes | Get entry detail with reviews |
| `POST` | `/api/v1/almanac/entries` | Yes | Create new entry (enters moderation queue) |
| `PATCH` | `/api/v1/almanac/entries/:id` | Yes (author or moderator) | Update entry |
| `POST` | `/api/v1/almanac/entries/:id/reviews` | Yes | Submit a review |

#### GET /api/v1/almanac/entries

**Query parameters:**

| Parameter | Type | Description |
|-----------|------|-------------|
| `q` | string | Full-text search on name, description |
| `type` | string | Filter by type: `harbour`, `marina`, `anchorage`, `mooring`, `poi` |
| `country` | string | ISO 3166-1 alpha-2 country code |
| `region` | string | Region name |
| `bbox` | string | Bounding box: `sw_lng,sw_lat,ne_lng,ne_lat` |
| `near` | string | `lat,lng,radius_nm` — entries within radius |
| `facilities` | string | Comma-separated facility list (e.g., `water,fuel,wifi`) |
| `holding` | string | Minimum holding quality: `excellent`, `good`, `fair` |
| `cursor` | string | Pagination cursor |
| `limit` | integer | Items per page (default 25, max 100) |

#### POST /api/v1/almanac/entries/:id/reviews

```json
{
  "rating": 4,
  "comment": "Well-sheltered anchorage, good holding in sand.",
  "visit_date": "2026-03-15",
  "visit_position": { "lat": 36.1234, "lng": -5.3456 }
}
```

If `visit_position` is within 500m of the entry's coordinates, the review is marked as `visit_verified: true`.

### 4.10 Firmware

| Method | Path | Auth | Description |
|--------|------|------|-------------|
| `GET` | `/api/v1/firmware/versions` | Yes | Search firmware by manufacturer/product |
| `GET` | `/api/v1/firmware/versions/latest` | Yes | Get latest versions for specified products |
| `GET` | `/api/v1/boats/:id/firmware/status` | Yes (boat access) | Firmware status for all equipment on a boat |

#### GET /api/v1/firmware/versions

**Query parameters:**

- `manufacturer` — filter by manufacturer name
- `product` — filter by product name/model
- `category` — filter by category (e.g., `chartplotter`, `autopilot`, `vhf`)

#### GET /api/v1/boats/:id/firmware/status

Cross-references the boat's equipment registry against the firmware version database. Returns a list of equipment with current version, latest version, and whether an update is available.

```json
{
  "data": [
    {
      "equipment_id": "eq-uuid",
      "name": "Raymarine Axiom 2",
      "current_version": "4.1.0",
      "latest_version": "4.2.1",
      "update_available": true,
      "changelog_url": "https://..."
    }
  ]
}
```

### 4.11 Social

#### Friends

| Method | Path | Auth | Description |
|--------|------|------|-------------|
| `GET` | `/api/v1/friends` | Yes | List friends (accepted) and pending requests |
| `POST` | `/api/v1/friends/request` | Yes | Send friend request |
| `POST` | `/api/v1/friends/accept` | Yes | Accept friend request |
| `DELETE` | `/api/v1/friends/:id` | Yes | Unfriend or decline request |

#### POST /api/v1/friends/request

```json
{
  "user_id": "target-user-uuid"
}
```

Creates a `friendship` record with `status: 'pending'`. The target user sees it in their pending requests.

#### POST /api/v1/friends/accept

```json
{
  "friendship_id": "friendship-uuid"
}
```

Sets `status: 'accepted'` and `accepted_at` on the friendship record.

#### Activity Feed

| Method | Path | Auth | Description |
|--------|------|------|-------------|
| `GET` | `/api/v1/activity/feed` | Yes | Activity feed from friends and followed users |

Returns a chronological feed of public activities from the user's friends and followed users: passages, almanac contributions, position updates (if sharing enabled), achievements.

**Query parameters:**

- `cursor` — pagination cursor
- `limit` — items per page (default 25)
- `type` — filter by activity type (`passage`, `almanac`, `position`, `achievement`)

### 4.12 Groups

| Method | Path | Auth | Description |
|--------|------|------|-------------|
| `GET` | `/api/v1/groups` | Yes | List groups (user's groups + discoverable groups) |
| `POST` | `/api/v1/groups` | Yes | Create a group |
| `GET` | `/api/v1/groups/:id` | Yes | Get group detail |
| `PATCH` | `/api/v1/groups/:id` | Yes (group admin) | Update group |
| `DELETE` | `/api/v1/groups/:id` | Yes (group creator) | Delete group |
| `GET` | `/api/v1/groups/:id/members` | Yes | List group members (boats) |
| `POST` | `/api/v1/groups/:id/members` | Yes | Join group (or request to join) |
| `DELETE` | `/api/v1/groups/:id/members/:boatId` | Yes (group admin or boat owner) | Remove boat from group |

#### POST /api/v1/groups/:id/members

The user joins a group as one of their boats:

```json
{
  "boat_id": "boat-uuid"
}
```

Behaviour depends on `group.join_policy`:

- `open` — immediately added as member.
- `approval` — added as `status: 'pending'`, group admin approves.
- `invite_only` — returns 403 unless the user has a pending invite.

### 4.13 Sync (Spoke-Hub)

Sync endpoints are used by the spoke to exchange data with the hub. All sync requests are authenticated with a user JWT and signed with HMAC to prevent replay attacks.

| Method | Path | Auth | Description |
|--------|------|------|-------------|
| `POST` | `/api/v1/sync/handshake` | Yes + HMAC | Initiate sync session |
| `POST` | `/api/v1/sync/push` | Yes + HMAC | Push queued items from spoke to hub |
| `POST` | `/api/v1/sync/pull` | Yes + HMAC | Pull updates from hub to spoke |

#### HMAC Request Signing

Sync requests include an HMAC signature to prevent replay attacks and ensure payload integrity:

```
X-Sync-Timestamp: 1711900800
X-Sync-Signature: sha256=abcdef1234567890...
```

The signature is computed as:

```
HMAC-SHA256(
  key: shared_sync_secret,
  message: timestamp + "\n" + method + "\n" + path + "\n" + SHA256(body)
)
```

The `shared_sync_secret` is generated during spoke setup and stored on both the spoke (SQLite) and hub (per-boat record). The hub rejects requests with timestamps older than 5 minutes (clock skew tolerance).

#### POST /api/v1/sync/handshake

```json
{
  "spoke_id": "spoke-uuid",
  "boat_id": "boat-uuid",
  "hlc_state": {
    "wall_time": 1711900800000,
    "counter": 0,
    "node_id": "spoke-abc"
  },
  "sync_state": {
    "logbook_entry": { "last_hlc": "1711900000000-0-spoke-abc" },
    "equipment": { "last_hlc": "1711800000000-0-spoke-abc" }
  },
  "connection_type": "wifi",
  "queue_depth": 47
}
```

**Response (200):**

```json
{
  "data": {
    "session_id": "session-uuid",
    "hub_hlc_state": { "..." },
    "available_updates": {
      "almanac_entry": 23,
      "weather_forecast": 5,
      "firmware_version": 2
    },
    "sync_profile": "unlimited"
  }
}
```

#### POST /api/v1/sync/push

Pushes a batch of queued items from the spoke to the hub.

```json
{
  "session_id": "session-uuid",
  "items": [
    {
      "entity_type": "logbook_entry",
      "entity_id": "entry-uuid",
      "operation": "create",
      "hlc": "1711900800000-0-spoke-abc",
      "payload": { "title": "Departed Gibraltar", "..." }
    }
  ]
}
```

**Response (200):**

```json
{
  "data": {
    "acknowledged": ["entry-uuid"],
    "conflicts": [],
    "errors": []
  }
}
```

#### POST /api/v1/sync/pull

Requests updates from the hub for the spoke.

```json
{
  "session_id": "session-uuid",
  "entity_types": ["almanac_entry", "weather_forecast"],
  "since": {
    "almanac_entry": "1711800000000-0-hub",
    "weather_forecast": "1711850000000-0-hub"
  },
  "limit": 100
}
```

**Response (200):**

```json
{
  "data": {
    "items": [
      {
        "entity_type": "almanac_entry",
        "entity_id": "entry-uuid",
        "operation": "update",
        "hlc": "1711900800000-0-hub",
        "payload": { "..." }
      }
    ],
    "has_more": true
  }
}
```

### 4.14 Admin

Admin endpoints require `platform_role = 'admin'`. All admin actions are logged.

| Method | Path | Auth | Description |
|--------|------|------|-------------|
| `GET` | `/api/v1/admin/users` | Admin | Search/list users (paginated) |
| `PATCH` | `/api/v1/admin/users/:id` | Admin | Suspend/unsuspend user |
| `DELETE` | `/api/v1/admin/users/:id` | Admin | Delete user (GDPR) |
| `GET` | `/api/v1/admin/moderation/queue` | Moderator, Admin | Content moderation queue |
| `POST` | `/api/v1/admin/moderation/:id/action` | Moderator, Admin | Act on moderation item |

#### GET /api/v1/admin/users

**Query parameters:**

- `q` — search by display name, email, boat name, MMSI
- `role` — filter by platform role
- `status` — filter by status (`active`, `suspended`)
- `sort` — sort field (default: `-created_at`)
- `cursor`, `limit` — pagination

#### PATCH /api/v1/admin/users/:id

Suspend or unsuspend a user:

```json
{
  "action": "suspend",
  "reason": "Repeated posting of inappropriate content.",
  "expires_at": "2026-05-01T00:00:00Z"
}
```

Or:

```json
{
  "action": "unsuspend"
}
```

#### GET /api/v1/admin/moderation/queue

Returns pending moderation items: flagged forum posts, pending almanac entries, reported users.

```json
{
  "data": [
    {
      "id": "mod-uuid",
      "type": "forum_post",
      "target_id": "post-uuid",
      "reason": "Inappropriate content",
      "reported_by": "user-uuid",
      "created_at": "2026-03-30T14:00:00Z"
    }
  ]
}
```

### 4.15 Weather/Data Proxy

The hub proxies external data APIs so that clients and spokes have a single endpoint with caching, key management, and data transformation.

| Method | Path | Auth | Description |
|--------|------|------|-------------|
| `GET` | `/api/v1/weather/forecast` | Yes | Weather forecast for a location |
| `GET` | `/api/v1/tides/predictions` | Yes | Tidal predictions for a station |
| `GET` | `/api/v1/ais/vessels` | Yes | AIS vessel data within a bounding box |

#### GET /api/v1/weather/forecast

**Query parameters:**

- `lat` — latitude (required)
- `lng` — longitude (required)
- `hours` — forecast hours (default 72, max 240)

Proxied from Open-Meteo. Response cached for 1 hour.

#### GET /api/v1/tides/predictions

**Query parameters:**

- `station` — NOAA station ID (required)
- `date` — prediction date (default today)
- `days` — number of days (default 3, max 30)

Proxied from NOAA CO-OPS. Response cached for 24 hours (tidal predictions are deterministic).

#### GET /api/v1/ais/vessels

**Query parameters:**

- `bbox` — bounding box: `sw_lng,sw_lat,ne_lng,ne_lat` (required)

Proxied from aisstream.io. Response cached for 1 minute.

---

## 5. WebSocket Endpoints

WebSocket connections authenticate during the connection handshake. The client sends the JWT as a query parameter or in the first message after connection. The server validates the JWT before sending any data.

### 5.1 /ws/instruments

Real-time boat instrument data.

**Spoke:** Serves instrument data directly from protocol adapters to local clients (helm displays, tablets on the boat LAN).

**Hub:** Proxies instrument data from a connected spoke for remote monitoring. Available only when the spoke is online and has an active sync session.

**Message format (server to client):**

```json
{
  "path": "navigation/position",
  "value": { "lat": 36.1234, "lng": -5.3456 },
  "timestamp": "2026-03-31T12:00:00.123Z"
}
```

Messages are sent on change only (no polling). High-frequency data (GPS position, wind) is throttled to a configurable rate (default: 1Hz for position, 2Hz for wind).

### 5.2 /ws/chat

Real-time messaging for boat channels and direct messages.

**Message format (client to server):**

```json
{
  "type": "message",
  "channel": "boat:boat-uuid",
  "body": "Anchored safely in Portisco."
}
```

**Message format (server to client):**

```json
{
  "type": "message",
  "channel": "boat:boat-uuid",
  "sender": { "id": "user-uuid", "display_name": "Mark" },
  "body": "Anchored safely in Portisco.",
  "timestamp": "2026-03-31T18:30:00Z"
}
```

**Channels:**

- `boat:<boat-id>` — boat channel (all owners and granted users of that boat)
- `dm:<user-id-1>:<user-id-2>` — direct message (lexicographically ordered user IDs)
- `group:<group-id>` — group channel

### 5.3 /ws/alerts

Live alert stream from the spoke's monitoring service.

**Message format (server to client):**

```json
{
  "type": "alert",
  "severity": "warning",
  "source": "electrical/batteries/house/voltage",
  "message": "House battery voltage below 12.0V",
  "value": 11.8,
  "threshold": 12.0,
  "timestamp": "2026-03-31T03:15:00Z"
}
```

Severities: `info`, `warning`, `critical`, `emergency`.

### 5.4 /ws/position

Live position sharing for friends and fleet coordination.

**Message format (server to client):**

```json
{
  "type": "position",
  "user_id": "user-uuid",
  "boat_id": "boat-uuid",
  "boat_name": "SV Artemis",
  "position": { "lat": 36.1234, "lng": -5.3456 },
  "heading": 225,
  "speed_kts": 6.5,
  "timestamp": "2026-03-31T12:00:00Z"
}
```

The server only sends position updates from users who have enabled position sharing (`position_sharing` is `friends` or `public`) and who are friends with the requesting user (or sharing publicly).

### 5.5 WebSocket Authentication

```
1. Client opens WebSocket connection: ws://host/ws/instruments?token=<JWT>
2. Server validates JWT.
3. If valid: connection accepted, data starts flowing.
4. If invalid: connection closed with code 4001 (Unauthorized).
5. If JWT expires during an active connection: server sends a "token_expired" 
   message and the client must reconnect with a fresh token.
```

---

## 6. API Keys

### 6.1 Management Endpoints

| Method | Path | Auth | Description |
|--------|------|------|-------------|
| `GET` | `/api/v1/account/api-keys` | Yes | List user's API keys (prefix and metadata only, never the full key) |
| `POST` | `/api/v1/account/api-keys` | Yes | Generate a new API key |
| `DELETE` | `/api/v1/account/api-keys/:id` | Yes | Revoke an API key |

#### POST /api/v1/account/api-keys

```json
{
  "name": "Home Assistant Integration",
  "scope": "read",
  "expires_at": "2027-03-31T00:00:00Z"
}
```

**Response (201):**

```json
{
  "data": {
    "id": "key-uuid",
    "name": "Home Assistant Integration",
    "key": "ad_7kR3mX9pQ2vL8nY1wZ4bT6hJ0fK...",
    "key_prefix": "ad_7kR3m",
    "scope": "read",
    "expires_at": "2027-03-31T00:00:00Z",
    "created_at": "2026-03-31T10:00:00Z"
  }
}
```

The full `key` value is returned only in this response. It is never stored in the database and cannot be retrieved again. The user must copy it immediately.

### 6.2 Use Cases

- **MCP access:** External AI tools query the Above Deck data model via MCP, authenticated with an API key.
- **Home automation:** Home Assistant or similar systems read boat data for dashboard integration.
- **CI/CD:** Automated scripts push firmware version data or run data migrations.
- **Third-party apps:** Community-built applications access the API on behalf of a user.

### 6.3 Scope Restrictions

| Scope | Allowed Operations |
|-------|-------------------|
| `read` | `GET` on all endpoints the user has access to |
| `read_write` | `GET`, `POST`, `PATCH`, `DELETE` on all endpoints the user has access to |

API keys cannot:

- Access auth endpoints (`/api/auth/*`).
- Manage other API keys.
- Perform admin actions (even if the user has admin role — admin actions require session auth).

---

## 7. Error Format

All API errors use a consistent JSON format:

```json
{
  "error": {
    "code": "MACHINE_READABLE_CODE",
    "message": "Human-readable description of what went wrong.",
    "status": 404
  }
}
```

For validation errors, an additional `details` array provides per-field information:

```json
{
  "error": {
    "code": "VALIDATION_ERROR",
    "message": "Request validation failed.",
    "status": 422,
    "details": [
      { "field": "name", "message": "Name is required." },
      { "field": "mmsi", "message": "MMSI must be exactly 9 digits." }
    ]
  }
}
```

### 7.1 Standard Error Codes

| Code | Status | Description |
|------|--------|-------------|
| `UNAUTHORIZED` | 401 | No valid authentication token |
| `FORBIDDEN` | 403 | Authenticated but insufficient permissions |
| `NOT_FOUND` | 404 | Resource does not exist |
| `VALIDATION_ERROR` | 422 | Request body failed validation |
| `RATE_LIMITED` | 429 | Rate limit exceeded |
| `CONFLICT` | 409 | Resource already exists or state conflict |
| `INTERNAL_ERROR` | 500 | Unexpected server error |

### 7.2 Domain-Specific Error Codes

| Code | Status | Description |
|------|--------|-------------|
| `BOAT_NOT_FOUND` | 404 | Boat with given ID does not exist |
| `BOAT_ACCESS_DENIED` | 403 | User does not have access to this boat |
| `GRANT_EXPIRED` | 403 | Access grant has expired |
| `GRANT_REVOKED` | 403 | Access grant has been revoked |
| `OWNER_REQUIRED` | 403 | Only boat owners can perform this action |
| `ALREADY_OWNER` | 409 | User is already an owner of this boat |
| `ALREADY_FRIENDS` | 409 | Users are already friends |
| `FRIEND_REQUEST_EXISTS` | 409 | A pending friend request already exists |
| `GROUP_FULL` | 409 | Group has reached its member limit |
| `SYNC_SESSION_INVALID` | 400 | Sync session has expired or is invalid |
| `SYNC_HMAC_INVALID` | 401 | HMAC signature verification failed |
| `SYNC_TIMESTAMP_EXPIRED` | 401 | Sync request timestamp outside acceptable window |
| `API_KEY_REVOKED` | 401 | API key has been revoked |
| `API_KEY_EXPIRED` | 401 | API key has expired |
| `API_KEY_SCOPE_DENIED` | 403 | API key scope does not permit this operation |
| `ACCOUNT_SUSPENDED` | 403 | User account is suspended |
| `MODERATION_PENDING` | 403 | Content is pending moderation |

---

## 8. Security Headers

All API responses include the following security headers:

```
Strict-Transport-Security: max-age=63072000; includeSubDomains; preload
Content-Security-Policy: default-src 'self'; frame-ancestors 'none'
X-Content-Type-Options: nosniff
X-Frame-Options: DENY
Referrer-Policy: strict-origin-when-cross-origin
Permissions-Policy: camera=(), microphone=(), geolocation=(self)
```

The CSP header on API responses is minimal (API returns JSON, not HTML). The site's CSP is more detailed and defined in the Astro configuration.

---

## 9. Anti-Scraping

Community data (almanac, POIs, routes, reviews) is the product of community effort. The API enforces multiple layers of protection:

1. **Authentication required.** All read endpoints require a valid user session or API key. No anonymous access to community data.

2. **Rate limiting per user.** Even authenticated users are limited to prevent bulk extraction. Search endpoints have especially tight limits (10 req/min).

3. **API keys tied to user accounts.** Every API key resolves to a user. Abuse of an API key results in suspension of the associated user account.

4. **No bulk export endpoints.** There is no "download all almanac entries" endpoint. Data is accessed via paginated queries with a maximum page size of 100.

5. **No anonymous write access.** All content creation requires authentication.

6. **Behavioural detection (future).** Pattern-based detection for systematic scraping: sequential pagination through entire datasets, accessing entries without natural browsing patterns, excessive search queries. Flagged for manual review.

7. **License protection.** The API terms require that data accessed via the API is used in accordance with the project's open-source license (GPL). Bulk extraction for commercial use violates the terms.

---

## 10. Versioning

**URL-based versioning:** All API routes are prefixed with `/api/v1/`.

**Breaking changes** increment the version number (`/api/v2/`). A breaking change is any change that would cause existing API consumers to fail:

- Removing a field from a response
- Changing a field's type
- Removing an endpoint
- Changing the meaning of a request parameter

**Non-breaking additions** within the same version:

- Adding new fields to responses
- Adding new endpoints
- Adding optional request parameters

When a new version is released, the previous version is supported for 6 months. After that, requests to the old version return `410 Gone` with a message pointing to the new version.
