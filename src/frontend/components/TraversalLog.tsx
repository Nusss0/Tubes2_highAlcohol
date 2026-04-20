"use client";

import type { TraversalResult } from "@/types/traversal";

interface TraversalLogProps {
  result: TraversalResult | null;
}

export function TraversalLog({ result }: TraversalLogProps) {
  if (!result) {
    return (
      <section className="rounded-[var(--radius-panel)] border-[3px] border-[var(--color-beige)] bg-[var(--color-navy)]/95 shadow-[10px_10px_0_#121212]">
        <div className="p-6">
          <div className="text-[11px] font-black uppercase tracking-[0.34em] text-[var(--color-camel)]">
            Traversal Log
          </div>
          <div className="mt-3 text-lg font-black text-[var(--color-white)]">
            Traversal entries will appear here.
          </div>
        </div>
      </section>
    );
  }

  return (
    <section className="rounded-[var(--radius-panel)] border-[3px] border-[var(--color-beige)] bg-[var(--color-navy)]/95 shadow-[10px_10px_0_#121212]">
      <div className="border-b-[3px] border-[var(--color-beige)] px-6 py-5 sm:px-8">
        <div className="text-[11px] font-black uppercase tracking-[0.34em] text-[var(--color-camel)]">
          Traversal Log
        </div>
        <h2 className="mt-2 text-2xl font-black uppercase tracking-tight text-[var(--color-white)]">
          Timeline of every visit
        </h2>
        <p className="mt-2 max-w-2xl text-sm leading-6 text-[var(--color-gray)]">
          Each row shows visit order, depth, match status, and frontier state after
          processing a node.
        </p>
      </div>

      <div className="mt-1 max-h-[60rem] space-y-3 overflow-auto px-4 py-5 pr-3 sm:px-5">
        {result.steps.map((step) => (
          <article
            key={`${step.order}-${step.nodeId}`}
            className="border-[2px] border-[var(--color-beige)] bg-[var(--color-black)] p-4 shadow-[6px_6px_0_#c19a6b]"
          >
            <div className="flex flex-wrap items-center gap-2">
              <span className="rounded-full border-[2px] border-[var(--color-beige)] bg-[var(--color-light-blue)] px-2.5 py-1 text-xs font-black uppercase tracking-[0.24em] text-[var(--color-black)]">
                #{step.order}
              </span>
              <span className="text-sm font-black uppercase text-[var(--color-white)]">{step.label}</span>
              <span className="rounded-full border-[2px] border-[var(--color-beige)] bg-[var(--color-eggplant)]/45 px-2.5 py-1 text-[11px] uppercase tracking-[0.22em] text-[var(--color-gray)]">
                depth {step.depth}
              </span>
              <span
                className={`rounded-full px-2.5 py-1 text-[11px] font-semibold uppercase tracking-[0.22em] ${
                  step.matched
                    ? "border-[2px] border-[var(--color-black)] bg-[var(--color-sage)] text-[var(--color-black)]"
                    : "border-[2px] border-[var(--color-beige)] bg-[var(--color-eggplant)]/45 text-[var(--color-gray)]"
                }`}
              >
                {step.matched ? "match" : "visit"}
              </span>
            </div>

            <p className="mt-3 text-sm leading-6 text-[var(--color-gray)]">{step.message}</p>

            <div className="mt-3">
              <div className="text-[11px] font-black uppercase tracking-[0.26em] text-[var(--color-light-blue)]">
                Frontier
              </div>
              <div className="mt-2 flex flex-wrap gap-2">
                {step.frontier.length > 0 ? (
                  step.frontier.map((item, index) => (
                    <span
                      key={`${step.nodeId}-${item}-${index}`}
                      className="rounded-full border-[2px] border-[var(--color-beige)] bg-[var(--color-eggplant)]/45 px-2.5 py-1 text-[11px] text-[var(--color-gray)]"
                    >
                      {item}
                    </span>
                  ))
                ) : (
                  <span className="text-sm text-[var(--color-gray)]">Empty</span>
                )}
              </div>
            </div>
          </article>
        ))}
      </div>
    </section>
  );
}