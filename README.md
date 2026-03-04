# GardenScheduler

A seed starting and garden planning app. Track your seed stash, get personalized sow/transplant dates based on your last frost, and plan what you're growing each season.

## What it does

- **Seed stash** — catalog the seeds you own with variety, source, and year
- **Planting calendar** — calculates ideal indoor sow, transplant, and direct-sow dates based on your USDA growing zone and last frost date
- **Garden tracking** — log what you've sown and where, track germination and harvest

## Tech stack

| Layer | Tool |
|---|---|
| Framework | React 18 + TypeScript |
| Build | Vite |
| Styling | Tailwind CSS |
| State | Zustand |
| Routing | React Router v6 |
| Drag & drop | dnd-kit |
| Backend/Auth | Firebase |

## Getting started

```bash
npm install
npm run dev
```

The app runs locally at `http://localhost:5173`.

### Other commands

```bash
npm run build    # production build → dist/
npm run preview  # serve the production build locally
```

## Project structure

```
src/
├── components/   # shared UI components
├── pages/        # top-level route pages
├── store/        # Zustand state slices
├── data/         # seed database and static reference data
├── hooks/        # custom React hooks
├── contexts/     # React context providers
├── lib/          # third-party client setup (Firebase, etc.)
├── types/        # TypeScript type definitions
└── utils/        # helper functions
```

## Roadmap

See [ROADMAP.md](./ROADMAP.md) for planned features including multi-user accounts, seed swapping, community features, and more.
