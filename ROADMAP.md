# Last Frost — Feature Roadmap

---

## Status key
- `[ ]` Not started
- `[~]` In progress
- `[x]` Done

---

## Complete

---

## Feature 1: Multi-User Accounts & Hosting
`[x]` **Complete.**

The app previously ran entirely in the browser with localStorage. Backend, database, and authentication are now in place using Firebase instead of the originally planned Supabase — same outcome, different stack.

### Stack (as built)
| Layer | Tool | Notes |
|---|---|---|
| Auth | Firebase Auth | Google OAuth + email/password live |
| Database | Firestore | Per-user data, synced via `useFirestoreSync` |
| Frontend hosting | Vercel | `vercel.json` configured; SPA rewrites in place |

### Scope
- [x] Google OAuth sign-in
- [x] Migrate localStorage state to Firestore per-user
- [x] Protected routes (redirect to sign-in if not authenticated)
- [x] Basic user profile (display name, growing zone, location)
- [x] Email/password sign-in with sign-up and password reset flows
- [x] Vercel deployment configured (`vercel.json` with SPA rewrites)

---

## Feature 15: Seed Database Redesign — Species-Level Model
`[x]` **Complete.**

Redesign the seed database from a variety-focused list to a species/crop-type backbone where agronomic data lives, and let users supply their own variety names.

### Rationale
The original database tried to ship a curated list of specific varieties, but no fixed dataset can cover the range of what real gardeners grow. The database is now at the *species / crop type* level (Tomato — Indeterminate, Basil, French Filet Bean, etc.) — this is where the useful agronomic data lives: frost tolerance, days to maturity ranges, spacing, sowing depth, light needs. Users supply their own variety name and attach it to a species record.

### How it works
1. The database contains crop type records with fully curated agronomic data
2. When adding a planting, the user picks a crop type, then optionally types their variety name freely
3. Planting date calculations and task generation key off the crop type; the variety name is used for display throughout
4. Planting records store both `seedId` (crop type) and `varietyName` (user-supplied)

### As built
- [x] Audit and flatten seed database to crop-type level — removed 36 redundant variety-specific records; 154 → 118 records
- [x] Cleaned up ~49 `commonName` values that embedded variety names
- [x] Added `varietyName?: string` field to `PlantingEntry` type
- [x] `addPlanting` store action accepts and persists `varietyName`
- [x] "Add to Calendar" modal: new optional Variety Name input field
- [x] Calendar, dashboard, tasks: display `varietyName` as primary label with `seedName` shown as context
- [x] Task labels (`generateTasksForPlanting`) use `varietyName` when present
- [x] Cell planner: DB-picked seeds show a "Variety label" text input; label passes through to "Start Plantings"
- [x] Two-step "Add to Calendar" picker: step 1 prompts for variety name; step 2 shows calculated dates + options
- [x] Per-planting days-to-maturity override: recalculates harvest/bloom dates live; stored as `daysToMaturityOverride`
- [x] Revised Feature 9 admin queue: renamed to "Crop Type Request Queue"; duplicate-match error explains the variety-name workaround

---

## Feature 4: Seed Cell Planner
`[x]` **Complete.**

### As built
Three-panel layout: plans list (left) | grid (center) | seed stash (right).

- Grid configuration via a "New Plan" dialog — name, cols × rows, with one-click presets for 50/72/128/288-cell flats
- Click or drag to paint cells; right-click or Eraser tool to clear; Eraser supports drag-erase
- Drag filled cells to move or swap them — filled ↔ filled swaps, filled → empty moves
- Color coding by plant category — distinct background + left-border accent per category
- Cell numbers in empty cells for orientation
- Legend below grid showing each variety and cell count
- Stash panel: Eraser, inventory seeds, plus a search-first all-seeds picker
- Plans saved per user in Firestore, synced alongside all other garden data
- Print view: sidebars hidden, grid + legend rendered clean; auto-landscape when cols > rows

### Scope
- [x] Grid configuration: columns × rows, optional flat size presets
- [x] Click-and-drag cell painting with per-seed color coding
- [x] Cell labels: variety name in each filled cell; cell number in empty cells
- [x] Save/load named plans ("Spring 2026 — Greenhouse Flat 1")
- [x] Print view: clean grid, legend at bottom, date in header, auto-landscape for wide trays
- [x] Color coding: each category gets a distinct background + accent color
- [x] Drag-to-move/swap: drag any filled cell onto another to swap (filled ↔ filled) or move (filled → empty); eraser mode disables drag

---

## Feature 20: Drag-and-Drop Cell Swap in the Cell Planner
`[x]` **Complete** (shipped as part of Feature 4).

Let users rearrange already-filled cells by dragging one cell onto another to swap their contents — without having to erase and repaint.

### Scope
- [x] Mouse-based drag on grid cells (mousedown / mousemove / mouseup — avoids browser native DnD conflicts)
- [x] Swap filled ↔ filled: exchange `CellPlanCell` data between two cell keys in the plan
- [x] Move filled → empty: cut from source, paste to target
- [x] Auto-save plan after each drag operation (same as paint/erase)
- [x] Visual affordance: drag-over cell gets a highlighted border; source cell dims to 40% opacity
- [x] Grab cursor on filled cells when no seed or eraser is active
- [x] Eraser-active state disables drag-and-drop to avoid conflicting gestures
- [x] Hint bar updates to "Dragging — drop onto another cell to move or swap it." during a drag
- [x] Print view unaffected

---

## Feature 3: Printable Seed Tags with QR Codes
`[x]` **Complete.**
**No dependencies — standalone feature. Works even better with Feature 1 (accounts) for persistent tag URLs.**
**Inspired by: MyFolia (QR code plant tags).**

Generate print-ready tags for each plant in your garden. Each tag includes the variety name, sow date, and a QR code that links back to the plant's detail page in Last Frost — scan it in the garden to pull up care notes, harvest dates, and journal entries instantly.

### How it works
1. User selects one or more plants from their current plantings or stash
2. The app generates a print-ready sheet of tags — multiple per page to minimize paper waste
3. Each tag encodes a URL (or a local data payload for offline use) into a QR code
4. User prints, cuts, and stakes tags in the garden or sticks them to seed packets
5. Scanning the QR code in any phone camera opens the plant detail view in Last Frost

### Tag content
- Variety name (large, readable at a glance)
- Plant type (e.g. Tomato, Basil)
- Sow date / transplant date
- QR code linking to the plant or planting record
- Optional: days to maturity, spacing reminder, custom note

### Scope
- [x] Tag generator: "Print Seed Tag" button in planting detail panel
- [x] QR code generation (client-side, react-qr-code — SVG, no external service)
- [x] Deep-link support: /calendar?p={plantingId} opens the detail panel (QR scan target)
- [x] Standard stake tag (1×4") — first pass
- [x] Print stylesheet: body.printing-seed-tag hides all UI chrome, shows only the tag at physical 1×4" dimensions
- [x] Round pot label layout (2.5″ circle with cut-guide border)
- [x] Seed packet label layout (3.5″ × 2″ landscape, two-column)
- [x] Offline-safe QR option: encodes plant name, crop type, and key dates as plain text directly in the QR payload — readable on any phone without internet
- [x] Bulk print: "Print Tags" button on the Plantings page prints all visible plantings at once, repeating each tag by quantity

---

## Feature 22: Plantings Page
`[x]` **Complete.**

### As built
Dedicated sidebar page for viewing and managing all planting records.

- Card grid layout — variety name, crop type, bed location, sow/transplant/harvest/bloom date pills
- Search by name or bed; filter by crop category and bed location; sort by sow date, name, or transplant date
- Sort preference persisted across navigation (localStorage)
- Clicking a card opens the planting detail panel (dates, notes, succession planting, photos, seed tag)
- Delete button per card (hover reveal); bulk "Delete All" with confirmation
- Empty state for new users with link to add seeds

### Scope
- [x] Plantings route and page component
- [x] Sidebar nav link
- [x] Planting card component
- [x] Search, filter by bed, filter by category
- [x] Sort by sow date, name, transplant date (persisted)
- [x] Empty state for new users

---

## Feature 11: Plant Share with Friends
`[x]` **Complete.**
**Requires: Feature 1.**

Mark seedlings as available to share and send a link — anyone with the link can browse your share list and claim plants without needing an account. Coordination stays entirely in the app.

### How it works
1. Grower marks individual plantings as "available to share" and sets a quantity (e.g. "8 Cherokee Purple tomato starts available")
2. The app generates a unique shareable link tied to their profile — one link, always up to date
3. Anyone with the link can open the public share page, see what's available, and submit a reservation with their name and email — no account needed
4. The public page offers a "Try Last Frost free" sign-up prompt but never requires it
5. The grower sees incoming reservations in-app, confirms or cancels them, and the available count updates in real time

### Data model
- `PlantingEntry.availableToShare?: number` — quantity offered; undefined or 0 = not sharing
- `shareToken: string` on user profile — a random token generated once, used as the public URL key
- **`sharePages/{token}`** (Firestore) — public-readable document: grower display name + snapshot of their currently shared plantings; updated whenever sharing settings change
- **`shareReservations/{id}`** (Firestore) — public-writable, owner-readable: `{ ownerUid, shareToken, plantingId, plantingName, quantity, claimerName, claimerEmail, claimerNote?, status: 'pending'|'confirmed'|'cancelled', createdAt }`

### Firestore security rules
- `sharePages`: public read, owner write only
- `shareReservations`: anyone can create (field validation enforced in rules); only the ownerUid can read and update status

### Scope

**Grower — in-app:**
- [x] Add `availableToShare?: number` to `PlantingEntry` type
- [x] "Available to share" quantity input on the planting detail panel — shows sharing badge on the planting card when set
- [x] Generate `shareToken` on first use (nanoid, stored on user profile in Firestore)
- [x] "Copy share link" button on the profile page
- [x] In-app reservations view: list of reservations with claimant name, email, quantity, and status
- [x] Confirm / cancel reservation actions (updates `status` in Firestore)

**Public share page — `/share/:token`:**
- [x] Public route outside the auth wrapper — no sign-in required
- [x] Reads `sharePages/{token}` — shows grower's name and their shared plantings with quantity still available (total minus confirmed reservations)
- [x] Plant cards: variety name, crop type, date pills (transplant / harvest / bloom), per-plant quantity stepper capped at available count
- [x] Responsive grid layout: 1 / 2 / 3 columns at sm / lg breakpoints
- [x] Plants sorted alphabetically; cards with 0 remaining hidden
- [x] Reservation form: name (required), email (required), quantity per plant, optional note
- [x] Confirmation screen after submitting — no account needed
- [x] Sign-up CTA ("Try Last Frost free") — prominent but skippable

**Backend:**
- [x] `sharePages/{token}` document written/updated whenever a planting's `availableToShare` value changes or sharing settings change
- [x] `shareReservations` Firestore security rules (public create, owner read/update)

### Notes
- The share link is permanent and always reflects current availability — no need to re-send when plantings change
- No email sent by the app; coordination (pick-up time, location) happens however the grower and claimant prefer outside the app
- Available quantity on the public page deducts confirmed reservations only, so pending claims don't block others from reserving

---

## In Progress

---

## Feature 6: Photo Journaling
`[~]` **Partially complete.**
**Requires: Feature 1 (for cloud image storage).**
**Inspired by: MyFolia, Gardenize, Garden Tags, Growstuff.**

Let users attach photos to journal entries, planting records, and harvest logs to build a visual record of each season.

### How it works
1. Any journal entry, planting, or harvest log can have one or more photos attached
2. Each planting accumulates a photo timeline showing the plant's progression from seed to harvest
3. A garden gallery view shows all photos in reverse-chronological order

### Scope
- [x] Photo upload on journal entries (Firebase Storage)
- [x] Photo attachment on planting records
- [x] Garden gallery: all photos across journal entries and plantings in a grid view, filterable by source
- [x] Photos deleted from Storage when parent entry or planting is removed
- [x] Client-side 10 MB size guard before upload
- [ ] Photo attachment on harvest logs (blocked on Feature 2)
- [ ] Per-planting photo timeline (chronological, labeled by milestone or date)
- [ ] Optional: weather conditions auto-recorded alongside each photo entry (inspired by MyFolia)

---

## Feature 16: Garden Bed Manager
`[~]` **Partially complete.**
**No dependencies — enriches most other features.**

Make "bed location" a real entity rather than a free-text field. Named, dimensioned beds unlock per-bed planting history, companion checks, and eventually a visual layout.

### How it works
1. User defines their beds once (name, dimensions, notes) — e.g. "Raised Bed A (4×8 ft)", "Front Border", "Greenhouse Bench"
2. When adding a planting, bed location is a dropdown of named beds rather than a text field
3. The calendar and dashboard can filter by bed; per-bed history builds over seasons

### Scope
- [x] Bed model: id, name, width, length, notes, indoor flag (for seed-starting areas)
- [x] Bed manager UI in Settings: create, edit, delete beds with inline forms
- [x] Planting form: "Bed Location" uses datalist autocomplete from named beds (free-text still allowed)
- [x] Journal form: same datalist autocomplete for bed location
- [x] Beds synced to Firestore alongside other user data
- [ ] Calendar / timeline: filter by bed
- [ ] Dashboard: per-bed planting count for the current season
- [ ] Optional: per-bed yield history once Feature 2 (Harvest Tracking) ships
- [ ] Optional: "What's in this bed" summary — all current and past plantings for a given bed

### Notes
- Lays the groundwork for a drag-and-drop visual garden map later
- Beds scoped per garden if Feature 7 (Multiple Gardens) ships

---

## Feature 5: Companion Planting Recommendations
`[~]` **Partially complete.**
**No dependencies — enriches the existing seed database.**
**Inspired by: GrowVeg (evidence-based only), Planter (real-time visual alerts), SmartGardener.**

Show which plants help each other and which should be kept apart, based on scientific evidence rather than gardening folklore.

### How it works
1. Each seed in the database has a list of beneficial companions and plants to avoid
2. When a user views a seed, companions are shown with a brief rationale
3. In future, companions could be highlighted visually when placing plants near each other in the Seed Cell Planner

### Design principle — evidence-based only
Follow GrowVeg's approach: only list companions supported by published research. Don't list "bad companions" unless the evidence is solid — much of the bad-companion folklore (e.g. onions stunting beans) has never been scientifically confirmed.

### Scope
- [x] Companion data fields on seed records: `companionPlants: string[]`, `avoidPlanting: string[]`
- [x] Companion planting section on seed detail pages
- [ ] "Good neighbors" badge on the planting calendar when a companion is already planted nearby (same bed)
- [ ] Optional: filter seed database by "companions well with [X]"

---

## Feature 9: User-Requested Database Additions
`[~]` **Mostly complete — reduced in scope given seed DB redesign direction.**

Allow users to request that a new crop type be added to the database. Under the redesigned model (Feature 15), the database covers species/crop types rather than individual varieties — so the request pipeline is narrower and lower-volume than originally planned.

### How it works
1. User submits a request for a missing crop type
2. The request is queued for admin review, optionally auto-filled via OpenFarm API
3. Once approved, the entry is available to all users

### Guardrails
- Duplicate detection: check if the entry already exists before accepting the request
- Rate limiting: cap requests per user per day to prevent spam
- Admin review queue: all new entries require approval before going live
- Minimal required fields: plant type at minimum; freeform notes optional

### Scope
- [x] Request submission form (type + variety + optional notes)
- [x] Duplicate check against existing database entries on submission
- [x] Admin review queue UI (approve / reject / request more info)
- [x] Automated pre-population via OpenFarm API — "Auto-fill" button in the approve modal
- [x] Rate limiting: 5 requests per user per day
- [ ] Email/notification to user when their request is approved or rejected
- [ ] Ability for users to submit corrections to existing crop entries (e.g. wrong spacing) — routed to the same admin review queue

---

## Planned — Near Term

---

## Feature 2: Harvest Tracking
**No dependencies — can be built now.**
**Inspired by: MyFolia, GrowVeg, SmartGardener, Growstuff.**

Close the loop on the growing cycle by letting users record what they actually got out of the ground.

### How it works
1. From any planting record, tap "Log Harvest" and enter date, quantity, and unit (lbs, oz, count, bunches, etc.)
2. The planting accumulates a running harvest total across the whole season
3. The dashboard shows total harvests this season and a "money saved" estimate based on average grocery prices

### Scope
- [ ] Harvest log model: plantingId, date, quantity, unit, notes
- [ ] "Log Harvest" button on planting cards and planting detail page
- [ ] Running harvest total per planting (shown on planting card)
- [ ] Season summary on dashboard: total harvests by crop, total weight
- [ ] Optional: money-saved calculator — user enters market price per unit; app shows cumulative value of all harvests (inspired by SmartGardener)
- [ ] Optional: average yield per bed/area over multiple seasons

### Notes
- Harvest data is already implicitly expected by users who log plantings — this is the natural completion of the planting lifecycle
- Harvest history becomes more valuable over seasons as a record of what actually performed well

---

## Feature 19: Pest & Disease Log
**No dependencies — natural extension of the journal.**
**Inspired by: MyFolia, Growstuff, GrowVeg.**

Record pest sightings and disease observations linked to specific plantings so problems can be tracked and patterns spotted across seasons.

### How it works
1. From any planting detail, the user logs an observation — pest spotted, disease signs, environmental damage
2. Observations are tagged by type and severity; photos (Feature 6) can be attached
3. Active high-severity issues surface on the dashboard

### Scope
- [ ] Observation model: plantingId, date, type (pest / disease / environmental), name, severity (low / medium / high), notes, photos
- [ ] "Log Observation" button on planting detail panel
- [ ] Observations list on planting detail: chronological with severity badges
- [ ] Dashboard alert for plantings with active high-severity observations
- [ ] Optional: common pest/disease name lookup with basic treatment notes
- [ ] Optional: season-level observation history, filterable by type

---

## Feature 21: Cell Planner Seeding Task
**Requires: Feature 4 (Cell Planner).**

Let users attach a target seeding date to a cell plan so the task list reminds them when it's time to fill the flat.

### How it works
1. Each cell plan gains an optional "Seeding date" field — a date picker on the plan detail or in the New/Edit Plan dialog
2. When a seeding date is set, the app creates one task: "Seed [Plan Name] flat" due on that date
3. The task appears in the task list and dashboard like any other task; completing it marks the flat as seeded
4. If the seeding date is changed or the plan is deleted, the task updates or is removed accordingly

### Scope
- [ ] Add optional `seedingDate?: string` field to `CellPlan` type
- [ ] Date picker for seeding date in the New Plan dialog and in the plan header (edit in place)
- [ ] On save, create a single `custom` task tied to the plan: "Seed [Plan Name] flat" on `seedingDate`
- [ ] On plan update (date changed or cleared), remove the old task and create a new one if needed
- [ ] On plan delete, remove the associated seeding task
- [ ] Task displays the plan name and optionally the cell count: "Seed Spring Flat 1 (72 cells)"

### Notes
- One task per plan regardless of how many varieties are in it — the unit of work is filling the whole flat
- Does not replace or duplicate the individual start-indoors tasks generated from calendar plantings; this is specifically for planning sessions where the user works from the cell planner rather than from individual planting records

---

## Feature 18: Season Management & Year-Over-Year History
**No hard dependencies — more valuable once users have completed at least one season.**

Make the app aware of seasons so users can start fresh each year without losing history.

### How it works
1. A year picker scopes the calendar, tasks, and dashboard to the active season
2. A "New Season" wizard at year-start lets users archive the old season and carry forward recurring plantings
3. Past seasons stay fully browsable

### Scope
- [ ] Season / year selector in the sidebar or header that scopes calendar, tasks, and dashboard
- [ ] "Start New Season" wizard: review last year's plantings, select which to carry forward (with recalculated dates), archive the rest
- [ ] Archived season view: read-only calendar and journal for past years
- [ ] Dashboard year-over-year note: e.g. "You started tomatoes 3 weeks earlier this year than last"
- [ ] Perennial / recurring planting flag: marks a planting to auto-seed into the new season
- [ ] Optional: end-of-season summary entry — freeform "season retrospective" journal type

---

## Feature 17: Task Notifications
**Requires: Feature 1.**

Push upcoming tasks and frost warnings to users so they don't have to open the app every day to stay on schedule.

### How it works
1. User opts into notifications and sets delivery preferences
2. A daily digest lists tasks due today and coming up; frost alerts fire when the forecast dips near the user's threshold

### Scope
- [ ] Notification preferences: on/off, lead time (1 / 3 / 7 days ahead), delivery method (email / browser push)
- [ ] Daily digest email: tasks due today + next 3 days, formatted cleanly, unsubscribe link
- [ ] Browser push notification support (service worker + Web Push API)
- [ ] Frost warning: triggered when forecast low ≤ last spring frost temp + configurable buffer
- [ ] Scheduled Cloud Function (or cron job) to evaluate and send notifications
- [ ] Snooze / unsubscribe controls in the app

### Notes
- Email delivery via Firebase Trigger Email extension or a transactional provider (Resend, SendGrid)
- Frost alerts require a weather API — Open-Meteo is free, accurate, and requires no API key
- Ship email-only first; push notifications follow once the email flow is stable

---

## Feature 8: In-App User Feedback & Suggestions
`[x]` **Complete.**
**No dependencies — standalone feature.**

Let users send feature suggestions, bug reports, or general feedback without leaving the app. Lightweight and low-friction — a single form that routes to a moderated inbox.

### How it works
1. A persistent "Send Feedback" button lives in the sidebar, accessible from every page
2. User selects a category (Bug Report / Feature Request / General), writes a short message, and submits
3. Submissions land in the admin feedback inbox at `/admin/feedback`

### Guardrails
- Rate limiting per user: max 5 submissions per day (checked against Firestore)
- Category required (reduces noise, helps triage)
- No PII collected beyond what the user voluntarily includes in the message
- No public-facing voting or comment threads in v1 — keep it simple and one-directional first

### Scope
- [x] "Send Feedback" button in the sidebar, accessible from all pages
- [x] Submission modal: 3-category selector (Bug / Feature / General) + freeform text (500 char limit with live counter)
- [x] Success state with confirmation message after submit
- [x] Rate limit: max 5 submissions per user per day (Firestore-backed)
- [x] Admin inbox at `/admin/feedback`: list filterable by status (new/read/resolved) and category
- [x] Mark as Read / Resolve / Reopen actions on each submission
- [x] New submissions highlighted with green left border; new count in page subtitle
- [ ] Auto-reply email acknowledging receipt — deferred (needs Firebase Trigger Email extension)
- [ ] Optional in v2: upvoting / "me too" on surfaced suggestions

---

## Planned — Later

---

## Feature 7: Multiple Gardens per User
**Requires: Feature 1.**

Allow a single user to manage more than one named garden (e.g. "Front Yard Beds", "Community Plot", "Greenhouse").

### How it works
1. User creates one or more gardens, each with its own name, location, and frost dates
2. A garden switcher in the sidebar lets the user jump between gardens
3. All plantings, tasks, inventory, and journal entries are scoped to the active garden
4. Firestore path changes from `users/{uid}/data/gardenData` to `users/{uid}/gardens/{gardenId}/data`

### Scope
- [ ] Garden model: id, name, location (zone, frost dates), createdAt
- [ ] Garden switcher UI in the sidebar (dropdown or list)
- [ ] "New garden" flow (name + location, mirrors onboarding)
- [ ] All store state scoped per garden; switching garden loads that garden's data from Firestore
- [ ] Profile page lists all gardens with edit/delete options
- [ ] Migrate existing single-garden data to the new multi-garden Firestore structure

### Notes
- Free tier could cap at 1–2 gardens; paid tier gets unlimited (ties into Feature 14)

---

## Feature 10: Seed Swap Marketplace
**Requires: Feature 1.**
**Inspired by [MyFolia's swap system](https://web.archive.org/web/20131206102911/http://myfolia.com/swaps).**

A community swap marketplace where users list seeds they have and seeds they want, and the app automatically finds compatible swap partners.

### How it works
1. **Stash** — user marks seeds from the seed database as "I have this to swap," with quantity and any notes (e.g. "2026 harvest, 20 seeds")
2. **Wishlist** — user marks seeds they are looking for
3. **Matching** — the app finds other users where:
   - My stash contains something on their wishlist, AND
   - Their stash contains something on my wishlist
4. **Swap request** — either user can initiate a swap proposal, specifying which seeds they're offering and what they'd like in return
5. **Swap tracking** — each accepted swap gets a unique swap ID; both parties mark it complete once seeds have been received

### Scope
- [ ] Stash: add/remove seeds from seed database, set quantity, add notes
- [ ] Wishlist: add/remove seeds from seed database
- [ ] Match feed: list of users with compatible stash/wishlist pairs
- [ ] Swap request flow: propose → accept/decline → in-transit → received
- [ ] Swap history and tracking per user
- [ ] Optional: map showing where seeds have traveled (like MyFolia)
- [ ] Optional: public user profiles showing stash and swap reputation

---

## Feature 12: Serendipity Seed Labels
**Requires: Feature 10 (Seed Swap / Stash).**
**Directly inspired by MyFolia — no other app has replicated this.**

A printable label system for leaving seed packets in random public places (libraries, cafés, community boards) for strangers to find and grow — inspired by BookCrossing.

### How it works
1. From the Seed Stash (Feature 10), mark a packet as a "Serendipity Pack" — seeds you intend to leave somewhere for a stranger
2. The app generates a printable label with the plant name, brief growing notes, your username, and a unique tracking code
3. When someone finds a packet and has the app, they can enter the code to "claim" the seeds, log where they found it, and optionally notify the original owner
4. A public map shows where packets have been left and claimed — watching your seeds travel is the reward

### Scope
- [ ] "Leave as Serendipity" option on stash items
- [ ] Printable label generator (plant name, growing notes, unique code, QR code linking to claim page)
- [ ] Public claim page (no account required to claim)
- [ ] Claim notification to original owner
- [ ] Global map showing where each packet was left and claimed
- [ ] Optional: chain tracking if a claimant re-leaves the seeds again elsewhere

### Notes
- This is a viral/word-of-mouth growth feature — every label left in public is a physical advertisement for the app
- Could be a paid-tier feature or a free feature with paid cosmetic label designs

---

## Feature 13: Community Profiles & Activity Feed
**Requires: Feature 1.**
**Inspired by: MyFolia (news feed, friend gardens, community groups), Garden Tags, Growstuff.**

Turn Last Frost from a solo planning tool into a social gardening network — users can follow each other, see what neighbors are planting, and get inspired by local gardeners in their climate zone.

### How it works
1. Each user gets an optional public profile showing their garden name, zone, current plantings, and harvest highlights
2. A "Community" feed shows recent activity from users you follow: new plantings sowed, harvests logged, journal entries posted
3. Zone-filtered discovery: browse what gardeners in the same USDA zone are growing right now

### Scope
- [ ] Public profile toggle (opt-in — private by default)
- [ ] Follow / unfollow other users
- [ ] Activity feed: follows' recent plantings, harvests, and journal posts
- [ ] Zone discovery page: most popular crops being planted in your zone this month
- [ ] Community groups / special interest clubs (e.g. "Heirloom Tomatoes", "Seed Savers", "Zone 6 Growers")
- [ ] Optional: "What's being sown near me" filtered by geographic region

### Notes
- MyFolia built one of the most beloved gardening communities online before shutting down in 2019; Last Frost could fill that gap
- Community data (most popular crops by zone and month) becomes a product in itself — it makes the planting calendar smarter over time

---

## Feature 14: Paid Subscriptions
**Requires: Feature 1. Best added after Features 10 & 11 are built and proven.**

Monetize the app for users outside your personal network.

### Suggested model
- **Free tier**: garden planner, seed database, plant share with friends (up to 5 friends), harvest tracking, seed tags, cell planner
- **Paid tier** (~$4–8/month or ~$30/year): unlimited plant share, access to seed swap marketplace, swap history & reputation, multiple gardens, serendipity labels

### Scope
- [ ] Stripe integration (checkout + billing portal)
- [ ] Firestore stores subscription status per user
- [ ] App gates paid features based on subscription status
- [ ] Webhook handler for subscription lifecycle events (new, canceled, renewed)
- [ ] Upgrade prompt UI when free users hit limits

---

## Dependency map

```
Feature 1 (Accounts & Hosting)  [x]
    ├── Feature 6 (Photo Journaling)  [~]
    ├── Feature 7 (Multiple Gardens)
    ├── Feature 10 (Seed Swap)
    │       └── Feature 12 (Serendipity Labels)
    ├── Feature 11 (Plant Share)  [x]
    ├── Feature 13 (Community Profiles & Feed)
    ├── Feature 14 (Payments)  ← also depends on 10 & 11 being worth paying for
    └── Feature 17 (Task Notifications)  ← needs email/push infrastructure

Standalone (no accounts needed):
    ├── Feature 2 (Harvest Tracking)
    │       └── Feature 6 remaining scope (harvest log photos)
    ├── Feature 3 (Printable Seed Tags / QR Codes)  [x]
    ├── Feature 4 (Seed Cell Planner)  [x]
    │       ├── Feature 20 (Drag-and-Drop Cell Swap)  [x]
    │       └── Feature 21 (Cell Planner Seeding Task)
    ├── Feature 5 (Companion Planting)  [~]
    ├── Feature 8 (In-App Feedback)
    ├── Feature 9 (Database Addition Requests)  [~]
    │       └── Feature 15 (Seed DB Redesign — narrows request scope)  [x]
    ├── Feature 15 (Seed DB Redesign)  [x]
    ├── Feature 16 (Garden Bed Manager)  [~]
    ├── Feature 18 (Season Management)
    ├── Feature 19 (Pest & Disease Log)
    └── Feature 22 (Plantings Page)  [x]
```
