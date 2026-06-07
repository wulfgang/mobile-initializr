import type { Catalog } from "./schema.js";

/**
 * The company catalog. Values marked PLACEHOLDER must be replaced with the real internal
 * Maven coordinates / SPM package URLs once those are shared.
 *
 * Adding a new selectable module is just one entry here plus its template files in
 * `@initializr/templates` — no UI or generator changes required.
 */
export const companyCatalog: Catalog = {
  schemaVersion: 1,
  frameworkVersions: [
    { id: "2.4.0", name: "2.4.0 (latest)", default: true },
    { id: "2.3.1", name: "2.3.1", default: false },
  ],
  platforms: ["android", "ios"],
  metadata: {
    appName: { type: "text", label: "App name", default: "MyApp", pattern: "^[A-Za-z][A-Za-z0-9 ]*$" },
    packageName: {
      type: "text",
      label: "Package name (Android)",
      default: "com.company.myapp",
      pattern: "^[a-z][a-z0-9_]*(\\.[a-z][a-z0-9_]*)+$",
      platforms: ["android"],
    },
    bundleId: {
      type: "text",
      label: "Bundle identifier (iOS)",
      default: "com.company.myapp",
      pattern: "^[A-Za-z][A-Za-z0-9-]*(\\.[A-Za-z][A-Za-z0-9-]*)+$",
      platforms: ["ios"],
    },
    minSdk: {
      type: "single-select",
      label: "Minimum Android SDK",
      default: "26",
      platforms: ["android"],
      values: [
        { id: "24", name: "API 24 (Android 7.0)" },
        { id: "26", name: "API 26 (Android 8.0)" },
        { id: "31", name: "API 31 (Android 12)" },
      ],
    },
    minIos: {
      type: "single-select",
      label: "Minimum iOS",
      default: "16",
      platforms: ["ios"],
      values: [
        { id: "15", name: "iOS 15" },
        { id: "16", name: "iOS 16" },
        { id: "17", name: "iOS 17" },
      ],
    },
  },
  modules: [
    {
      id: "network",
      name: "Networking",
      description: "Company HTTP client with standard interceptors, retry, and TLS policy.",
      group: "Core",
      platforms: ["android", "ios"],
      requires: [],
      android: { coordinate: "com.company.mobile:network" },
      ios: { product: "MobileNetwork", packageUrl: "https://github.example.com/mobile/network-ios.git" },
    },
    {
      id: "storage",
      name: "Content & Storage",
      description: "Secure local storage, content cache, and persistence helpers.",
      group: "Core",
      platforms: ["android", "ios"],
      requires: [],
      android: { coordinate: "com.company.mobile:storage" },
      ios: { product: "MobileStorage", packageUrl: "https://github.example.com/mobile/storage-ios.git" },
    },
    {
      id: "session",
      name: "Session & Auth",
      description: "Session management, token refresh, and the company auth flow.",
      group: "Core",
      platforms: ["android", "ios"],
      requires: ["network", "storage"],
      android: { coordinate: "com.company.mobile:session" },
      ios: { product: "MobileSession", packageUrl: "https://github.example.com/mobile/session-ios.git" },
    },
    {
      id: "analytics",
      name: "Analytics",
      description: "Standardized analytics events and the company telemetry pipeline.",
      group: "Observability",
      platforms: ["android", "ios"],
      requires: [],
      android: { coordinate: "com.company.mobile:analytics" },
      ios: { product: "MobileAnalytics", packageUrl: "https://github.example.com/mobile/analytics-ios.git" },
    },
    {
      id: "logging",
      name: "Logging",
      description: "Structured logging wired to the company log backend.",
      group: "Observability",
      platforms: ["android", "ios"],
      requires: [],
      android: { coordinate: "com.company.mobile:logging" },
      ios: { product: "MobileLogging", packageUrl: "https://github.example.com/mobile/logging-ios.git" },
    },
    {
      id: "push",
      name: "Push Notifications",
      description: "Push registration and handling integrated with the company push service.",
      group: "Engagement",
      platforms: ["android", "ios"],
      requires: ["session"],
      android: { coordinate: "com.company.mobile:push" },
      ios: { product: "MobilePush", packageUrl: "https://github.example.com/mobile/push-ios.git" },
    },
  ],
};
