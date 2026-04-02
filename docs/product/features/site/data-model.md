# Platform Data Model — Feature Specification

**Feature:** Platform Data Model
**Status:** Draft
**Date:** 2026-03-31
**License:** GPL — free and open source
**Depends on:** Supabase Auth, Sync Engine, Boat Management

---

## 1. Overview

This document defines the platform data model for Above Deck. The central insight is that **the boat is the workspace, not a crew entity.**

Traditional marine software either models ownership as user-owns-boat (too simple) or invents a "crew" entity as a first-class object (too complex). In reality:

- Couples share a boat — both are co-owners with equal access
- A delivery skipper needs temporary captain access to a boat for two weeks, then it ends
- A marine technician needs equipment access for a service visit
- Family ashore want read-only monitoring access to see position
- Friends co-own boats — two families share a catamaran
- People upgrade boats but keep their relationships — friendships and ownership persist, not some artificial crew entity
- A solo sailor just owns their boat — no crew abstraction needed

The crew is not a formal entity. It is simply the list of people on a specific passage, recorded as a field on the passage/logbook. The boat is the workspace where co-owners share access to equipment, maintenance, logs, and settings.

---

## 2. Entity Hierarchy

```
User (individual person)
  +-- owns Boats (via boat_owners — owner, co_owner)
  +-- has access to Boats (via boat_access_grants — captain, crew, technician, family)
  +-- friends with Users
  +-- follows Users
  +-- member of Groups (yacht clubs, rallies)

Boat (physical vessel, keyed to MMSI)
  +-- owned by Users (via boat_owners)
  +-- has Equipment, Maintenance, Logs, Tanks, Documents
  +-- has access grants for non-owners

Passage (a specific trip)
  +-- belongs to a Boat
  +-- has crew list (via passage_crew — who was on board)

Group (yacht club, rally fleet, association)
  +-- has member Boats (not users — you join a rally as a boat)
```

Orthogonal to the ownership hierarchy:

```
User -- friends --> User (mutual social connection)
User -- follows --> User (one-way)
Boat -- member of --> Group (yacht clubs, rallies, associations)
```

---

## 3. Core Entities

### 3.1 User

A user is an individual person. One Supabase Auth identity, one user record.

```
user:
  # Identity (from Supabase Auth)
  id:                         uuid            # primary key, from Supabase Auth
  email:                      string          # from OAuth provider, unique
  
  # Profile
  display_name:               string          # how they appear in the app (required)
  full_name:                  string          # legal name — for logbook entries, sailing CV, port check-in
  photo_url:                  string          # avatar image URL (Supabase Storage)
  bio:                        text            # short free-form text
  
  # Contact
  phone:                      string          # optional, for SMS alerts
  whatsapp:                   string          # optional, for communication
  
  # Location
  location_city:              string          # city or region
  location_country:           string          # ISO 3166-1 alpha-2
  
  # Sailing profile
  sailing_experience:         enum            # novice, coastal, offshore, ocean, professional
  certifications:             jsonb           # array of { type, name, number, issued_by, issued_date, expiry_date }
                                              # e.g., { type: "rya", name: "Yachtmaster Offshore", number: "12345",
                                              #         issued_by: "RYA", issued_date: "2020-06-15", expiry_date: null }
                                              # Common types: rya, asa, ics, stcw, national
  languages:                  jsonb           # array of ISO 639-1 codes, e.g., ["en", "fr", "es"]
  
  # Emergency contact
  emergency_contact_name:     string
  emergency_contact_phone:    string
  emergency_contact_relationship: string      # e.g., "spouse", "parent", "sibling"
  
  # Preferences
  units_preference:           enum            # metric, imperial, nautical
  timezone:                   string          # IANA timezone, e.g., "Europe/London" — auto from GPS or manual
  
  # Privacy (per-field visibility)
  privacy_settings:           jsonb           # { email: "boat_only", phone: "private", location: "friends",
                                              #   bio: "public", certifications: "public", ... }
                                              # Values: "private", "boat_only", "friends", "public"
  position_sharing:           enum            # off, boat_only, friends, public
  
  # Platform role
  platform_role:              enum            # user, moderator, admin
  
  # Metadata
  created_at:                 timestamptz
  updated_at:                 timestamptz
  last_seen_at:               timestamptz     # updated on each authenticated request
```

**Privacy visibility levels:**

| Level | Who can see |
|-------|------------|
| `private` | Only the user themselves and platform admins |
| `boat_only` | The user + all owners/granted users of any boat the user owns or has access to |
| `friends` | The user + boat mates + mutual friends |
| `public` | Anyone with an account |

**Notes:**
- `display_name` is the only required profile field beyond email. Everything else is optional.
- `certifications` uses JSONB rather than a separate table because the data is write-rarely, read-often, and the list is short (typically 1-5 items per user).
- `platform_role` is independent of boat roles. An admin is still a regular boat owner on their own vessel.
- `last_seen_at` is for platform health monitoring and "is this account active" checks, not for surveillance. It is not exposed to other users.

### 3.2 Boat

The physical vessel. Keyed to MMSI. The full schema is defined in the Boat Management spec (`docs/features/boat-systems/boat-management/spec.md`).

Ownership is modelled through `boat_owners` (permanent) and `boat_access_grants` (temporary or role-based). There is no single `owner_id` field on the boat.

All other boat fields (identity, specs, dimensions, capacities, performance, electrical) remain as defined in the Boat Management spec. Equipment, maintenance schedules, maintenance records, tanks, documents, and inventory items reference `boat_id` and are accessed through ownership or access grants.

### 3.3 Boat Owners

The join table between users and boats for permanent ownership. A user can own many boats. A boat can have many owners (co-ownership).

```
boat_owner:
  id:                         uuid            # primary key
  boat_id:                    uuid            # references boat
  user_id:                    uuid            # references user
  
  # Role
  role:                       enum            # owner, co_owner
  
  # Metadata
  created_at:                 timestamptz
  updated_at:                 timestamptz
  
  # Constraints
  UNIQUE(boat_id, user_id)                    # a user can only own a boat once
```

**Rules:**
- Every boat has at least one `owner`. The first person to register the boat is the `owner`.
- Co-owners have equal access to all boat data, equipment, maintenance, logs, settings, and documents.
- The `owner` role can add/remove co-owners and delete the boat. `co_owner` can do everything except remove the original owner or delete the boat.
- Ownership is permanent until explicitly removed. There is no expiry date.
- When a boat is sold, the seller's `boat_owner` record is deleted and a new `owner` record is created for the buyer. Historical data (logbook, maintenance, equipment) stays with the boat.
- Both `owner` and `co_owner` can grant access to non-owners via `boat_access_grants`.

### 3.4 Boat Access Grants

Temporary or role-based access to a boat for non-owners. Covers delivery skippers, technicians, family monitoring, and anyone else who needs access without being an owner.

```
boat_access_grant:
  id:                         uuid            # primary key
  boat_id:                    uuid            # references boat
  user_id:                    uuid            # references user
  
  # Role
  role:                       enum            # captain, crew, technician, family
  
  # Grant provenance
  granted_by:                 uuid            # references user — which owner granted this
  
  # Date range
  start_date:                 date            # when access begins (null = immediate)
  end_date:                   date            # when access expires (null = indefinite until revoked)
  
  # Granular permissions (override or extend role defaults)
  permissions:                jsonb           # { edit_boat: true, edit_equipment: true,
                                              #   manage_access: false, view_finances: true,
                                              #   control_switching: false, manage_routes: true,
                                              #   manage_documents: true, manage_maintenance: true }
  
  # Metadata
  created_at:                 timestamptz
  updated_at:                 timestamptz
  revoked_at:                 timestamptz     # set when access is manually revoked before end_date
  revoked_by:                 uuid            # references user — who revoked the grant
  
  # Constraints
  UNIQUE(boat_id, user_id, role)              # a user has one grant per role per boat
```

**Access grant roles and default permissions:**

| Permission | Captain | Crew | Technician | Family |
|------------|---------|------|------------|--------|
| View boat data | yes | yes | yes | yes (position + basic status) |
| Contribute to logbook | yes | yes | no | no |
| Use tools (passage planner, etc.) | yes | yes | no | no |
| Edit boat profile | yes | no | no | no |
| Edit equipment registry | yes | no | yes | no |
| Manage maintenance | yes | no | yes | no |
| Manage documents | yes | no | no | no |
| Manage routes | yes | yes | no | no |
| Manage access grants | no | no | no | no |
| Control digital switching | yes | no | no | no |
| View finances (costs, budgets) | yes | no | no | no |

**Use cases:**

| Scenario | Role | Date-bound? | Example |
|----------|------|-------------|---------|
| Delivery skipper | `captain` | Yes (2 weeks) | Hired to move boat from UK to Caribbean |
| Friend joining for an ocean crossing | `crew` | Yes (3 weeks) | Joins for the Atlantic, leaves in Barbados |
| Marine technician | `technician` | Yes (1 day) | Engine service visit — sees equipment, logs work |
| Partner's parents | `family` | No (indefinite) | Read-only monitoring — position, battery, weather |
| House-sitter watching the boat in marina | `family` | Yes (6 months) | Sees position and bilge alerts while owners travel |

**Rules:**
- Only boat owners (`owner` or `co_owner`) can create access grants. The `granted_by` field records who.
- Owners can revoke any access grant at any time. Revoked grants are preserved (not deleted) with `revoked_at` set.
- After `end_date`, access is automatically denied. The record is preserved for audit trail.
- The `permissions` JSONB field allows per-grant overrides of the role defaults. A `crew` member might be granted `edit_equipment` if they are the technical person aboard.
- `captain` is the strongest non-owner role — full operational access to the boat for the duration of the grant. A delivery skipper with `captain` access can do everything an owner can except manage ownership or other access grants.
- `family` is read-only monitoring. They see position, basic boat status (batteries, bilge, anchor alarm), and weather. They cannot modify anything.

### 3.5 Passage Crew

The crew on a specific passage is not a formal entity — it is a record of who was on board for a trip. This is a field on the passage/logbook, linking users to a specific passage.

```
passage_crew:
  id:                         uuid            # primary key
  passage_id:                 uuid            # references passage (logbook passage entry)
  user_id:                    uuid            # references user
  
  # Role on this passage
  role:                       enum            # skipper, mate, crew
  
  # Metadata
  created_at:                 timestamptz
  
  # Constraints
  UNIQUE(passage_id, user_id)                 # a person is listed once per passage
```

**Rules:**
- Every passage has exactly one `skipper`. This is the legally responsible person for the passage.
- `mate` and `crew` roles are informational — they record who was aboard and in what capacity.
- Passage crew records are immutable once created. They are a historical record of who sailed.
- A user does not need to be a boat owner or have an access grant to appear on a passage crew list. The skipper can record anyone who was on board, including people who do not have platform accounts (in which case `user_id` is null and a `guest_name` text field is used instead).

```
passage_crew (extended for non-platform guests):
  user_id:                    uuid            # references user (null for non-platform guests)
  guest_name:                 string          # name of person without an account (null if user_id is set)
```

---

## 4. Social Entities

### 4.1 Friends

Mutual social connections between users. Friends can see each other's position (if sharing is enabled), activity feed, and boat memberships.

```
friendship:
  id:                         uuid
  user_id:                    uuid            # references user (the one who sent the request)
  friend_id:                  uuid            # references user (the one who received the request)
  status:                     enum            # pending, accepted, declined, blocked
  
  created_at:                 timestamptz     # when the request was sent
  accepted_at:                timestamptz     # when it was accepted (null if pending/declined)
  
  # Constraints
  UNIQUE(user_id, friend_id)
  CHECK(user_id != friend_id)
```

**Rules:**
- Friendships are always mutual once accepted. The `user_id`/`friend_id` distinction only tracks who initiated the request.
- Queries check both directions: "is A friends with B" checks for `(A,B)` or `(B,A)` with `status = 'accepted'`.
- `blocked` prevents the blocked user from sending further requests or seeing any profile data.
- Declining a request deletes the record (or sets `status = 'declined'`) — the sender does not know whether the request was declined or is pending.

### 4.2 Follows

One-way follows. A user follows another to see their public activity.

```
follow:
  id:                         uuid
  follower_id:                uuid            # references user
  following_id:               uuid            # references user
  
  created_at:                 timestamptz
  
  # Constraints
  UNIQUE(follower_id, following_id)
  CHECK(follower_id != following_id)
```

**Rules:**
- Following is one-way. No approval needed.
- Following someone shows their public activity in your feed. It does not grant access to boat data, position, or private profile fields.
- If two users follow each other, they are mutual followers but not friends. Friends is a separate, stronger relationship.

### 4.3 Groups

Groups are larger social organisations: yacht clubs, rally fleets, cruising associations, geographic communities.

```
group:
  id:                         uuid
  name:                       string          # e.g., "ARC 2027", "Med Cruisers", "Royal Ocean Racing Club"
  type:                       enum            # rally, club, association, geographic, custom
  description:                text
  photo_url:                  string
  
  # Membership model
  join_policy:                enum            # open, approval, invite_only
  
  # Metadata
  created_by:                 uuid            # references user
  created_at:                 timestamptz
  updated_at:                 timestamptz
  is_active:                  boolean
```

**Groups contain boats, not individual users.** You join a rally as a boat, not as a person. This reflects reality: the ARC entry is "SV Artemis" not "Mark Curphey, individual."

### 4.4 Group Members

```
group_member:
  id:                         uuid
  group_id:                   uuid            # references group
  boat_id:                    uuid            # references boat (groups contain boats)
  
  role:                       enum            # admin, member
  status:                     enum            # pending, approved, rejected
  
  joined_at:                  timestamptz
  left_at:                    timestamptz
  
  created_at:                 timestamptz
  updated_at:                 timestamptz
  
  # Constraints
  UNIQUE(group_id, boat_id)
```

**Rules:**
- Group admins can approve/reject membership requests (if `join_policy = 'approval'`).
- Group admins can remove members.
- Multiple group admins are allowed.
- Any owner of a boat can act on behalf of their boat for group membership.

---

## 5. Boat Workspace

The boat workspace is not a separate entity — it is the set of data that owners and granted users share access to through boat ownership and access grants. There is no `workspace` table. The workspace is a conceptual container defined by permissions.

What boat owners and granted users share:

| Feature | Data location | Access rule |
|---------|--------------|-------------|
| Boat data | `boat`, `equipment`, `tank` tables | All owners + granted users with appropriate role |
| Routes | `route` table, `route.boat_id` FK | Owners + captain/crew grants can view and create/edit |
| Logbook | `logbook_entry` table, `logbook_entry.boat_id` FK | Owners + captain/crew grants can view and contribute |
| Maintenance | `maintenance_schedule`, `maintenance_record` tables via `boat_id` | Owners + captain/technician grants can manage |
| Provisioning | `provision_list` table, `provision_list.boat_id` FK | Owners + captain/crew grants |
| Documents | `document` table via `boat_id` | Owners + captain grants can manage |
| Position | Boat's live position | Owners + all granted users (family sees position) |
| Alerts | Generated from monitoring service | Delivered based on role and notification preferences |

### 5.1 Routes

```
route:
  id:                         uuid
  boat_id:                    uuid            # references boat
  
  name:                       string
  description:                text
  
  # Route data
  waypoints:                  jsonb           # ordered array of { lat, lng, name, notes, eta }
  geometry:                   geometry        # PostGIS LineString (hub) / GeoJSON text (spoke)
  
  # Planning metadata
  departure_date:             timestamptz
  arrival_date:               timestamptz
  distance_nm:                float
  status:                     enum            # draft, planned, active, completed, abandoned
  
  # Visibility
  visibility:                 enum            # boat_only, friends, public
  
  # Sync
  created_by:                 uuid            # references user
  created_at:                 timestamptz
  updated_at:                 timestamptz
  sync_version:               integer
```

### 5.2 Logbook Entry

```
logbook_entry:
  id:                         uuid
  boat_id:                    uuid            # references boat
  route_id:                   uuid            # references route (optional)
  
  # Entry data
  entry_type:                 enum            # passage, anchor, port, maintenance, event, note
  title:                      string
  body:                       text            # markdown
  
  # Position and conditions at time of entry
  latitude:                   float
  longitude:                  float
  heading:                    float
  speed_kts:                  float
  wind_speed_kts:             float
  wind_direction:             float
  sea_state:                  string
  weather:                    string
  barometer_hpa:              float
  
  # Metadata
  author_id:                  uuid            # references user — who wrote this entry
  recorded_at:                timestamptz     # when the event occurred (may differ from created_at)
  visibility:                 enum            # boat_only, friends, public
  photos:                     jsonb           # array of storage URLs
  
  created_at:                 timestamptz
  updated_at:                 timestamptz
  sync_version:               integer
```

### 5.3 Messages (Boat Channel)

```
message:
  id:                         uuid
  boat_id:                    uuid            # references boat — boat-scoped channel
  sender_id:                  uuid            # references user
  
  body:                       text
  message_type:               enum            # text, image, position, system
  
  # For position shares
  latitude:                   float
  longitude:                  float
  
  # Metadata
  created_at:                 timestamptz
  edited_at:                  timestamptz
  is_deleted:                 boolean         # soft delete
```

### 5.4 Direct Messages

```
direct_message:
  id:                         uuid
  sender_id:                  uuid            # references user
  recipient_id:               uuid            # references user
  
  body:                       text
  message_type:               enum            # text, image, position
  
  created_at:                 timestamptz
  read_at:                    timestamptz     # null if unread
  is_deleted:                 boolean
```

### 5.5 Provision List

```
provision_list:
  id:                         uuid
  boat_id:                    uuid            # references boat
  
  name:                       string          # e.g., "Atlantic Crossing Provisions", "Weekly Shop"
  status:                     enum            # draft, active, completed
  
  created_by:                 uuid
  created_at:                 timestamptz
  updated_at:                 timestamptz
  sync_version:               integer

provision_item:
  id:                         uuid
  list_id:                    uuid            # references provision_list
  
  name:                       string          # e.g., "Tinned tomatoes"
  category:                   string          # e.g., "canned_goods", "fresh_produce", "medical"
  quantity:                   float
  unit:                       string          # e.g., "cans", "kg", "litres"
  is_checked:                 boolean         # bought / aboard
  assigned_to:                uuid            # references user (optional — who is responsible)
  notes:                      string
  
  created_at:                 timestamptz
  updated_at:                 timestamptz
  sync_version:               integer
```

---

## 6. Platform Roles

Platform roles are site-wide and independent of boat ownership or access roles. They control access to platform administration features.

| Role | Capabilities |
|------|-------------|
| `user` | Use the platform, own boats, use tools, participate in community |
| `moderator` | All user capabilities + manage content review queue, flag/hide posts, warn users, view reported content |
| `admin` | All moderator capabilities + manage users (suspend/delete), manage site settings, view analytics, access any boat's data (support cases) |

**Rules:**
- Platform roles are stored on the `user.platform_role` field.
- A platform admin interacting with their own boat is a regular owner or co-owner. Platform admin powers only apply to platform administration features.
- Moderators cannot suspend or delete users. They can only flag content and warn users.
- Admins can access any boat's data for support purposes (e.g., a user locked out of their boat). This access is logged.

---

## 7. User Management (Admin)

Admin capabilities for managing the platform's user base. Designed for a small community — no enterprise bulk operations.

### 7.1 User Directory

- Search by: display name, email, boat name, MMSI
- Filter by: platform role, account status (active, suspended), last seen date range
- Sort by: created date, last seen, display name

### 7.2 User Detail View

- Profile: all user fields
- Boats: list of boats the user owns (via boat_owners)
- Access grants: list of boats the user has access to (via boat_access_grants)
- Activity: recent logins, edits, community contributions, content flags received
- Actions: suspend, unsuspend, delete

### 7.3 User Actions

**Suspend:**
- Temporary account suspension with a required reason.
- Suspended users cannot log in. Their data is preserved.
- Suspension can have an expiry date (auto-unsuspend) or be indefinite.

```
user_suspension:
  id:                         uuid
  user_id:                    uuid            # references user
  suspended_by:               uuid            # references user (admin)
  reason:                     text            # required
  suspended_at:               timestamptz
  expires_at:                 timestamptz     # null = indefinite
  unsuspended_at:             timestamptz     # set when manually unsuspended
  unsuspended_by:             uuid            # references user (admin)
```

**Delete (GDPR):**
- Full data removal. User record anonymised (display_name set to "Deleted User", all PII fields nulled).
- Logbook entries and community contributions are preserved but attributed to "Deleted User" (not removed, because they are part of shared boat/community data).
- Boat ownership records are ended (ownership transferred or boat orphaned — admin handles this before deletion).
- Access grants are revoked.
- The user's Supabase Auth account is deleted.
- This is irreversible.

### 7.4 Activity Log

```
activity_log:
  id:                         uuid
  user_id:                    uuid            # references user (the actor)
  action:                     string          # e.g., "login", "update_boat", "create_logbook_entry",
                                              #        "suspend_user", "delete_user", "grant_access"
  target_type:                string          # e.g., "user", "boat", "logbook_entry", "boat_access_grant"
  target_id:                  uuid
  metadata:                   jsonb           # action-specific details
  ip_address:                 inet
  
  created_at:                 timestamptz
```

---

## 8. Permissions Model

Three independent permission layers:

```
Platform Role (user.platform_role)
  +-- Site-wide permissions (admin, moderator, user)

Boat Access (boat_owners.role + boat_access_grants.role + boat_access_grants.permissions)
  +-- Ownership-level permissions (owner, co_owner)
  +-- Grant-level permissions (captain, crew, technician, family)

Privacy Settings (user.privacy_settings + user.position_sharing)
  +-- Per-field visibility (who can see each profile field)
  +-- Position sharing level (off, boat_only, friends, public)
```

**Permission resolution order:**
1. Platform role is checked first. Admins bypass boat-level checks for platform administration tasks.
2. Ownership is checked: `owner` and `co_owner` have full access to all boat data and settings.
3. If not an owner, access grants are checked: role + `permissions` JSONB determine what a granted user can do.
4. Privacy settings determine what profile data is visible to whom.

**Owner permissions:**

| Permission | Owner | Co-Owner |
|------------|-------|----------|
| View all boat data | yes | yes |
| Edit boat profile | yes | yes |
| Edit equipment | yes | yes |
| Manage maintenance | yes | yes |
| Manage documents | yes | yes |
| Manage routes | yes | yes |
| Control digital switching | yes | yes |
| View finances | yes | yes |
| Create access grants | yes | yes |
| Revoke access grants | yes | yes |
| Add/remove co-owners | yes | no |
| Delete boat | yes | no |
| Transfer ownership | yes | no |

**Example scenarios:**
- User A is an admin. They can view any boat's data for support. But on their own boat, they are just an owner with owner permissions.
- User B owns one boat and has a `captain` access grant on another (delivery job). Different permissions on each.
- User C has `position_sharing = 'boat_only'`. Co-owners and granted users of their boats see their position. Friends do not.
- User D has a `family` access grant on their child's boat. They can see position, battery status, and anchor alarm, but cannot modify anything.

---

## 9. RLS (Row Level Security) Policies

All tables use Supabase RLS. The JWT from Supabase Auth contains `auth.uid()` which maps to `user.id`. Key policies:

### 9.1 Users

```sql
-- Users can read their own profile
CREATE POLICY "users_read_own" ON users FOR SELECT
  USING (id = auth.uid());

-- Users can read profiles of people they share a boat with (respecting privacy settings)
CREATE POLICY "users_read_boat_mates" ON users FOR SELECT
  USING (
    id IN (
      -- Co-owners of the same boat
      SELECT bo2.user_id FROM boat_owners bo1
      JOIN boat_owners bo2 ON bo1.boat_id = bo2.boat_id
      WHERE bo1.user_id = auth.uid()
      UNION
      -- Granted users of boats I own
      SELECT bag.user_id FROM boat_owners bo
      JOIN boat_access_grants bag ON bo.boat_id = bag.boat_id
      WHERE bo.user_id = auth.uid()
        AND (bag.end_date IS NULL OR bag.end_date >= CURRENT_DATE)
        AND bag.revoked_at IS NULL
      UNION
      -- Owners of boats I have access to
      SELECT bo.user_id FROM boat_access_grants bag
      JOIN boat_owners bo ON bag.boat_id = bo.boat_id
      WHERE bag.user_id = auth.uid()
        AND (bag.end_date IS NULL OR bag.end_date >= CURRENT_DATE)
        AND bag.revoked_at IS NULL
    )
  );

-- Users can read public profiles of friends
CREATE POLICY "users_read_friends" ON users FOR SELECT
  USING (
    id IN (
      SELECT CASE WHEN user_id = auth.uid() THEN friend_id ELSE user_id END
      FROM friendships
      WHERE (user_id = auth.uid() OR friend_id = auth.uid())
        AND status = 'accepted'
    )
  );

-- Users can update their own profile
CREATE POLICY "users_update_own" ON users FOR UPDATE
  USING (id = auth.uid());

-- Admins can read all users
CREATE POLICY "users_admin_read" ON users FOR SELECT
  USING (
    EXISTS (SELECT 1 FROM users WHERE id = auth.uid() AND platform_role = 'admin')
  );
```

**Note:** The boat mate and friend policies return the full row. The application layer is responsible for filtering fields based on `privacy_settings`. RLS controls row-level access; field-level privacy is enforced in the API/application layer.

### 9.2 Boats

```sql
-- Owners can read their boats
CREATE POLICY "boats_read_owners" ON boats FOR SELECT
  USING (
    id IN (
      SELECT boat_id FROM boat_owners
      WHERE user_id = auth.uid()
    )
  );

-- Granted users can read boats they have access to
CREATE POLICY "boats_read_granted" ON boats FOR SELECT
  USING (
    id IN (
      SELECT boat_id FROM boat_access_grants
      WHERE user_id = auth.uid()
        AND (end_date IS NULL OR end_date >= CURRENT_DATE)
        AND revoked_at IS NULL
    )
  );

-- Owners can update their boats
CREATE POLICY "boats_update_owners" ON boats FOR UPDATE
  USING (
    id IN (
      SELECT boat_id FROM boat_owners
      WHERE user_id = auth.uid()
    )
  );

-- Captains (access grants) can update boats they have captain access to
CREATE POLICY "boats_update_captain" ON boats FOR UPDATE
  USING (
    id IN (
      SELECT boat_id FROM boat_access_grants
      WHERE user_id = auth.uid()
        AND role = 'captain'
        AND (end_date IS NULL OR end_date >= CURRENT_DATE)
        AND revoked_at IS NULL
    )
  );

-- Admins can read all boats
CREATE POLICY "boats_admin_read" ON boats FOR SELECT
  USING (
    EXISTS (SELECT 1 FROM users WHERE id = auth.uid() AND platform_role = 'admin')
  );
```

### 9.3 Logbook Entries

```sql
-- Owners can read logbook entries for their boats
CREATE POLICY "logbook_read_owners" ON logbook_entries FOR SELECT
  USING (
    boat_id IN (
      SELECT boat_id FROM boat_owners
      WHERE user_id = auth.uid()
    )
  );

-- Granted users (captain, crew) can read logbook entries for boats they have access to
CREATE POLICY "logbook_read_granted" ON logbook_entries FOR SELECT
  USING (
    boat_id IN (
      SELECT boat_id FROM boat_access_grants
      WHERE user_id = auth.uid()
        AND role IN ('captain', 'crew')
        AND (end_date IS NULL OR end_date >= CURRENT_DATE)
        AND revoked_at IS NULL
    )
  );

-- Friends can read logbook entries marked as friends-visible
CREATE POLICY "logbook_read_friends" ON logbook_entries FOR SELECT
  USING (
    visibility IN ('friends', 'public')
    AND author_id IN (
      SELECT CASE WHEN user_id = auth.uid() THEN friend_id ELSE user_id END
      FROM friendships
      WHERE (user_id = auth.uid() OR friend_id = auth.uid())
        AND status = 'accepted'
    )
  );

-- Public logbook entries are visible to all authenticated users
CREATE POLICY "logbook_read_public" ON logbook_entries FOR SELECT
  USING (visibility = 'public');

-- Owners and captain/crew grants can create logbook entries
CREATE POLICY "logbook_insert" ON logbook_entries FOR INSERT
  WITH CHECK (
    (
      boat_id IN (
        SELECT boat_id FROM boat_owners WHERE user_id = auth.uid()
      )
      OR
      boat_id IN (
        SELECT boat_id FROM boat_access_grants
        WHERE user_id = auth.uid()
          AND role IN ('captain', 'crew')
          AND (end_date IS NULL OR end_date >= CURRENT_DATE)
          AND revoked_at IS NULL
      )
    )
    AND author_id = auth.uid()
  );
```

### 9.4 Community Content

```sql
-- Almanac entries are readable by all authenticated users
CREATE POLICY "almanac_read" ON almanac_entries FOR SELECT
  USING (auth.uid() IS NOT NULL);

-- Authenticated users can create almanac entries
CREATE POLICY "almanac_insert" ON almanac_entries FOR INSERT
  WITH CHECK (auth.uid() IS NOT NULL);

-- Forum posts are readable by all authenticated users
CREATE POLICY "forum_read" ON forum_posts FOR SELECT
  USING (auth.uid() IS NOT NULL AND is_hidden = false);

-- Moderators can see hidden posts
CREATE POLICY "forum_read_moderator" ON forum_posts FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM users
      WHERE id = auth.uid() AND platform_role IN ('moderator', 'admin')
    )
  );
```

---

## 10. Sync Implications

The sync engine (defined in `docs/features/platform/sync-engine/spec.md`) operates in a boat context. Key implications of the ownership model:

### 10.1 Spoke Identity

Each spoke (on-boat instance) is associated with a boat via MMSI. The sync session authenticates with the hub using the user's JWT, which carries `auth.uid()`. The hub resolves this to boat ownership or access grants and authorises accordingly.

### 10.2 Multi-User Access

When multiple users have access to a single boat (owners + access grants), the spoke serves data to all authorised users. The spoke maintains a local cache of `boat_owner` and `boat_access_grant` records, synced from the hub.

### 10.3 Access Changes

When an owner adds or removes an access grant on the hub:
- Next sync pulls the updated `boat_access_grant` record to the spoke.
- Added grant: spoke allows access on next connection from that user.
- Revoked grant (`revoked_at` set) or expired (`end_date` passed): spoke denies access on next sync. Any cached JWT for that user is invalidated locally.

### 10.4 Boat Transfer

When a boat changes ownership (sold, donated, transferred):
1. Old owner's `boat_owner` record is removed.
2. New owner's `boat_owner` record is created with `role = 'owner'`.
3. All existing access grants remain unless explicitly revoked by the new owner.
4. On next sync, the spoke picks up the new ownership.
5. Historical data (logbook, maintenance, equipment) stays with the boat. The new owner inherits the full history.
6. The old owner loses all access unless the new owner creates an access grant for them.

### 10.5 Canonical Ownership

The sync engine's canonical ownership rules (defined in the sync engine spec) are unchanged. The boat-centric model simplifies sync scoping:

| Data | Canonical owner | Access context |
|------|----------------|----------------|
| Boat ownership | Hub | Hub manages ownership records |
| Access grants | Hub | Hub manages grants |
| Boat profile | Bidirectional | Owners and captains can edit from hub or spoke |
| Equipment | Bidirectional | Same as boat profile |
| Logbook entries | Spoke | Created by users on board, synced to hub |
| Routes | Bidirectional | Created by any authorised user on hub or spoke |
| Provisions | Bidirectional | Managed from either side |
| Boat messages | Hub | Real-time via Supabase Realtime when connected; queued on spoke when offline |

---

## 11. Entity Relationship Diagram

```
                              +------------------+
                              |      group       |
                              +------------------+
                              | id               |
                              | name             |
                              | type             |
                              | join_policy      |
                              +--------+---------+
                                       |
                                       | group_member
                                       | (boat_id, role)
                                       |
+----------+    boat_owner     +-------+--------+
|   user   +-------------------+      boat      |
+----------+  (role: owner,   +----------------+
| id       |   co_owner)       | id             |
| email    |                   | mmsi           |
| display_ |  boat_access_    | name           |
|  name    |  grant            |                |
| platform_|  (role, dates,   +--------+-------+
|  role    |   permissions)            |
+----+-----+                   +-------+--------+
     |                         |   equipment    |
     | friendship (mutual)     |   tank         |
     | follow (one-way)        |   document     |
     |                         |   inventory    |
     +-------> other users     |   maintenance  |
                               +----------------+

                               passage_crew
                               (passage_id, user_id, role)
                               Records who was on board for each trip
```

---

## 12. Default Setup Flow

When a new user registers and adds their first boat:
1. A `boat_owner` record is created with `role = 'owner'`.
2. The boat is immediately usable — no crew creation, no workspace setup.
3. The user can add co-owners (partner, friend) at any time via `boat_owners`.
4. The user can grant temporary access (delivery skipper, technician, family) via `boat_access_grants`.

This means the ownership model is invisible to solo sailors — they never have to think about it. But it is there when they add their partner as co-owner, grant access for a delivery, or invite family to monitor the boat.

---

## 13. Index Strategy

Key indexes for query performance on the hub (PostgreSQL):

```sql
-- Boat owner lookups (most common query pattern)
CREATE INDEX idx_boat_owners_user ON boat_owners(user_id);
CREATE INDEX idx_boat_owners_boat ON boat_owners(boat_id);

-- Boat access grant lookups
CREATE INDEX idx_boat_access_grants_user ON boat_access_grants(user_id)
  WHERE revoked_at IS NULL AND (end_date IS NULL OR end_date >= CURRENT_DATE);
CREATE INDEX idx_boat_access_grants_boat ON boat_access_grants(boat_id)
  WHERE revoked_at IS NULL AND (end_date IS NULL OR end_date >= CURRENT_DATE);

-- Boat by MMSI (natural key lookup)
CREATE INDEX idx_boats_mmsi ON boats(mmsi);

-- Friendship lookups
CREATE INDEX idx_friendships_user ON friendships(user_id) WHERE status = 'accepted';
CREATE INDEX idx_friendships_friend ON friendships(friend_id) WHERE status = 'accepted';

-- Logbook by boat (timeline queries)
CREATE INDEX idx_logbook_boat ON logbook_entries(boat_id, recorded_at DESC);

-- Routes by boat
CREATE INDEX idx_routes_boat ON routes(boat_id);

-- Passage crew
CREATE INDEX idx_passage_crew_passage ON passage_crew(passage_id);
CREATE INDEX idx_passage_crew_user ON passage_crew(user_id);

-- Activity log (admin queries)
CREATE INDEX idx_activity_user ON activity_log(user_id, created_at DESC);
CREATE INDEX idx_activity_target ON activity_log(target_type, target_id);

-- Group membership
CREATE INDEX idx_group_members_group ON group_members(group_id) WHERE left_at IS NULL;
CREATE INDEX idx_group_members_boat ON group_members(boat_id) WHERE left_at IS NULL;
```

Partial indexes (with `WHERE` clauses) are used extensively because most queries only care about current/active records, not historical ones.
