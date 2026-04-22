"use client";

import type { TraversalResult } from "@/types/traversal";

interface MetricsPanelProps {
  result: TraversalResult | null;
}

export function MetricsPanel({ result }: MetricsPanelProps) {
  const metrics = result?.metrics;
  const lca = result?.lca;

  return (
    <section className="rounded-[var(--radius-panel)] border-[3px] border-[var(--color-beige)] bg-[var(--color-navy)]/95 shadow-[10px_10px_0_#121212]">
      <div className="px-6 py-5 sm:px-8">
        <div className="flex flex-col gap-3 border-b-[3px] border-[var(--color-beige)] pb-5 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <div className="text-[11px] font-black uppercase tracking-[0.34em] text-[var(--color-burgundy)]">
              Metrics
            </div>
            <h2 className="mt-2 text-2xl font-black uppercase tracking-tight text-[var(--color-white)]">
              Timing, depth, and visited nodes
            </h2>
            <p className="mt-2 max-w-2xl text-sm leading-6 text-[var(--color-gray)]">
              Compact metric blocks for quick scanning.
            </p>
          </div>
          {metrics ? (
            <div className="rounded-full border-[2px] border-[var(--color-beige)] bg-[var(--color-light-blue)] px-4 py-2 text-sm font-black uppercase tracking-[0.12em] text-[var(--color-black)]">
              {metrics.algorithm.toUpperCase()} · {metrics.selector}
            </div>
          ) : null}
        </div>

        {metrics ? (
          <div className="mt-5 grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
            <MetricCard label="Elapsed" value={`${metrics.elapsedMs} ms`} />
            <MetricCard label="Visited" value={`${metrics.nodesVisited}`} />
            <MetricCard label="Matches" value={`${metrics.matchesFound}`} />
            <MetricCard label="Max depth" value={`${metrics.maxDepth}`} />
          </div>
        ) : (
          <div className="mt-5 border-[2px] border-dashed border-[var(--color-beige)] bg-[var(--color-black)] p-5 text-sm text-[var(--color-gray)]">
            Run analysis to see metrics.
          </div>
        )}

        {result?.stopReason ? (
          <div className="mt-4 border-[2px] border-[var(--color-camel)] bg-[var(--color-camel)] px-4 py-3 text-sm font-black text-[var(--color-black)]">
            {result.stopReason}
          </div>
        ) : null}

        {metrics ? (
          <div className="mt-4 border-[2px] border-[var(--color-beige)] bg-[var(--color-black)] p-4 text-sm text-[var(--color-gray)]">
            <div className="text-[11px] font-black uppercase tracking-[0.28em] text-[var(--color-light-blue)]">
              LCA
            </div>
            {lca?.available ? (
              <div className="mt-2 space-y-2">
                <div className="text-sm font-black uppercase text-[var(--color-white)]">
                  {lca.label} ({lca.nodeId})
                </div>
                <div className="flex flex-wrap gap-2 text-[11px] font-black uppercase tracking-[0.2em]">
                  <span className="rounded-full border-[2px] border-[var(--color-beige)] bg-[var(--color-eggplant)]/45 px-2.5 py-1 text-[var(--color-gray)]">
                    depth {lca.depth}
                  </span>
                  <span className="rounded-full border-[2px] border-[var(--color-beige)] bg-[var(--color-eggplant)]/45 px-2.5 py-1 text-[var(--color-gray)]">
                    matches {lca.matchCount}
                  </span>
                </div>
                <p>{lca.reason}</p>
              </div>
            ) : (
              <p className="mt-2">{lca?.reason ?? "Need at least 2 matches to show LCA."}</p>
            )}
          </div>
        ) : null}
      </div>
    </section>
  );
}

function MetricCard({ label, value }: { label: string; value: string }) {
  return (
    <div className="border-[2px] border-[var(--color-beige)] bg-[var(--color-black)] p-4 shadow-[6px_6px_0_#c19a6b]">
      <div className="text-[11px] uppercase tracking-[0.28em] text-[var(--color-light-blue)]">{label}</div>
      <div className="mt-3 text-2xl font-black tracking-tight text-[var(--color-white)]">{value}</div>
    </div>
  );
}