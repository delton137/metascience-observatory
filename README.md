# Rigor Radar — Next.js App

## Run locally
```bash
npm install
npm run dev
```
Open http://localhost:3000

## Build and start
```bash
npm run build
npm start
```

## Tech stack
- Next.js 15
- TypeScript
- Tailwind CSS (+ tailwindcss-animate)
- shadcn/ui (Radix primitives)
- React Query

## Project structure
- `app/` — App Router pages and layout
- `components/` — UI components
- `lib/` — utilities
- `public/` — static assets (served at `/`)

## Notes
- Styling/design tokens live in `app/globals.css`.
- Tailwind container widths are tuned for wider margins on large screens.

