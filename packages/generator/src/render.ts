import { promises as fs } from "node:fs";
import { join, relative, sep } from "node:path";
import ejs from "ejs";
import { PACKAGE_PATH_TOKEN, TEMPLATE_SUFFIX } from "@initializr/templates";

/** A generated file: POSIX-style relative path -> contents. */
export type FileMap = Map<string, string>;

async function walk(dir: string): Promise<string[]> {
  const entries = await fs.readdir(dir, { withFileTypes: true });
  const files: string[] = [];
  for (const entry of entries) {
    const full = join(dir, entry.name);
    if (entry.isDirectory()) {
      files.push(...(await walk(full)));
    } else {
      files.push(full);
    }
  }
  return files;
}

function toPosix(p: string): string {
  return p.split(sep).join("/");
}

/**
 * Render a template directory into a FileMap.
 *
 * - Files ending in `.ejs` are rendered with the given context; the suffix is stripped.
 * - The `__packagePath__` path segment is replaced with `packagePath` (e.g. com/company/app).
 * - Everything else is copied verbatim.
 *
 * @param prefix optional top-level folder to nest all files under (used when emitting
 *   multiple platforms into one archive, e.g. "android/").
 */
export async function renderTemplateDir(
  templateRoot: string,
  context: Record<string, unknown>,
  packagePath: string,
  prefix = "",
): Promise<FileMap> {
  const files = await walk(templateRoot);
  const out: FileMap = new Map();

  for (const absPath of files) {
    let rel = toPosix(relative(templateRoot, absPath));
    rel = rel.split("/").map((seg) => (seg === PACKAGE_PATH_TOKEN ? packagePath : seg)).join("/");

    const raw = await fs.readFile(absPath, "utf8");
    let contents: string;
    if (rel.endsWith(TEMPLATE_SUFFIX)) {
      rel = rel.slice(0, -TEMPLATE_SUFFIX.length);
      contents = ejs.render(raw, context, { filename: absPath });
    } else {
      contents = raw;
    }

    const finalPath = prefix ? `${prefix.replace(/\/$/, "")}/${rel}` : rel;
    out.set(finalPath, contents);
  }

  return out;
}
