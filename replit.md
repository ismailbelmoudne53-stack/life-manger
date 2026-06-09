# LifeApp — All-in-One Life Platform

An offline-capable personal life platform combining daily task management, everyday skill learning, instant language translation, and an AI personal assistant in a single app.

## Run & Operate

- `pnpm --filter @workspace/api-server run dev` — run the API server (port 8080)
- `pnpm --filter @workspace/lifeapp run dev` — run the frontend (port assigned by workflow)
- `pnpm run typecheck` — full typecheck across all packages
- `pnpm run build` — typecheck + build all packages
- `pnpm --filter @workspace/api-spec run codegen` — regenerate API hooks and Zod schemas from the OpenAPI spec
- `pnpm --filter @workspace/db run push` — push DB schema changes (dev only)
- Required env: `DATABASE_URL` — Postgres connection string
- Optional env: `OPENAI_API_KEY` — enables live AI chat and translation (falls back to offline responses without it)

## Stack

- pnpm workspaces, Node.js 24, TypeScript 5.9
- Frontend: React + Vite, Tailwind CSS, shadcn/ui, wouter routing, framer-motion
- API: Express 5
- DB: PostgreSQL + Drizzle ORM
- Validation: Zod (`zod/v4`), `drizzle-zod`
- API codegen: Orval (from OpenAPI spec)
- Build: esbuild (CJS bundle)

## Where things live

- `lib/api-spec/openapi.yaml` — single source of truth for API contracts
- `lib/db/src/schema/` — DB schema (tasks, notes, skills, lessons, lesson_progress, chat_messages, translation_records)
- `artifacts/api-server/src/routes/` — route handlers: tasks, notes, skills, chat, translate, dashboard
- `artifacts/lifeapp/src/` — React frontend
- `artifacts/lifeapp/src/pages/` — all page components

## Architecture decisions

- All API routes follow the OpenAPI-first pattern: spec → codegen → typed hooks on frontend, Zod schemas on backend
- AI chat and translation fall back to smart offline responses when `OPENAI_API_KEY` is not set, keeping the app functional without internet
- Language detection uses Unicode range checks (no external library) for lightweight source language auto-detection
- Skills and lessons are seeded at DB push time; progress is tracked separately in `lesson_progress` table
- Dashboard aggregates stats from all tables in a single request to minimize round-trips

## Product

- **Dashboard** — personalized greeting, daily task count, skills/notes summary, recent activity, AI assistant shortcut
- **Tasks** — full CRUD with priority (low/medium/high), status toggle, due dates, and category labels
- **Skills** — 6 seeded everyday skill tracks (First Aid, Finance, Cooking, Home Repair, Mindfulness, Digital Literacy) with per-lesson progress tracking
- **Translate** — translate text across 18 languages with history; falls back gracefully offline
- **Assistant** — AI chat powered by OpenAI (with offline fallback); stores full conversation history
- **Notes** — tag-based note taking with live search and inline editing

## User preferences

_Populate as you build — explicit user instructions worth remembering across sessions._

## Gotchas

- `OPENAI_API_KEY` is optional but required for real AI chat/translation; without it both features return sensible fallback responses
- Skill progress uses a separate join table — update `lesson_progress`, not the lesson itself
- `tasks/stats` route must be registered before `tasks/:id` in Express to avoid route collision

## Pointers

- See the `pnpm-workspace` skill for workspace structure, TypeScript setup, and package details
