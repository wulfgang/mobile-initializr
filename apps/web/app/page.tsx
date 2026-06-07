"use client";

import { useEffect, useMemo, useState } from "react";
import type { Catalog, MetadataField, Module, PlatformId } from "@initializr/catalog";

type Values = Record<string, string>;

const PLATFORM_LABELS: Record<PlatformId, string> = {
  android: "Android (Kotlin + Compose)",
  ios: "iOS (SwiftUI)",
};

export default function Page() {
  const [catalog, setCatalog] = useState<Catalog | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [platforms, setPlatforms] = useState<PlatformId[]>(["android"]);
  const [values, setValues] = useState<Values>({});
  const [selectedModules, setSelectedModules] = useState<Set<string>>(new Set());
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    fetch("/api/catalog")
      .then((r) => r.json())
      .then((c: Catalog) => {
        setCatalog(c);
        const initial: Values = {};
        for (const [key, field] of Object.entries(c.metadata)) initial[key] = field.default;
        setValues(initial);
      })
      .catch(() => setError("Failed to load catalog"));
  }, []);

  const modulesByGroup = useMemo(() => {
    const groups = new Map<string, Module[]>();
    if (!catalog) return groups;
    for (const m of catalog.modules) {
      if (!m.platforms.some((p) => platforms.includes(p))) continue;
      const list = groups.get(m.group) ?? [];
      list.push(m);
      groups.set(m.group, list);
    }
    return groups;
  }, [catalog, platforms]);

  if (error) return <Centered>{error}</Centered>;
  if (!catalog) return <Centered>Loading…</Centered>;

  const togglePlatform = (p: PlatformId) => {
    setPlatforms((prev) => (prev.includes(p) ? prev.filter((x) => x !== p) : [...prev, p]));
  };

  const toggleModule = (id: string) => {
    setSelectedModules((prev) => {
      const next = new Set(prev);
      next.has(id) ? next.delete(id) : next.add(id);
      return next;
    });
  };

  const fieldVisible = (field: MetadataField) =>
    !field.platforms || field.platforms.some((p) => platforms.includes(p));

  const generate = async () => {
    setBusy(true);
    setError(null);
    try {
      const payload = {
        platforms,
        frameworkVersion:
          catalog.frameworkVersions.find((v) => v.default)?.id ?? catalog.frameworkVersions[0]!.id,
        appName: values.appName ?? "MyApp",
        packageName: values.packageName ?? "com.company.myapp",
        bundleId: values.bundleId,
        minSdk: values.minSdk,
        minIos: values.minIos,
        modules: [...selectedModules],
      };
      const res = await fetch("/api/generate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      if (!res.ok) {
        const j = await res.json().catch(() => ({ error: "Generation failed" }));
        throw new Error(j.error ?? "Generation failed");
      }
      const blob = await res.blob();
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `${payload.appName.toLowerCase().replace(/[^a-z0-9]+/g, "-")}.zip`;
      a.click();
      URL.revokeObjectURL(url);
    } catch (e) {
      // A TypeError from fetch() means the request never reached the server
      // (e.g. the dev server isn't running). Make that actionable.
      if (e instanceof TypeError) {
        setError("Could not reach the server. Is it running? Start it with `pnpm dev`, then retry.");
      } else {
        setError(e instanceof Error ? e.message : "Generation failed");
      }
    } finally {
      setBusy(false);
    }
  };

  return (
    <main className="mx-auto max-w-5xl px-6 py-10">
      <header className="mb-8">
        <h1 className="text-3xl font-bold tracking-tight">Mobile Initializr</h1>
        <p className="mt-1 text-slate-600">
          Generate a company mobile app skeleton — pick your platforms and modules, then download.
        </p>
      </header>

      <div className="grid gap-6 md:grid-cols-2">
        <Card title="Platforms">
          <div className="flex flex-col gap-2">
            {catalog.platforms.map((p) => (
              <label key={p} className="flex items-center gap-2">
                <input type="checkbox" checked={platforms.includes(p)} onChange={() => togglePlatform(p)} />
                <span>{PLATFORM_LABELS[p]}</span>
              </label>
            ))}
          </div>
        </Card>

        <Card title="Project metadata">
          <div className="flex flex-col gap-3">
            {Object.entries(catalog.metadata)
              .filter(([, f]) => fieldVisible(f))
              .map(([key, field]) => (
                <Field
                  key={key}
                  field={field}
                  value={values[key] ?? field.default}
                  onChange={(v) => setValues((prev) => ({ ...prev, [key]: v }))}
                />
              ))}
          </div>
        </Card>
      </div>

      <Card title="Modules" className="mt-6">
        {[...modulesByGroup.entries()].map(([group, mods]) => (
          <div key={group} className="mb-4">
            <h3 className="mb-2 text-sm font-semibold uppercase tracking-wide text-slate-500">{group}</h3>
            <div className="grid gap-2 sm:grid-cols-2">
              {mods.map((m) => (
                <label
                  key={m.id}
                  className="flex cursor-pointer items-start gap-2 rounded-lg border border-slate-200 bg-white p-3 hover:border-slate-300"
                >
                  <input
                    type="checkbox"
                    className="mt-1"
                    checked={selectedModules.has(m.id)}
                    onChange={() => toggleModule(m.id)}
                  />
                  <span>
                    <span className="font-medium">{m.name}</span>
                    <span className="block text-sm text-slate-500">{m.description}</span>
                    {m.requires.length > 0 && (
                      <span className="mt-1 block text-xs text-slate-400">requires: {m.requires.join(", ")}</span>
                    )}
                  </span>
                </label>
              ))}
            </div>
          </div>
        ))}
      </Card>

      {error && <p className="mt-4 rounded bg-red-50 p-3 text-sm text-red-700">{error}</p>}

      <div className="mt-6 flex items-center gap-4">
        <button
          onClick={generate}
          disabled={busy || platforms.length === 0}
          className="rounded-lg bg-slate-900 px-5 py-2.5 font-medium text-white disabled:opacity-50"
        >
          {busy ? "Generating…" : "Generate"}
        </button>
        <span className="text-sm text-slate-500">
          Framework {catalog.frameworkVersions.find((v) => v.default)?.name}
        </span>
      </div>
    </main>
  );
}

function Field({
  field,
  value,
  onChange,
}: {
  field: MetadataField;
  value: string;
  onChange: (v: string) => void;
}) {
  return (
    <label className="flex flex-col gap-1">
      <span className="text-sm font-medium text-slate-700">{field.label}</span>
      {field.type === "text" ? (
        <input
          className="rounded-lg border border-slate-300 px-3 py-2"
          value={value}
          onChange={(e) => onChange(e.target.value)}
        />
      ) : (
        <select
          className="rounded-lg border border-slate-300 px-3 py-2"
          value={value}
          onChange={(e) => onChange(e.target.value)}
        >
          {field.values.map((opt) => (
            <option key={opt.id} value={opt.id}>
              {opt.name}
            </option>
          ))}
        </select>
      )}
    </label>
  );
}

function Card({
  title,
  children,
  className = "",
}: {
  title: string;
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <section className={`rounded-xl border border-slate-200 bg-white p-5 shadow-sm ${className}`}>
      <h2 className="mb-3 text-lg font-semibold">{title}</h2>
      {children}
    </section>
  );
}

function Centered({ children }: { children: React.ReactNode }) {
  return <div className="flex min-h-screen items-center justify-center text-slate-500">{children}</div>;
}
