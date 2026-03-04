# GardenScheduler — Feature Roadmap

---

## Status key
- `[ ]` Not started
- `[~]` In progress
- `[x]` Done

---

## Feature 1: Multi-User Accounts & Hosting
**Priority: Must ship before features 2, 3, or 4 can work.**

The app currently runs entirely in the browser with localStorage. To support real users it needs a backend, a database, and authentication.

### Recommended stack
| Layer | Tool | Notes |
|---|---|---|
| Auth | [Supabase Auth](https://supabase.com) | Email/password + OAuth (Google) |
| Database | Supabase (Postgres) | Row-level security so users only see their own data |
| Frontend hosting | [Vercel](https://vercel.com) | Free tier, deploys from GitHub |
| Backend API | Supabase Edge Functions or a small Node/Express server | Needed for swap matching logic |

### Scope
- [ ] User registration and login (email + Google OAuth)
- [ ] Migrate localStorage state (plantings, custom plants, settings) to Supabase per-user
- [ ] Deploy frontend to Vercel
- [ ] Protected routes (redirect to login if not authenticated)
- [ ] Basic user profile (display name, growing zone, location — city/state only)

---

## Feature 2: Seed Swap
**Inspired by [MyFolia's swap system](https://web.archive.org/web/20131206102911/http://myfolia.com/swaps).**
**Requires: Feature 1.**

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

## Feature 3: Plant Share with Friends
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

## Feature 4: Paid Subscriptions
**Requires: Feature 1. Can be added after features 2 & 3 are built.**

Monetize the app for users outside your personal network.

### Suggested model
- **Free tier**: garden planner, seed database, plant share with friends (up to 5 friends)
- **Paid tier** (~$4–8/month or ~$30/year): unlimited plant share, access to seed swap marketplace, swap history & reputation

### Scope
- [ ] Stripe integration (checkout + billing portal)
- [ ] Supabase stores subscription status per user
- [ ] App gates paid features based on subscription status
- [ ] Webhook handler for subscription lifecycle events (new, canceled, renewed)
- [ ] Upgrade prompt UI when free users hit limits

---

## Feature 5: Multiple Gardens per User

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
- Depends on Feature 1 (Accounts & Hosting) — multi-garden only makes sense with cloud sync
- Free tier could cap at 1–2 gardens; paid tier gets unlimited (ties into Feature 4)


```
Feature 1 (Accounts & Hosting)
    ├── Feature 2 (Seed Swap)
    ├── Feature 3 (Plant Share)
    └── Feature 4 (Payments)  ← also depends on 2 & 3 being worth paying for
```
