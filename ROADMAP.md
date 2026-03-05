# Last Frost — Feature Roadmap

---

## Status key
- `[ ]` Not started
- `[~]` In progress
- `[x]` Done

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

## Feature 3: Printable Seed Tags with QR Codes
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
- [ ] Tag generator: select plantings → generate tag sheet
- [ ] QR code generation (client-side, no external service required)
- [ ] Multiple tag sizes / layouts: standard stake tag (1×4"), round pot label, seed packet label
- [ ] Print stylesheet: clean layout, no UI chrome, cuts cleanly on a grid
- [ ] Offline-safe QR option: encode key data directly in the QR payload rather than a URL, so tags work without an internet connection
- [ ] Optional: custom logo or garden name in the tag header

### Notes
- MyFolia's QR tags were one of its most distinctive and beloved features — worth emulating closely
- For unauthenticated users, the QR code can encode a compact JSON payload (variety, dates, notes) directly so the tag remains useful even without an account or a live URL

---

## Feature 4: Seed Cell Planner
`[x]` **Complete.**

### As built
Three-panel layout: plans list (left) | grid (center) | seed stash (right).

- Grid configuration via a "New Plan" dialog — name, cols × rows, with one-click presets for 50/72/128/288-cell flats
- Click or drag to paint cells; right-click or Eraser tool to clear; Eraser supports drag-erase
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

---

## Feature 5: Companion Planting Recommendations
**No dependencies — enriches the existing seed database.**
**Inspired by: GrowVeg (evidence-based only), Planter (real-time visual alerts), SmartGardener.**

Show which plants help each other and which should be kept apart, based on scientific evidence rather than gardening folklore.

### How it works
1. Each seed in the database gains a list of beneficial companions and plants to avoid
2. When a user views a seed or a planting, companions are shown with a brief rationale
3. In future, companions could be highlighted visually when placing plants near each other in the Seed Cell Planner

### Design principle — evidence-based only
Follow GrowVeg's approach: only list companions supported by published research. Don't list "bad companions" unless the evidence is solid — much of the bad-companion folklore (e.g. onions stunting beans) has never been scientifically confirmed.

### Scope
- [ ] Companion data fields on seed records: `companions: string[]`, `avoid: string[]`, `companionNotes: string`
- [ ] Companion planting section on seed detail pages
- [ ] "Good neighbors" badge on the planting calendar when a companion is already planted nearby (same bed)
- [ ] Optional: filter seed database by "companions well with [X]"

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
- Free tier could cap at 1–2 gardens; paid tier gets unlimited (ties into Feature 11)

---

## Feature 8: In-App User Feedback & Suggestions
**No dependencies — standalone feature.**

Let users send feature suggestions, bug reports, or general feedback without leaving the app. Lightweight and low-friction — a single form that routes to a moderated inbox.

### How it works
1. A persistent "Send Feedback" entry point lives in the app (footer link or help menu)
2. User selects a category (Bug report / Feature suggestion / General feedback), writes a short message, and submits
3. Submissions land in an admin inbox; popular or recurring suggestions can be surfaced to inform the roadmap

### Guardrails
- Rate limiting per user/IP to prevent spam
- Category required (reduces noise, helps triage)
- No PII collected beyond what the user voluntarily includes in the message
- No public-facing voting or comment threads in v1 — keep it simple and one-directional first

### Scope
- [ ] Feedback button/link accessible from all pages
- [ ] Submission form: category selector + freeform text (500 char limit)
- [ ] Rate limit: max 5 submissions per user per day
- [ ] Admin inbox view: list of submissions filterable by category and date
- [ ] Auto-reply email acknowledging receipt (optional but friendly)
- [ ] Optional in v2: upvoting / "me too" on surfaced suggestions

---

## Feature 9: User-Requested Database Additions
`[~]` **Mostly complete — reduced in scope given seed DB redesign direction.**

Allow users to request that a new crop type be added to the database. Under the redesigned model (see Feature 15), the database covers species/crop types rather than individual varieties — so the request pipeline is narrower and lower-volume than originally planned.

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

### Note
If Feature 15 ships, variety-level requests go away entirely; the queue becomes strictly for missing crop types, which will be infrequent. The admin UI and rate limiting remain useful regardless.

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

## Feature 11: Plant Share with Friends
**Requires: Feature 1.**

A simpler, closed sharing feature for people starting seeds and giving away extra seedlings to a circle of friends.

### How it works
1. You log how many seedlings you're starting and how many are available to share (e.g. "Starting 48 Early Girl tomato, 30 available")
2. Friends (invited by email or link) can see your share list and reserve a quantity
3. You see a summary of who reserved what so you know how many to harden off

### Scope
- [ ] Seed-starting log: for each variety, set "starting" and "available to share" quantities
- [ ] Share link or invite-by-email to a friends group
- [ ] Friends can view available plants and place a reservation
- [ ] Grower sees reservations per variety with contact info
- [ ] Reservation confirmation/cancellation flow
- [ ] Optional: pick-up date scheduling

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

## Design Note: Seed Database Model

**The current approach isn't scalable.** The built-in seed database tries to ship a curated list of specific varieties, but no fixed dataset can cover the range of what real gardeners actually grow. Some observations:

- There are tens of thousands of tomato varieties alone — any static list will always feel thin or arbitrary
- The request pipeline (Feature 9) was designed to patch this gap, but it doesn't scale operationally
- Users already type in their own variety names when adding to inventory — they don't need us to have their exact variety pre-loaded

**Direction to explore: high-level species as the backbone, user-supplied variety names**

Keep the database at the *species / crop type* level (Tomato, Basil, French Filet Bean, etc.) rather than the variety level. This is where the useful agronomic data lives anyway — frost tolerance, days to maturity ranges, spacing, sowing depth, light needs. Specific variety differences (days to maturity variance, flavor, color) are refinements, not the core.

Users bring their own variety name and attach it to a species record. The workflow would look like:

1. User picks a crop type from the database (e.g. "Tomato — Indeterminate")
2. They enter their own variety name (e.g. "Cherokee Purple") — free text, no lookup required
3. Planting dates and care tasks are calculated from the species-level data
4. Their variety name shows up on their calendar, tags, and journal — everything feels personal

**What this changes:**
- Feature 9 (database addition requests) becomes less important — you're no longer crowdsourcing variety records, just fixing or adding crop types
- The seed database becomes a set of maybe 100–200 species/type entries, all fully curated and trusted, instead of an ever-growing list of varieties
- Companion planting (Feature 5) and cell planner color coding stay the same — those key off category/species, not variety
- Inventory already supports free-text variety names — the rest of the app needs to catch up

**Open questions:**
- How granular should "species" be? (e.g. is "Tomato — Cherry" a separate record from "Tomato — Beefsteak", or just one "Tomato" record with a size note?)
- Should users be able to override the species-level agronomic data per-variety? (e.g. a particularly early variety with shorter days to maturity)
- Does this change how Feature 10 (Seed Swap) works? Users swapping specific varieties still need to describe what they have — probably just free text.

---

## Feature 15: Seed Database Redesign — Species-Level Model
**No hard dependencies, but should be done before the user base grows large.**

Redesign the seed database from a variety-focused list to a species/crop-type backbone where agronomic data lives, and let users supply their own variety names. See the Design Note section for full rationale.

### How it works
1. The database contains ~100–200 crop type records (e.g. "Tomato — Indeterminate", "Basil — Large Leaf", "Carrot") with fully curated agronomic data: sowing depth, spacing, days to maturity range, frost tolerance, light needs
2. When adding a planting, the user picks a crop type, then types their variety name freely
3. Planting date calculations and task generation key off the crop type; the variety name is display-only
4. Existing planting records migrate cleanly: `seedId` still points to a crop type record; the user's variety name lives in a new `varietyName` field

### Scope
- [ ] Audit and flatten current seed database to species/crop-type level — remove redundant variety-specific records, keep or split where agronomic data meaningfully differs (e.g. "Tomato — Cherry" vs "Tomato — Beefsteak" have different spacing and days to maturity)
- [ ] Add `varietyName` free-text field to `PlantingEntry`; update calendar, tags, and journal to display it
- [ ] Update "Add Plant" flow: step 1 picks a crop type, step 2 is a free-text variety name
- [ ] Update cell planner seed picker: shows crop types; user labels cells with variety name
- [ ] Optional: allow per-planting override of days-to-maturity (for unusually early or late varieties)
- [ ] Revise Feature 9 admin queue to handle only missing crop type requests, not variety additions

### Notes
- "What Can I Plant" tool, companion planting, and cell planner color coding all key off category/type — unaffected
- Inventory already uses free-text variety names; the planting flow is the main gap
- Granularity rule of thumb: split crop types only when agronomic data meaningfully differs (spacing, sowing method, days to maturity range)

---

## Feature 16: Garden Bed Manager
**No dependencies — enriches most other features.**

Make "bed location" a real entity rather than a free-text field. Named, dimensioned beds unlock per-bed planting history, companion checks, and eventually a visual layout.

### How it works
1. User defines their beds once (name, dimensions, notes) — e.g. "Raised Bed A (4×8 ft)", "Front Border", "Greenhouse Bench"
2. When adding a planting, bed location is a dropdown of named beds rather than a text field
3. The calendar and dashboard can filter by bed; per-bed history builds over seasons

### Scope
- [ ] Bed model: id, name, width, length, notes, indoor flag (for seed-starting areas)
- [ ] Bed manager UI (settings page or dedicated section): create, edit, reorder, delete beds
- [ ] Planting form: "Bed Location" becomes a dropdown with an inline "add new bed" option
- [ ] Calendar / timeline: filter by bed
- [ ] Dashboard: per-bed planting count for the current season
- [ ] Optional: per-bed yield history once Feature 2 (Harvest Tracking) ships
- [ ] Optional: "What's in this bed" summary — all current and past plantings for a given bed

### Notes
- Lays the groundwork for a drag-and-drop visual garden map later
- Beds scoped per garden if Feature 7 (Multiple Gardens) ships

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

## Dependency map

```
Feature 1 (Accounts & Hosting)  [x]
    ├── Feature 6 (Photo Journaling)  [~]
    ├── Feature 7 (Multiple Gardens)
    ├── Feature 10 (Seed Swap)
    │       └── Feature 12 (Serendipity Labels)
    ├── Feature 11 (Plant Share)
    ├── Feature 13 (Community Profiles & Feed)
    ├── Feature 14 (Payments)  ← also depends on 10 & 11 being worth paying for
    └── Feature 17 (Task Notifications)  ← needs email/push infrastructure

Standalone (no accounts needed):
    ├── Feature 2 (Harvest Tracking)
    │       └── Feature 6 remaining scope (harvest log photos)
    ├── Feature 3 (Printable Seed Tags / QR Codes)
    ├── Feature 4 (Seed Cell Planner)  [x]
    ├── Feature 5 (Companion Planting)
    ├── Feature 8 (In-App Feedback)
    ├── Feature 9 (Database Addition Requests)  [~]
    │       └── Feature 15 (Seed DB Redesign — narrows request scope)
    ├── Feature 15 (Seed DB Redesign)
    ├── Feature 16 (Garden Bed Manager)
    ├── Feature 18 (Season Management)
    └── Feature 19 (Pest & Disease Log)
```
