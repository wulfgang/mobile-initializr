# Mobile Initializr — Project Plan

An internal web app, modeled on [start.spring.io](https://start.spring.io/), that generates
ready-to-build **native mobile app skeletons** wired to our company's mobile framework,
coding standards, and prebuilt modules.

Developers pick metadata + platform(s) + modules → click **Generate** → get a downloadable
ZIP and/or a freshly pushed GitHub (Enterprise) repo.

---

## 1. Confirmed decisions

| Topic | Decision |
|---|---|
| Mode | Plan first, then build |
| Framework | Already exists — generated apps depend on real modules |
| Platforms | Native **Android (Kotlin + Jetpack Compose)** + native **iOS (SwiftUI)** |
| Generator stack | All-JS: **Node backend + Next.js/React frontend** |
| Output | **ZIP** download **+** option to create/push to an internal **GitHub (Enterprise)** repo |
| Android module distribution | **Internal Maven** repo (Artifactory/Nexus), Gradle dependencies |
| iOS module distribution | TBD → defaulting to **Swift Package Manager**, made configurable |
| v1 selectable modules | Networking, Content/Storage, Session/Auth, Analytics, Logging, Push notifications |
| Framework/template repos | To be shared later → design against clearly-marked placeholders |

---

## 2. The Spring Initializr → Mobile Initializr mapping

| Spring Initializr | Mobile Initializr |
|---|---|
| Project metadata (group, artifact, name) | App name, package (Android), bundle ID (iOS), org |
| Language / Java version | Kotlin & Swift versions, min SDK / min iOS |
| Spring Boot version | Company framework version |
| "Dependencies" picker | Prebuilt module picker (Networking, Storage, …) |
| Packaging (Jar/War) | Build system (Gradle KTS / SwiftPM-based Xcode) |
| `GET /metadata` JSON | `GET /api/catalog` JSON (drives the whole UI) |
| Generate → `starter.zip` | Generate → `app.zip` (or push to GitHub) |

The **catalog** is the heart of the system, exactly like Spring's metadata endpoint: a single
source of truth describing every field, platform, and module (including its Maven coordinates /
SPM package, version range, and the code/config it injects).

---

## 3. Architecture

Monorepo (npm/pnpm workspaces), TypeScript throughout.

```
mobile-initializr/
├── apps/
│   └── web/                    # Next.js (App Router) — wizard UI + API route handlers
├── packages/
│   ├── catalog/                # Catalog schema + the company catalog (modules, versions)
│   ├── generator/              # Core engine: render templates, inject deps, build ZIP, git push
│   ├── templates/              # Android + iOS template trees (EJS/Handlebars)
│   └── cli/                    # (later) `npx mobile-initializr ...` for CI/terminal use
└── PLAN.md
```

Why a separate `generator` package: the engine stays UI-independent and testable, and can be
reused by the future CLI — mirroring how Spring Initializr backs both the web UI and `curl`/CLI.

### Request flow

```
Browser (wizard)
   │  GET /api/catalog            → renders fields + modules dynamically
   │  POST /api/generate {config} → validate against catalog
   ▼
generator
   1. resolve selected modules from catalog
   2. copy + render base platform template(s)
   3. conditionally include module files
   4. inject Maven deps (Android) / SPM packages (iOS) + framework version
   5a. stream ZIP back, OR
   5b. create GitHub repo (Octokit) + initial commit/push → return repo URL
```

### Templating approach (the JS equivalent of Cookiecutter)

- **File content**: EJS/Handlebars templates (`build.gradle.kts.ejs`, `Package.swift.ejs`, …).
- **Conditional files/dirs**: a per-template `manifest.json` mapping each module → files to
  include, dependency coordinates, and snippets to inject into build files.
- **Path templating**: package/bundle directories generated from the chosen package name.

---

## 4. The catalog (single source of truth)

A typed schema (Zod-validated) served at `GET /api/catalog`. Sketch:

```jsonc
{
  "frameworkVersions": ["2.4.0", "2.3.1"],   // like Spring Boot versions
  "metadata": {
    "appName":     { "type": "text", "default": "MyApp" },
    "packageName": { "type": "text", "default": "com.company.myapp" }, // Android
    "bundleId":    { "type": "text", "default": "com.company.myapp" }, // iOS
    "minSdk":      { "type": "single-select", "default": "26", "values": ["24","26","31"] },
    "minIos":      { "type": "single-select", "default": "16", "values": ["15","16","17"] }
  },
  "platforms": ["android", "ios"],
  "modules": [
    {
      "id": "network",
      "name": "Networking",
      "description": "Company HTTP client, interceptors, and standards.",
      "platforms": ["android", "ios"],
      "android": { "coordinates": "com.company.mobile:network:${frameworkVersion}" },
      "ios":     { "package": "MobileNetwork", "url": "<INTERNAL_SPM_URL_PLACEHOLDER>" }
    }
    // storage, session, analytics, logging, push ...
  ]
}
```

Adding a future module = one catalog entry + its template files. No UI changes needed.

---

## 5. Android template (Kotlin + Compose)

- Multi-module Gradle, **Kotlin DSL** (`settings.gradle.kts`, `build.gradle.kts`).
- Version catalog (`gradle/libs.versions.toml`).
- `:app` + `:core` + conditional feature modules.
- Jetpack Compose, Navigation, Hilt (DI), coroutines — per company standards.
- `settings.gradle.kts` pre-wired with the **internal Maven repo** in
  `dependencyResolutionManagement`.
- Selected modules → dependencies injected into `app/build.gradle.kts` from catalog coordinates.
- Includes framework-mandated config: lint/detekt/ktlint, CI workflow, `.editorconfig`, README.

## 6. iOS template (SwiftUI)

- SwiftUI app. To make templating sane (hand-writing `.xcodeproj` is brittle), generate the
  project via **Tuist or XcodeGen** from a templated `Project.swift` / `project.yml`.
- Default module distribution: **Swift Package Manager** — selected modules added as package
  dependencies in the generated manifest (placeholder internal package URLs for now).
- SwiftLint/SwiftFormat config, CI workflow, README per standards.
- Distribution method kept configurable (SPM today; CocoaPods / xcframework swappable later).

## 7. GitHub (Enterprise) integration

- **Octokit** against the GitHub Enterprise API; auth via **GitHub App** (preferred for org-wide,
  least-privilege) or PAT for the MVP.
- "Create repo" flow: create repo under chosen org → push generated tree as initial commit
  (`isomorphic-git` or `simple-git`) → return the repo URL.
- ZIP-only remains the default, zero-auth path.

---

## 8. Build phases

- **Phase 0 — Scaffold**: monorepo, TS config, catalog schema + Zod, stub `/api/catalog`.
- **Phase 1 — Android MVP**: Android template + generator + ZIP; minimal Next.js wizard
  (metadata + module checkboxes). End-to-end: configure → download → `./gradlew assemble` builds.
- **Phase 2 — iOS**: iOS template (Tuist/XcodeGen + SPM) + generator support; `swift build` smoke test.
- **Phase 3 — GitHub push**: Octokit + repo create/push; auth wiring.
- **Phase 4 — Polish**: shareable config links, "explore/preview" of generated files (like
  Spring's CTRL+B), CLI package, generation smoke tests in CI.

## 9. Open items to confirm later

1. iOS module distribution (SPM vs CocoaPods vs xcframework) + the real package/repo URLs.
2. Internal Maven repo URL + auth, and the exact module coordinates/versions.
3. GitHub Enterprise base URL, target org(s), and auth model (GitHub App vs PAT).
4. Android architecture specifics (Hilt vs Koin, single- vs multi-module default).
5. Hosting/deploy target for the generator (Docker on internal infra assumed).
