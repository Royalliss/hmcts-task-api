# HMCTS Task API

A small REST API for tracking the tasks an HMCTS caseworker needs to get through their day - e.g. _"review bundle for case CR-2026-00412"_, _"issue directions order"_, _"process fee remission"_. Built for the HMCTS DTS Developer take-home.

The brief is intentionally simple, so the value of this repo is in the boring stuff: a clean layered structure, strict input validation, a single error contract, real (not mocked) database tests, and OpenAPI docs.

## Stack

| Concern | Choice | Why |
| --- | --- | --- |
| Runtime | Node.js + Express 5 | Express 5 because it forwards async errors to the central handler automatically; no `express-async-handler` wrapper noise |
| Language | TypeScript (ES modules, `NodeNext`, `.js` import extensions) | Modern Node ESM; works with `tsx` for dev and `tsc` for build |
| ORM | Prisma 7 with `@prisma/adapter-better-sqlite3` | Prisma 7 ships a driver-adapter model - SQLite no longer comes bundled, the adapter does the work |
| DB | SQLite | Zero-config and file-based - ideal for a demo and dev. Swappable to Postgres by changing the adapter |
| Validation | Zod 4 | Schemas live in `src/schemas`; one `validate(schema)` middleware factory parses `body`, `params`, `query` together |
| Docs | swagger-jsdoc + swagger-ui-express | Inline JSDoc on the route file keeps endpoint docs next to the endpoint definitions |
| Tests | Vitest + supertest | Service tests hit a real SQLite test DB; route tests exercise the full middleware stack |
| Security | helmet, cors | Defaults are fine for a demo; tighten in real deployment |

## Setup

```powershell
# 1. install
npm install

# 2. set up env (already includes sane defaults)
copy .env.example .env

# 3. create the dev DB, apply migrations, generate client
npm run db:migrate

# 4. (optional) seed with six HMCTS-flavoured tasks
npm run db:seed

# 5. run
npm run dev
```

Default port is `4000`. The server prints the health check URL on startup.

## Useful URLs

| URL | What |
| --- | --- |
| `GET /health` | Liveness probe (`{ status: "ok", timestamp, uptime }`) |
| `GET /api-docs` | Swagger UI |
| `GET /api-docs.json` | Raw OpenAPI spec |
| `GET /api/v1/tasks` | List tasks |

## Endpoints

All task endpoints live under `/api/v1/tasks`. Success responses are wrapped in `{ data: ... }`; errors in `{ error: { code, message, details? } }`.

| Method | Path | Body | Success | Notes |
| --- | --- | --- | --- | --- |
| `GET` | `/api/v1/tasks` | – | `200 { data: Task[] }` | Ordered by `dueDate` asc |
| `POST` | `/api/v1/tasks` | `CreateTaskBody` | `201 { data: Task }` | `400` on validation error |
| `GET` | `/api/v1/tasks/:id` | – | `200 { data: Task }` | `404` if missing |
| `PATCH` | `/api/v1/tasks/:id` | partial `Task` | `200 { data: Task }` | Empty body → `400`; missing → `404` |
| `PATCH` | `/api/v1/tasks/:id/status` | `{ status }` | `200 { data: Task }` | Status-only update |
| `DELETE` | `/api/v1/tasks/:id` | – | `204` | `404` if missing |

`Task` shape:

```jsonc
{
  "id": "cmpo4o6xq0000f494yuhsedvv",  // cuid
  "title": "Issue directions order",
  "description": "Draft and serve directions following the case management hearing",
  "status": "IN_PROGRESS",             // TODO | IN_PROGRESS | DONE
  "dueDate": "2026-06-15T10:00:00.000Z",
  "createdAt": "2026-05-27T13:53:02.874Z",
  "updatedAt": "2026-05-27T13:53:02.874Z"
}
```

## Tests

```powershell
npm test        # one-shot
npm run test:watch
```

A separate `prisma/test.db` is created and migrated on first run (see `tests/globalSetup.ts`); the `Task` table is wiped between every test (`tests/setup.ts`). 28 tests across two files:

- `tests/tasks.service.test.ts` – service layer happy paths and `NotFoundError` cases.
- `tests/tasks.routes.test.ts` – full HTTP stack via supertest: status codes, response envelopes, validation errors, 404s for both missing resources (`NOT_FOUND`) and unknown routes (`ROUTE_NOT_FOUND`).

## Architecture

```
src/
  app.ts                Express app: middleware order, route mounting, 404, error handler
  server.ts             Boots the app on the configured port
  errors.ts             AppError / NotFoundError / ValidationError - the only error shapes
                        allowed to bubble out. Anything else becomes a 500.
  lib/
    prisma.ts           PrismaClient singleton wired to the better-sqlite3 adapter
    swagger.ts          swagger-jsdoc config; reads JSDoc from src/routes/*.ts
  middleware/
    validate.ts         validate(schema) - parses { body, params, query }; on failure
                        forwards a ValidationError
    errorHandler.ts     Central handler -> { error: { code, message, details? } }
                        plus a JSON 404 for unknown routes
  schemas/
    task.schemas.ts     Zod schemas: createTask, updateTask, updateTaskStatus, idParam
  services/
    tasks.service.ts    Domain logic. Only layer that touches Prisma. HTTP-unaware.
  controllers/
    tasks.controller.ts Thin: pulls validated input off req, calls service, shapes the
                        response. Forwards errors to next().
  routes/
    tasks.routes.ts     Wires HTTP verbs + paths to validate(schema) + controller.
                        Swagger JSDoc lives here next to the route definitions.
prisma/
  schema.prisma         Task model + TaskStatus enum
  migrations/           Generated SQL migrations
  seed.ts               Idempotent fixture loader (deleteMany + create)
prisma.config.ts        Prisma 7 datasource URL + driver adapter wiring
tests/
  globalSetup.ts        Wipes test.db and applies migrations once per run
  setup.ts              Wipes Task table before every test
  helpers.ts            createTask() factory
  tasks.service.test.ts
  tasks.routes.test.ts
```

### Why this shape

- **Layered, not folder-by-feature.** A single resource doesn't earn a feature folder. Routes → controllers → services is enough structure to keep HTTP, request shape, and domain logic from leaking into each other, and it scales fine to a handful more resources.
- **Only the service touches Prisma.** Controllers never call `prisma.*`; that keeps them trivially refactorable if we ever swap the data layer.
- **One error contract.** Throw `NotFoundError("Task", id)` from anywhere; the central handler renders it as `404 { error: { code: "NOT_FOUND", ... } }`. Controllers never `res.status(404).json(...)` themselves.
- **Validation owns the boundary.** Once `validate(schema)` runs, the controller is allowed to treat `req.body` as the typed input. Zod's `.transform` even converts ISO strings to `Date` so the service never sees strings.
- **Tests hit a real DB.** SQLite is cheap enough that mocking Prisma would be more work than it's worth, and you actually exercise the same query path production runs.

### Things I deliberately did **not** do

- No DTO layer separate from the Zod-inferred types. They're already typed.
- No repository pattern on top of Prisma. With one model and clear service boundaries, that's a layer of indirection for nothing.
- No global request logger / structured logger. `helmet`, `cors`, `express.json` are enough middleware for the scope; pino or similar would land in a real deployment.

## Scripts

| Script | What |
| --- | --- |
| `npm run dev` | `tsx watch src/server.ts` |
| `npm run build` | `prisma generate && tsc` |
| `npm start` | `node dist/server.js` (after build) |
| `npm test` | Vitest, one-shot |
| `npm run test:watch` | Vitest, watch mode |
| `npm run db:migrate` | `prisma migrate dev` |
| `npm run db:seed` | Load the six fixture tasks |
| `npm run db:reset` | Drop and rebuild the dev DB |
| `npm run db:studio` | Open Prisma Studio |
| `npm run lint` / `lint:fix` | ESLint on `src/` |

## License

MIT
