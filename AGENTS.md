# Vocabo — Agent Guidance

## Structure

Two independent packages in one repo:

| Directory | Tech | Entry | Dev command |
|-----------|------|-------|-------------|
| `client/` | React 19, Vite 6, Tailwind v4, shadcn/ui, Redux Toolkit, Socket.IO client | `src/main.tsx` | `npm run dev` (port 3000) |
| `server/` | Express, Mongoose, Socket.IO, Zod, JWT, Google OAuth, Telegram bot | `src/server.ts` | `npm run dev` (port 8007, ts-node-dev) |

No root `package.json` — run commands from each package directory.

## Commands

- `npm run dev` — start dev server (client: Vite, server: ts-node-dev)
- `npm run build` — client: `tsc -b && vite build` / server: `tsc`
- `npm run preview` — client only, Vite preview server
- Server start in prod: `npm start`

## Key conventions

- **Module pattern** (server): `route → controller → service → model`, plus `interface.ts` and `validator.ts`/`.validation.ts`. Controllers wrapped with `catchAsync`. Errors thrown as `AppError`.
- **Vite proxy** forwards `/api` → `http://localhost:8007` in dev.
- **Client API** base is `VITE_API_URL || "/api/v1"` — in dev the Vite proxy handles it.
- **Auth**: JWT token stored in `localStorage("token")`, attached via Axios interceptor. 401s redirect to `/login`.
- **Socket.IO** used for real-time notifications. Server joins socket to user's ID on auth.
- **Validation**: Zod schemas, applied with `validatorMiddleware`.
- **File uploads**: Multer + S3 (AWS SDK, R2-compatible). Task module has extra `task.storage.ts` and `task.upload.ts`.
- **CSS**: Tailwind v4 with CSS variables for theming. Dark mode via `.dark` class. shadcn/ui components in `client/src/components/ui/`.
- **Aliases**: `@/` → `client/src/` (Vite resolve + tsconfig paths).
- **State**: Redux Toolkit + redux-persist (localStorage, key `vocabo-root`, version 6 with migrations). 7 slices: auth, teams, workspaces, columns, tasks, checklist, notifications.

## No tests

No test runner or test files exist anywhere in the repo. Do not look for or attempt to run tests.

## Environment

- `.env` is gitignored. `.env.example` files exist in both `client/` and `server/`.
- Port defaults: client 3000 / server 8007 (from `.env`). Server fallback port is 5000.

## Deployment

- Both packages deploy via **Vercel** (`vercel.json` in each).
- Server vercel.json rewrites all paths to `/api`. The server's Express `app.ts` is the entrypoint (Vercel serverless).
- Client vercel.json rewrites non-API paths to `index.html` (SPA fallback).
