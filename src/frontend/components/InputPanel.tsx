"use client";

import type { HtmlTraversalInput } from "@/types/traversal";

interface InputPanelProps {
  input: HtmlTraversalInput;
  isLoading: boolean;
  error: string | null;
  onChange: (patch: Partial<HtmlTraversalInput>) => void;
  onAnalyze: () => void;
  onLoadSample: () => void;
}

export function InputPanel({
  input,
  isLoading,
  error,
  onChange,
  onAnalyze,
  onLoadSample,
}: InputPanelProps) {
  return (
    <section className="relative overflow-hidden rounded-[1.4rem] border-[3px] border-[var(--color-beige)] bg-[var(--color-navy)]/95 shadow-[10px_10px_0_#121212]">
      <div className="relative border-b border-[var(--color-beige)]/30 px-6 py-5 sm:px-8">
        <div className="flex flex-col gap-5 lg:flex-row lg:items-start lg:justify-between">
          <div className="space-y-3">
            <div className="inline-flex items-center gap-2 rounded-full border border-[var(--color-beige)]/40 bg-[var(--color-black)]/40 px-4 py-2 text-[11px] font-semibold uppercase tracking-[0.34em] text-[var(--color-light-blue)]">
              control deck
            </div>
            <div>
              <h2 className="text-2xl font-semibold tracking-tight text-[var(--color-white)] sm:text-3xl">
                Shape the traversal from this panel.
              </h2>
              <p className="mt-2 max-w-3xl text-sm leading-6 text-[var(--color-gray)] sm:text-base">
                Select the source, set the selector, and decide how many matches
                should stay on stage.
              </p>
            </div>
          </div>
        </div>
      </div>

      <div className="relative grid gap-5 px-6 py-6 sm:px-8 lg:grid-cols-[0.9fr_1.1fr] lg:gap-6">
        <div className="space-y-5">
          <div className="rounded-[1rem] border-[2px] border-[var(--color-beige)] bg-[var(--color-black)] p-4">
            <div className="text-[11px] uppercase tracking-[0.28em] text-[var(--color-light-blue)]">
              Source type
            </div>
            <div className="mt-3 grid grid-cols-2 gap-2 rounded-[1rem] border-[2px] border-[var(--color-beige)] bg-[var(--color-eggplant)]/35 p-2">
              {(["html", "url"] as const).map((kind) => (
                <button
                  key={kind}
                  type="button"
                  onClick={() => onChange({ sourceType: kind })}
                  className={`rounded-[1.1rem] px-4 py-3 text-sm font-medium transition ${
                    input.sourceType === kind
                      ? "bg-[var(--color-beige)] text-[var(--color-black)]"
                      : "text-[var(--color-gray)] hover:bg-[var(--color-white)]/10"
                  }`}
                >
                  {kind === "html" ? "HTML text" : "Website URL"}
                </button>
              ))}
            </div>
          </div>

          <div className="rounded-[1rem] border-[2px] border-[var(--color-beige)] bg-[var(--color-black)] p-4">
            <div className="text-[11px] uppercase tracking-[0.28em] text-[var(--color-burgundy)]">
              Traversal algorithm
            </div>
            <div className="mt-3 grid grid-cols-2 gap-2 rounded-[1rem] border-[2px] border-[var(--color-beige)] bg-[var(--color-eggplant)]/35 p-2">
              {(["bfs", "dfs"] as const).map((algorithm) => (
                <button
                  key={algorithm}
                  type="button"
                  onClick={() => onChange({ algorithm })}
                  className={`rounded-[1.1rem] px-4 py-3 text-sm font-medium transition ${
                    input.algorithm === algorithm
                      ? "bg-[var(--color-light-blue)] text-[var(--color-black)]"
                      : "text-[var(--color-gray)] hover:bg-[var(--color-white)]/10"
                  }`}
                >
                  {algorithm.toUpperCase()}
                </button>
              ))}
            </div>
          </div>

          <label className="block space-y-2 rounded-[1rem] border-[2px] border-[var(--color-beige)] bg-[var(--color-black)] p-4">
            <span className="text-[11px] uppercase tracking-[0.28em] text-[var(--color-burgundy)]">
              CSS selector
            </span>
            <input
              value={input.selector}
              onChange={(event) => onChange({ selector: event.target.value })}
              placeholder="main .card"
              className="w-full rounded-[0.9rem] border-[2px] border-[var(--color-beige)] bg-[var(--color-navy)]/45 px-4 py-3 text-sm font-semibold text-[var(--color-white)] outline-none transition placeholder:text-[var(--color-gray)] focus:bg-[var(--color-black)]"
            />
          </label>

          <label className="block space-y-2 rounded-[1rem] border-[2px] border-[var(--color-beige)] bg-[var(--color-black)] p-4">
            <span className="text-[11px] uppercase tracking-[0.28em] text-[var(--color-camel)]">
              Result scope
            </span>
            <select
              value={input.resultScope}
              onChange={(event) => onChange({ resultScope: event.target.value as HtmlTraversalInput["resultScope"] })}
              className="w-full rounded-[0.9rem] border-[2px] border-[var(--color-beige)] bg-[var(--color-navy)]/45 px-4 py-3 text-sm font-semibold text-[var(--color-white)] outline-none transition focus:bg-[var(--color-black)]"
            >
              <option value="top">Top n occurrences</option>
              <option value="all">All occurrences</option>
            </select>
          </label>

          <label className="block space-y-2 rounded-[1rem] border-[2px] border-[var(--color-beige)] bg-[var(--color-black)] p-4">
            <span className="text-[11px] uppercase tracking-[0.28em] text-[var(--color-sage)]">
              Limit
            </span>
            <input
              type="number"
              min={1}
              value={input.limit}
              onChange={(event) => onChange({ limit: Number(event.target.value) || 1 })}
              className="w-full rounded-[0.9rem] border-[2px] border-[var(--color-beige)] bg-[var(--color-navy)]/45 px-4 py-3 text-sm font-semibold text-[var(--color-white)] outline-none transition placeholder:text-[var(--color-gray)] focus:bg-[var(--color-black)]"
            />
          </label>
        </div>

        <div className="space-y-5">
          <label className="block space-y-2 rounded-[1rem] border-[2px] border-[var(--color-beige)] bg-[var(--color-black)] p-4">
            <span className="text-[11px] uppercase tracking-[0.28em] text-[var(--color-burgundy)]">
              {input.sourceType === "url" ? "Website URL" : "HTML input"}
            </span>
            {input.sourceType === "url" ? (
              <input
                value={input.source}
                onChange={(event) => onChange({ source: event.target.value })}
                placeholder="https://example.com"
                className="w-full rounded-[0.9rem] border-[2px] border-[var(--color-beige)] bg-[var(--color-navy)]/45 px-4 py-3 text-sm font-semibold text-[var(--color-white)] outline-none transition placeholder:text-[var(--color-gray)] focus:bg-[var(--color-black)]"
              />
            ) : (
              <textarea
                rows={14}
                value={input.source}
                onChange={(event) => onChange({ source: event.target.value })}
                className="min-h-[20rem] w-full rounded-[1rem] border-[2px] border-[var(--color-beige)] bg-[var(--color-navy)]/45 px-4 py-3 text-sm leading-6 text-[var(--color-white)] outline-none transition placeholder:text-[var(--color-gray)] focus:bg-[var(--color-black)]"
                placeholder="<main><section class='card'>...</section></main>"
              />
            )}
          </label>

          {error ? (
            <div className="rounded-[1rem] border-[2px] border-[var(--color-burgundy)] bg-[var(--color-burgundy)] px-4 py-3 text-sm font-semibold text-[var(--color-white)]">
              {error}
            </div>
          ) : null}
        </div>
      </div>

      <div className="border-t-[3px] border-[var(--color-beige)] px-6 py-5 sm:px-8">
        <div className="flex flex-col gap-3 sm:flex-row sm:justify-end">
          <button
            type="button"
            onClick={onLoadSample}
            className="rounded-[1rem] border-[2px] border-[var(--color-beige)] bg-[var(--color-black)] px-5 py-3 text-sm font-black uppercase tracking-[0.18em] text-[var(--color-white)] transition hover:-translate-y-0.5 hover:bg-[var(--color-camel)] hover:text-[var(--color-black)]"
          >
            Load sample
          </button>
          <button
            type="button"
            onClick={onAnalyze}
            disabled={isLoading}
            className="rounded-[1rem] border-[2px] border-[var(--color-beige)] bg-[var(--color-light-blue)] px-6 py-3 text-sm font-black uppercase tracking-[0.18em] text-[var(--color-black)] transition hover:-translate-y-0.5 hover:bg-[var(--color-sage)] disabled:cursor-not-allowed disabled:opacity-60"
          >
            {isLoading ? "Tracing..." : "Analyze"}
          </button>
        </div>
      </div>
    </section>
  );
}