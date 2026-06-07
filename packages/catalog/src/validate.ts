import { Catalog, GenerateRequest, type PlatformId } from "./schema.js";

export interface ResolvedRequest extends GenerateRequest {
  /** Module ids after expanding `requires` dependencies, de-duplicated and order-preserved. */
  resolvedModules: string[];
}

export class ValidationError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "ValidationError";
  }
}

/**
 * Validate a raw request against the catalog and resolve transitive module requirements.
 * Throws ValidationError with a human-readable message on any problem.
 */
export function resolveRequest(catalogInput: unknown, requestInput: unknown): ResolvedRequest {
  const catalog = Catalog.parse(catalogInput);
  const parsed = GenerateRequest.safeParse(requestInput);
  if (!parsed.success) {
    throw new ValidationError(parsed.error.issues.map((i) => `${i.path.join(".")}: ${i.message}`).join("; "));
  }
  const req = parsed.data;

  for (const p of req.platforms) {
    if (!catalog.platforms.includes(p)) throw new ValidationError(`Unsupported platform: ${p}`);
  }

  if (!catalog.frameworkVersions.some((v) => v.id === req.frameworkVersion)) {
    throw new ValidationError(`Unknown framework version: ${req.frameworkVersion}`);
  }

  if (req.platforms.includes("ios") && !req.bundleId) {
    throw new ValidationError("bundleId is required when iOS is selected");
  }

  const byId = new Map(catalog.modules.map((m) => [m.id, m]));
  const resolved: string[] = [];
  const visit = (id: string, trail: string[]): void => {
    const mod = byId.get(id);
    if (!mod) throw new ValidationError(`Unknown module: ${id}`);
    const supportsAny = mod.platforms.some((p: PlatformId) => req.platforms.includes(p));
    if (!supportsAny) {
      throw new ValidationError(`Module "${id}" does not support the selected platform(s)`);
    }
    if (trail.includes(id)) return; // cycle guard
    for (const dep of mod.requires) visit(dep, [...trail, id]);
    if (!resolved.includes(id)) resolved.push(id);
  };
  for (const id of req.modules) visit(id, []);

  return { ...req, resolvedModules: resolved };
}
