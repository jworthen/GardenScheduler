# Firebase → Supabase + Vercel Migration

Staged plan for migrating the app off Firebase (Auth + Firestore) onto
Supabase (Auth + Postgres) and deploying via Vercel.

Each stage is independently shippable and leaves the app in a working state.

---

## Stage 0 — Harden credentials (do this before anything else)

**Goal:** Stop committing Firebase credentials in source code.

Firebase credentials are currently hardcoded in `src/lib/firebase.ts`.
They should be in environment variables regardless of which platform we end up on.

### Steps
1. Create `.env.local` at project root with the current Firebase values:
   ```
   VITE_FIREBASE_API_KEY=...
   VITE_FIREBASE_AUTH_DOMAIN=...
   VITE_FIREBASE_PROJECT_ID=...
   VITE_FIREBASE_STORAGE_BUCKET=...
   VITE_FIREBASE_MESSAGING_SENDER_ID=...
   VITE_FIREBASE_APP_ID=...
   VITE_FIREBASE_MEASUREMENT_ID=...
   ```
2. Update `src/lib/firebase.ts` to read from `import.meta.env.*`
3. Confirm `.env.local` is in `.gitignore` (Vite adds it by default)
4. Add a `.env.example` file with placeholder values for reference

### Files changed
- `src/lib/firebase.ts` — read from env vars
- `.env.local` — new (git-ignored)
- `.env.example` — new (committed)
- `.gitignore` — verify `.env.local` is listed

### Done when
- App still works locally
- No credentials appear in `git diff`

---

## Stage 1 — Vercel deployment (Firebase still in place)

**Goal:** Get the app running on Vercel before any backend changes.
Deploying first gives us a live URL to test against throughout the migration.

### Steps
1. Create `vercel.json` at project root:
   ```json
   {
     "rewrites": [{ "source": "/(.*)", "destination": "/index.html" }]
   }
   ```
   (Required so React Router deep links don't return 404.)
2. Connect the GitHub repo to a new Vercel project
3. Add all `VITE_FIREBASE_*` variables to Vercel's Environment Variables panel
4. Confirm the production deploy works end-to-end (auth, data load, mutations)

### Files changed
- `vercel.json` — new

### Done when
- Production URL resolves
- Google sign-in works on the deployed URL
- Navigating directly to `/calendar` or `/tasks` doesn't 404
- Data persists across sessions

---

## Stage 2 — Supabase project + schema

**Goal:** Create the Supabase project and define the Postgres schema.
No app code changes in this stage — just infrastructure.

### Steps

#### 2a. Create Supabase project
1. Create a new project at supabase.com
2. Note the project URL and anon key
3. Enable Google OAuth in Authentication → Providers → Google
   (Requires a Google Cloud OAuth client ID + secret)

#### 2b. Run schema migrations (in Supabase SQL Editor)

```sql
-- user_settings (1 row per user, created on onboarding)
create table user_settings (
  user_id      uuid primary key references auth.users on delete cascade,
  location     jsonb    not null default '{}',
  preferences  jsonb    not null default '{}',
  onboarding_completed boolean not null default false,
  updated_at   timestamptz not null default now()
);

-- plantings
create table plantings (
  id                    text primary key,
  user_id               uuid references auth.users on delete cascade not null,
  seed_id               text,
  seed_name             text not null,
  botanical_name        text,
  category              text,
  color                 text,
  quantity              int,
  notes                 text,
  bed_location          text,
  year                  int,
  indoor_start_date     date,
  pot_up_date           date,
  hardening_off_start   date,
  transplant_date       date,
  direct_sow_date       date,
  first_harvest_date    date,
  first_bloom_date      date,
  custom_dates          jsonb,
  completed_tasks       text[],
  succession_index      int,
  parent_planting_id    text,
  succession_interval_days int,
  created_at            timestamptz not null default now()
);

-- tasks
create table tasks (
  id                  text primary key,
  user_id             uuid references auth.users on delete cascade not null,
  planting_entry_id   text references plantings(id) on delete cascade,
  seed_id             text,
  seed_name           text,
  category            text,
  type                text,
  label               text,
  due_date            date,
  completed           boolean not null default false,
  completed_date      date,
  notes               text,
  color               text
);

-- inventory
create table inventory (
  id                  text primary key,
  user_id             uuid references auth.users on delete cascade not null,
  seed_id             text,
  variety_name        text not null,
  brand               text,
  source              text,
  year_purchased      int,
  quantity_amount     numeric,
  quantity_unit       text,
  storage_location    text,
  germination_rate    int,
  status              text,
  open_pollinated     boolean,
  seed_saving_notes   text,
  notes               text,
  created_at          timestamptz not null default now(),
  updated_at          timestamptz not null default now()
);

-- journal_entries
create table journal_entries (
  id                text primary key,
  user_id           uuid references auth.users on delete cascade not null,
  date              date,
  title             text,
  content           text,
  tags              text[],
  linked_plant_ids  text[],
  bed_location      text,
  weather           text,
  temperature_high  int,
  temperature_low   int,
  created_at        timestamptz not null default now(),
  updated_at        timestamptz not null default now()
);

-- custom_plants (full Seed shape stored as jsonb — too complex to normalize further)
create table custom_plants (
  id       text primary key,
  user_id  uuid references auth.users on delete cascade not null,
  data     jsonb not null
);
```

#### 2c. Enable Row Level Security on every table

```sql
alter table user_settings    enable row level security;
alter table plantings        enable row level security;
alter table tasks            enable row level security;
alter table inventory        enable row level security;
alter table journal_entries  enable row level security;
alter table custom_plants    enable row level security;

-- Policy template (repeat for each table)
create policy "users manage their own rows"
  on plantings for all
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);
```

### Files changed
- None (Supabase UI / SQL editor only)

### Done when
- All 6 tables exist in Supabase with RLS enabled
- Can manually insert and select a test row as an authenticated user
- Anon user cannot read any rows (verify in SQL Editor)

---

## Stage 3 — Auth swap (Firebase Auth → Supabase Auth)

**Goal:** Replace Firebase Auth with Supabase Auth. Firestore sync hook stays
in place temporarily (it will break — that's OK, we fix it in Stage 4).

### Key difference
Firebase uses `signInWithPopup` (stays on the page).
Supabase uses `signInWithOAuth` which does a **redirect** (leaves and returns).
This is more mobile-friendly and is the recommended Supabase flow.

### Steps
1. Add Supabase client: `npm install @supabase/supabase-js`
2. Create `src/lib/supabase.ts`:
   ```ts
   import { createClient } from '@supabase/supabase-js'
   export const supabase = createClient(
     import.meta.env.VITE_SUPABASE_URL,
     import.meta.env.VITE_SUPABASE_ANON_KEY
   )
   ```
3. Rewrite `src/contexts/AuthContext.tsx`:
   - `signIn()` → `supabase.auth.signInWithOAuth({ provider: 'google' })`
   - `signOut()` → `supabase.auth.signOut()`
   - Session listener → `supabase.auth.onAuthStateChange()`
4. Update `src/components/Auth/SignInPage.tsx` if it calls auth methods directly
5. Add `VITE_SUPABASE_URL` and `VITE_SUPABASE_ANON_KEY` to `.env.local`
6. Add Supabase keys to Vercel Environment Variables panel
7. Keep `firebase` package and `src/lib/firebase.ts` in place for now

### Files changed
- `src/lib/supabase.ts` — new
- `src/contexts/AuthContext.tsx` — rewrite
- `src/components/Auth/SignInPage.tsx` — minor update
- `.env.local` — add Supabase keys
- `.env.example` — add Supabase key placeholders
- `package.json` — add `@supabase/supabase-js`

### Done when
- Can sign in with Google via Supabase redirect flow
- `user` object is available in `AuthContext` after redirect returns
- Sign out clears the session
- (Data sync will be broken until Stage 4 — expected)

---

## Stage 4 — Data sync swap (Firestore → Supabase)

**Goal:** Replace `useFirestoreSync.ts` with a Supabase equivalent.
After this stage Firebase is fully removed.

### Current pattern (Firestore)
- On sign-in: fetch one blob doc → hydrate entire Zustand store
- On state change: debounced write of entire blob back

### New pattern (Supabase)
- On sign-in: parallel `SELECT *` on each table → merge into Zustand store
- On state change: `upsert` only the changed rows (client IDs are stable, so upserts are clean)

```ts
// Example upsert — plantings
await supabase.from('plantings').upsert(
  plantings.map(p => ({ ...toSnakeCase(p), user_id: userId }))
)
```

Deletions need explicit `DELETE` calls (unlike the current approach that just
overwrites the whole blob). Add deleted-item tracking or diff against the
fetched state.

### Steps
1. Create `src/hooks/useSupabaseSync.ts` mirroring the structure of `useFirestoreSync.ts`
2. Replace `useFirestoreSync()` call in `src/App.tsx` with `useSupabaseSync()`
3. Delete `src/hooks/useFirestoreSync.ts`
4. Delete `src/lib/firebase.ts`
5. Remove `firebase` from `package.json`: `npm uninstall firebase`
6. Remove all `VITE_FIREBASE_*` env vars from `.env.local` and Vercel

### Files changed
- `src/hooks/useSupabaseSync.ts` — new
- `src/hooks/useFirestoreSync.ts` — delete
- `src/lib/firebase.ts` — delete
- `src/App.tsx` — swap hook import
- `package.json` — remove `firebase`
- `.env.local` — remove Firebase vars
- `.env.example` — remove Firebase vars

### Done when
- Firebase package is gone, no Firebase imports remain
- Sign in → data loads from Supabase correctly
- Create/edit/delete a planting → change persists after page refresh
- Same for tasks, inventory, journal entries, settings

---

## Stage 5 — Firestore data migration

**Goal:** Move any existing user data from Firestore into Supabase.

### Options

**Option A — Manual re-entry** (if dataset is small)
Fastest. Just use the app fresh on Supabase.

**Option B — Migration script**
Write a one-off Node script that:
1. Reads all documents from `users/*/data/gardenData` in Firestore
2. Maps each entity to the Supabase table schema
3. Inserts rows via the Supabase service-role key (bypasses RLS)

```
scripts/
  migrate-firestore-to-supabase.ts
```

### Files changed
- `scripts/migrate-firestore-to-supabase.ts` — new (one-off, can delete after)

### Done when
- All user data is visible in the Supabase table editor
- App shows correct historical data after sign-in

---

## Dependency order

```
Stage 0 (credentials)
  └── Stage 1 (Vercel deploy)
        └── Stage 2 (Supabase schema)
              ├── Stage 3 (auth swap)
              │     └── Stage 4 (sync swap)  ← Firebase fully gone
              └── Stage 5 (data migration)   ← can run in parallel with 3/4
```

Stages 0 and 1 can be done in an afternoon.
Stages 2–4 are the core migration work (1–2 days).
Stage 5 is optional if starting fresh.

---

## Environment variables reference

| Variable | Stage added | Used by |
|---|---|---|
| `VITE_FIREBASE_*` (7 vars) | Stage 0 | Firebase client — removed in Stage 4 |
| `VITE_SUPABASE_URL` | Stage 3 | Supabase client |
| `VITE_SUPABASE_ANON_KEY` | Stage 3 | Supabase client |
| `SUPABASE_SERVICE_ROLE_KEY` | Stage 5 only | Migration script (never in frontend) |
