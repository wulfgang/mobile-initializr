import { fileURLToPath } from "node:url";
import { dirname, resolve } from "node:path";

const here = dirname(fileURLToPath(import.meta.url));

/** Absolute path to the on-disk template tree for a platform. */
export function templateDir(platform: "android" | "ios"): string {
  // dist/index.js -> package root -> <platform>
  return resolve(here, "..", platform);
}

/**
 * A folder name used in template trees that should be replaced by the project's package path
 * (e.g. com/company/myapp). Lets us template Java/Kotlin source directory layout.
 */
export const PACKAGE_PATH_TOKEN = "__packagePath__";

/** Suffix marking a file whose contents should be rendered as an EJS template. */
export const TEMPLATE_SUFFIX = ".ejs";
