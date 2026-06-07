import { test } from "node:test";
import assert from "node:assert/strict";
import { companyCatalog } from "@initializr/catalog";
import { generateProject } from "../dist/index.js";

test("generates an Android-only project with selected modules", async () => {
  const { files } = await generateProject(companyCatalog, {
    platforms: ["android"],
    frameworkVersion: "2.4.0",
    appName: "Acme",
    packageName: "com.acme.app",
    minSdk: "26",
    modules: ["session"], // pulls in network + storage via requires
  });

  // Single platform -> emitted at archive root (no android/ prefix).
  assert.ok(files.has("settings.gradle.kts"));
  assert.ok(files.has("app/build.gradle.kts"));

  // Package-path token expanded.
  assert.ok(files.has("app/src/main/java/com/acme/app/MainActivity.kt"));

  // Transitive modules resolved and injected as dependencies.
  const appBuild = files.get("app/build.gradle.kts")!;
  for (const dep of ["company.network", "company.storage", "company.session"]) {
    assert.ok(appBuild.includes(`libs.${dep}`), `expected dependency libs.${dep}`);
  }

  // App name rendered.
  assert.ok(files.get("settings.gradle.kts")!.includes('rootProject.name = "Acme"'));
});

test("emits both platforms under separate folders", async () => {
  const { files } = await generateProject(companyCatalog, {
    platforms: ["android", "ios"],
    frameworkVersion: "2.4.0",
    appName: "Acme",
    packageName: "com.acme.app",
    bundleId: "com.acme.app",
    modules: ["network"],
  });
  assert.ok(files.has("android/settings.gradle.kts"));
  assert.ok(files.has("ios/project.yml"));
});

test("rejects iOS without a bundle id", async () => {
  await assert.rejects(() =>
    generateProject(companyCatalog, {
      platforms: ["ios"],
      frameworkVersion: "2.4.0",
      appName: "Acme",
      packageName: "com.acme.app",
      modules: [],
    }),
  );
});
