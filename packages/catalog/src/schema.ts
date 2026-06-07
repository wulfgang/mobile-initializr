import { z } from "zod";

/**
 * The catalog is the single source of truth for the whole generator, analogous to
 * Spring Initializr's `/metadata` endpoint. The web UI is rendered entirely from it,
 * and the generator validates every request against it.
 */

export const PlatformId = z.enum(["android", "ios"]);
export type PlatformId = z.infer<typeof PlatformId>;

/** A selectable metadata field (text or single-select), mirroring Spring's field types. */
export const TextField = z.object({
  type: z.literal("text"),
  label: z.string(),
  default: z.string(),
  /** Optional regex (as a string) the value must match. */
  pattern: z.string().optional(),
  platforms: z.array(PlatformId).optional(),
});

export const SingleSelectField = z.object({
  type: z.literal("single-select"),
  label: z.string(),
  default: z.string(),
  values: z.array(z.object({ id: z.string(), name: z.string() })).min(1),
  platforms: z.array(PlatformId).optional(),
});

export const MetadataField = z.discriminatedUnion("type", [TextField, SingleSelectField]);
export type MetadataField = z.infer<typeof MetadataField>;

/** Android-specific wiring for a module: the Maven coordinate to add as a Gradle dependency. */
export const AndroidModuleSpec = z.object({
  /** e.g. "com.company.mobile:network". Version is resolved from the framework version. */
  coordinate: z.string(),
});

/** iOS-specific wiring for a module: the Swift Package Manager product/package to depend on. */
export const IosModuleSpec = z.object({
  /** The SPM product name imported in Swift, e.g. "MobileNetwork". */
  product: z.string(),
  /** Internal SPM package git URL. Placeholder until the real repos are shared. */
  packageUrl: z.string(),
});

export const Module = z.object({
  id: z.string(),
  name: z.string(),
  description: z.string(),
  group: z.string(),
  platforms: z.array(PlatformId).min(1),
  /** Other module ids this one requires. */
  requires: z.array(z.string()).default([]),
  android: AndroidModuleSpec.optional(),
  ios: IosModuleSpec.optional(),
});
export type Module = z.infer<typeof Module>;

export const FrameworkVersion = z.object({
  id: z.string(),
  name: z.string(),
  default: z.boolean().default(false),
});

export const Catalog = z.object({
  schemaVersion: z.literal(1),
  frameworkVersions: z.array(FrameworkVersion).min(1),
  platforms: z.array(PlatformId).min(1),
  /** Keyed metadata fields, e.g. appName, packageName, bundleId, minSdk, minIos. */
  metadata: z.record(z.string(), MetadataField),
  modules: z.array(Module),
});
export type Catalog = z.infer<typeof Catalog>;

/**
 * A generation request coming from the wizard. Validated against the catalog before
 * the generator runs.
 */
export const GenerateRequest = z.object({
  platforms: z.array(PlatformId).min(1),
  frameworkVersion: z.string(),
  appName: z.string().min(1),
  /** Android application id, e.g. com.company.myapp */
  packageName: z.string().min(1),
  /** iOS bundle identifier, e.g. com.company.myapp */
  bundleId: z.string().optional(),
  minSdk: z.string().optional(),
  minIos: z.string().optional(),
  /** Selected module ids. */
  modules: z.array(z.string()).default([]),
  /** Optional GitHub push target; when present the generator creates and pushes a repo. */
  github: z
    .object({
      org: z.string(),
      repo: z.string(),
      private: z.boolean().default(true),
    })
    .optional(),
});
export type GenerateRequest = z.infer<typeof GenerateRequest>;
