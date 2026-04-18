"use client";

import { useEffect, useState } from "react";
import { DOMTreeViewer } from "../components/DOMTreeViewer";
import { InputPanel } from "@/components/InputPanel";
import { MetricsPanel } from "@/components/MetricsPanel";
import { TraversalLog } from "@/components/TraversalLog";
import {
  SAMPLE_HTML,
  analyzeDomTree,
  fetchDummyHtmlTemplate,
  fetchHtmlFromSource,
} from "@/lib/api";
import type { HtmlTraversalInput, TraversalResult } from "@/types/traversal";

const initialInput: HtmlTraversalInput = {
  sourceType: "html",
  source: SAMPLE_HTML,
  algorithm: "bfs",
  selector: "main .card",
  resultScope: "top",
  limit: 3,
};

function formatStatus(result: TraversalResult | null, error: string | null) {
  if (error) {
    return error;
  }

  if (!result) {
    return "Ready to run traversal.";
  }

  return `${result.metrics.algorithm.toUpperCase()} found ${result.metrics.matchesFound} nodes in ${result.metrics.elapsedMs} ms.`;
}

export default function Home() {
  const [input, setInput] = useState<HtmlTraversalInput>(initialInput);
  const [result, setResult] = useState<TraversalResult | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [status, setStatus] = useState("Preparing sample DOM.");
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    void runAnalysis(initialInput);
  }, []);

  async function runAnalysis(nextInput: HtmlTraversalInput = input) {
    setIsLoading(true);
    setError(null);
    setStatus("Reading HTML source...");

    try {
      const html =
        nextInput.sourceType === "url"
          ? await fetchHtmlFromSource(nextInput.source)
          : nextInput.source;

      const analysis = analyzeDomTree(html, nextInput);
      setResult(analysis);
      setStatus(formatStatus(analysis, null));
    } catch (analysisError) {
      const message =
        analysisError instanceof Error
          ? analysisError.message
          : "Failed to process HTML.";
      setError(message);
      setResult(null);
      setStatus(message);
    } finally {
      setIsLoading(false);
    }
  }

  function handleInputChange(patch: Partial<HtmlTraversalInput>) {
    setInput((current) => ({ ...current, ...patch }));
  }

  async function handleLoadSample() {
    setIsLoading(true);
    setError(null);
    setStatus("Loading dummy HTML template...");

    try {
      const dummyHtml = await fetchDummyHtmlTemplate();
      const sampleInput: HtmlTraversalInput = {
        ...initialInput,
        sourceType: "html",
        source: dummyHtml,
        selector: ".card, .leaf, [data-depth]",
        limit: 12,
      };

      setInput(sampleInput);
      await runAnalysis(sampleInput);
    } catch {
      const fallbackInput: HtmlTraversalInput = {
        ...initialInput,
        source: SAMPLE_HTML,
        sourceType: "html",
      };

      setInput(fallbackInput);
      await runAnalysis(fallbackInput);
    } finally {
      setIsLoading(false);
    }
  }

  async function handleSubmit() {
    await runAnalysis(input);
  }

  return (
    <main className="relative min-h-screen overflow-x-hidden px-4 py-6 text-[var(--color-white)] sm:px-6 lg:px-8">

      <div className="relative mx-auto flex w-full max-w-7xl flex-col gap-6">
        <section className="overflow-hidden rounded-[1.5rem] border-[3px] border-[var(--color-camel)] bg-[var(--color-navy)]/95 shadow-[12px_12px_0_#121212]">
          <div className="grid gap-0 lg:grid-cols-[1.3fr_0.7fr]">
            <div className="relative p-6 sm:p-8 lg:p-10">
              <div className="relative space-y-6">
                <div className="flex flex-wrap items-center gap-3">
                  <div className="inline-flex items-center gap-2 rounded-full border-[2px] border-[var(--color-light-blue)] bg-[var(--color-light-blue)] px-4 py-2 text-[11px] font-black uppercase tracking-[0.34em] text-[var(--color-black)]">
                    highAlcohol
                  </div>
                  <span className="rounded-full border-[2px] border-[var(--color-beige)] bg-[var(--color-black)] px-3 py-1 text-[11px] uppercase tracking-[0.26em] text-[var(--color-beige)]">
                    BFS · DFS · CSS selector
                  </span>
                </div>

                <div className="max-w-4xl space-y-4">
                  <h1 className="max-w-4xl text-4xl font-black uppercase leading-[0.9] tracking-[-0.06em] text-[var(--color-white)] sm:text-6xl lg:text-[5.2rem]">
                    DOM Traversal
                  </h1>
                </div>

                <div className="grid gap-3 sm:grid-cols-3">
                  <div className="rounded-[1.15rem] border-[2px] border-[var(--color-beige)] bg-[var(--color-black)] p-4 shadow-[6px_6px_0_#9fd3f6]">
                    <div className="text-[11px] uppercase tracking-[0.24em] text-[var(--color-light-blue)]">
                      Input mode
                    </div>
                    <div className="mt-2 text-base font-black text-[var(--color-white)]">
                      HTML text or URL
                    </div>
                  </div>
                  <div className="rounded-[1.15rem] border-[2px] border-[var(--color-beige)] bg-[var(--color-black)] p-4 shadow-[6px_6px_0_#6d1f36]">
                    <div className="text-[11px] uppercase tracking-[0.24em] text-[var(--color-burgundy)]">
                      Traversal
                    </div>
                    <div className="mt-2 text-base font-black text-[var(--color-white)]">
                      BFS / DFS
                    </div>
                  </div>
                  <div className="rounded-[1.15rem] border-[2px] border-[var(--color-beige)] bg-[var(--color-black)] p-4 shadow-[6px_6px_0_#c19a6b]">
                    <div className="text-[11px] uppercase tracking-[0.24em] text-[var(--color-camel)]">
                      Output
                    </div>
                    <div className="mt-2 text-base font-black text-[var(--color-white)]">
                      Tree + logs
                    </div>
                  </div>
                </div>
              </div>
            </div>

            <aside className="relative border-t-[3px] border-[var(--color-beige)] bg-[var(--color-eggplant)]/45 p-6 sm:p-8 lg:border-l-[3px] lg:border-t-0">
              <div className="relative flex h-full flex-col justify-between gap-6">
                <div>
                  <div className="text-[11px] font-black uppercase tracking-[0.34em] text-[var(--color-light-blue)]">
                    Live status
                  </div>
                  <div className="mt-4 text-2xl font-black uppercase tracking-tight text-[var(--color-white)]">
                    {isLoading ? "Tracing..." : "Ready"}
                  </div>
                  <p className="mt-3 max-w-sm text-sm text-[var(--color-gray)]">
                    {status}
                  </p>
                </div>

                <div className="grid gap-3">
                  <div className="rounded-[1.1rem] border-[2px] border-[var(--color-beige)] bg-[var(--color-black)] p-4">
                    <div className="text-[11px] uppercase tracking-[0.24em] text-[var(--color-light-blue)]">
                      Current selector
                    </div>
                    <div className="mt-2 break-all text-sm font-black text-[var(--color-white)]">
                      {input.selector}
                    </div>
                  </div>
                  <div className="rounded-[1.1rem] border-[2px] border-[var(--color-beige)] bg-[var(--color-black)] p-4">
                    <div className="text-[11px] uppercase tracking-[0.24em] text-[var(--color-burgundy)]">
                      Match count
                    </div>
                    <div className="mt-2 text-sm font-black text-[var(--color-white)]">
                      {result ? `${result.metrics.matchesFound} match` : "No analysis yet"}
                    </div>
                  </div>
                </div>
              </div>
            </aside>
          </div>
        </section>

        <div className="space-y-6">
          <InputPanel
            input={input}
            isLoading={isLoading}
            error={error}
            onChange={handleInputChange}
            onAnalyze={handleSubmit}
            onLoadSample={handleLoadSample}
          />

          <details className="rounded-[1.4rem] border-[3px] border-[var(--color-beige)] bg-[var(--color-navy)]/95 shadow-[10px_10px_0_#121212]">
            <summary className="cursor-pointer list-none px-6 py-4 text-sm font-black uppercase tracking-[0.2em] text-[var(--color-light-blue)] sm:px-8">
              Metrics + Logs
            </summary>
            <div className="space-y-4 border-t-[3px] border-[var(--color-beige)] p-4 sm:p-6">
              <MetricsPanel result={result} />
              <TraversalLog result={result} />
            </div>
          </details>

          <div className="w-full">
            <DOMTreeViewer result={result} />
          </div>
        </div>
      </div>
    </main>
  );
}
