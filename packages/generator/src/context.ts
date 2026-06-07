import type { Catalog, PlatformId, ResolvedRequest } from "@initializr/catalog";

/** A module prepared for Android template rendering. */
export interface AndroidModuleContext {
  id: string;
  name: string;
  group: string;
  artifact: string;
  /** Version-catalog TOML key, e.g. "company-network". */
  aliasRef: string;
  /** Kotlin DSL accessor for the alias, e.g. "libs.company.network". */
  accessor: string;
}

/** A module prepared for iOS template rendering. */
export interface IosModuleContext {
  id: string;
  name: string;
  product: string;
  packageUrl: string;
}

export interface AndroidContext {
  appName: string;
  packageName: string;
  packagePath: string;
  minSdk: string;
  frameworkVersion: string;
  modules: AndroidModuleContext[];
}

export interface IosContext {
  appName: string;
  bundleId: string;
  minIos: string;
  frameworkVersion: string;
  modules: IosModuleContext[];
}

function splitCoordinate(coordinate: string): { group: string; artifact: string } {
  const [group, artifact] = coordinate.split(":");
  if (!group || !artifact) {
    throw new Error(`Invalid Maven coordinate (expected group:artifact): ${coordinate}`);
  }
  return { group, artifact };
}

export function buildAndroidContext(catalog: Catalog, req: ResolvedRequest): AndroidContext {
  const byId = new Map(catalog.modules.map((m) => [m.id, m]));
  const modules: AndroidModuleContext[] = [];
  for (const id of req.resolvedModules) {
    const mod = byId.get(id);
    if (!mod?.android) continue; // module not available on Android — skip silently
    const { group, artifact } = splitCoordinate(mod.android.coordinate);
    modules.push({
      id,
      name: mod.name,
      group,
      artifact,
      aliasRef: `company-${id}`,
      accessor: `libs.company.${id}`,
    });
  }
  return {
    appName: req.appName,
    packageName: req.packageName,
    packagePath: req.packageName.replace(/\./g, "/"),
    minSdk: req.minSdk ?? "26",
    frameworkVersion: req.frameworkVersion,
    modules,
  };
}

export function buildIosContext(catalog: Catalog, req: ResolvedRequest): IosContext {
  const byId = new Map(catalog.modules.map((m) => [m.id, m]));
  const modules: IosModuleContext[] = [];
  for (const id of req.resolvedModules) {
    const mod = byId.get(id);
    if (!mod?.ios) continue;
    modules.push({ id, name: mod.name, product: mod.ios.product, packageUrl: mod.ios.packageUrl });
  }
  return {
    appName: req.appName,
    bundleId: req.bundleId ?? req.packageName,
    minIos: req.minIos ?? "16",
    frameworkVersion: req.frameworkVersion,
    modules,
  };
}

export function isPlatformSelected(req: ResolvedRequest, p: PlatformId): boolean {
  return req.platforms.includes(p);
}
