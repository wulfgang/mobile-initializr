import JSZip from "jszip";
import { resolveRequest, type Catalog } from "@initializr/catalog";
import { templateDir } from "@initializr/templates";
import { buildAndroidContext, buildIosContext, isPlatformSelected } from "./context.js";
import { renderTemplateDir, type FileMap } from "./render.js";

export * from "./context.js";
export type { FileMap } from "./render.js";

export interface GenerateResult {
  files: FileMap;
  /** Suggested archive base name, e.g. "myapp". */
  baseName: string;
}

/**
 * Validate a request against the catalog and render all selected platforms into a single
 * FileMap. When more than one platform is selected each is nested under its own folder
 * (android/, ios/); a single platform is emitted at the archive root.
 */
export async function generateProject(catalog: Catalog, requestInput: unknown): Promise<GenerateResult> {
  const req = resolveRequest(catalog, requestInput);
  const multi = req.platforms.length > 1;
  const files: FileMap = new Map();

  if (isPlatformSelected(req, "android")) {
    const ctx = buildAndroidContext(catalog, req);
    const rendered = await renderTemplateDir(
      templateDir("android"),
      ctx as unknown as Record<string, unknown>,
      ctx.packagePath,
      multi ? "android" : "",
    );
    mergeInto(files, rendered);
  }

  if (isPlatformSelected(req, "ios")) {
    const ctx = buildIosContext(catalog, req);
    const rendered = await renderTemplateDir(
      templateDir("ios"),
      ctx as unknown as Record<string, unknown>,
      "", // iOS template currently has no package-path folders
      multi ? "ios" : "",
    );
    mergeInto(files, rendered);
  }

  return { files, baseName: slug(req.appName) };
}

/** Render a request straight to a ZIP buffer. */
export async function generateZip(catalog: Catalog, requestInput: unknown): Promise<{ buffer: Buffer; baseName: string }> {
  const { files, baseName } = await generateProject(catalog, requestInput);
  const zip = new JSZip();
  for (const [path, contents] of files) zip.file(path, contents);
  const buffer = await zip.generateAsync({ type: "nodebuffer", compression: "DEFLATE" });
  return { buffer, baseName };
}

function mergeInto(target: FileMap, source: FileMap): void {
  for (const [k, v] of source) target.set(k, v);
}

function slug(name: string): string {
  return name.trim().toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-+|-+$/g, "") || "app";
}
