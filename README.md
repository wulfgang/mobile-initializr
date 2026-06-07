# Mobile Initializr

An internal [start.spring.io](https://start.spring.io/) for **native mobile apps**. Developers
pick app metadata, platform(s), and prebuilt company modules, then download a ready-to-build
app skeleton (and, soon, push it straight to an internal GitHub repo).

See [`PLAN.md`](./PLAN.md) for the full design and roadmap.

## Status

- ✅ **Phase 0** — monorepo + catalog schema
- ✅ **Phase 1** — Android (Kotlin/Compose) generator + ZIP + web wizard
- ✅ **Phase 2 (initial)** — iOS (SwiftUI + SPM via XcodeGen) generator
- ⏳ **Phase 3** — GitHub (Enterprise) repo create + push
- ⏳ **Phase 4** — share links, file preview, CLI

## Layout

```
apps/web            Next.js wizard UI + /api/catalog + /api/generate
packages/catalog    Single source of truth: catalog schema (Zod) + company catalog
packages/templates  Android + iOS template trees (EJS)
packages/generator  Engine: validate request, render templates, build ZIP
```

The **catalog** drives everything (like Spring's `/metadata`). Adding a module = one catalog
entry in `packages/catalog/src/data.ts` + its template files — no UI or engine changes.

## Develop

```bash
pnpm install
pnpm build          # build catalog/templates/generator (web consumes their dist)
pnpm dev            # start the wizard at http://localhost:3000
pnpm test           # generator unit tests
pnpm typecheck      # all packages
```

## Try the generator without the UI

```bash
curl -X POST http://localhost:3000/api/generate \
  -H 'Content-Type: application/json' \
  -d '{"platforms":["android","ios"],"frameworkVersion":"2.4.0","appName":"Acme",
       "packageName":"com.acme.app","bundleId":"com.acme.app","modules":["session","push"]}' \
  -o acme.zip
```

## Before production use — replace placeholders

- Internal Maven repo URL + credentials in the Android `settings.gradle.kts` template.
- Real module Maven coordinates and SPM package URLs in `packages/catalog/src/data.ts`.
- GitHub Enterprise base URL / org / auth (Phase 3).
