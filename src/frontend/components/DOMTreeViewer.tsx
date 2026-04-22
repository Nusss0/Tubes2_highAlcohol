"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import type { DomTreeNode, TraversalResult } from "@/types/traversal";

interface DOMTreeViewerProps {
  result: TraversalResult | null;
}

const DEPTH_TONES = [
  {
    branchLine: "border-[var(--color-light-blue)]",
    depthPill: "border-[var(--color-light-blue)] bg-[var(--color-light-blue)] text-[var(--color-black)]",
    neutralFrame: "border-[var(--color-beige)] bg-[var(--color-navy)]/65",
  },
  {
    branchLine: "border-[var(--color-burgundy)]",
    depthPill: "border-[var(--color-burgundy)] bg-[var(--color-burgundy)] text-[var(--color-white)]",
    neutralFrame: "border-[var(--color-beige)] bg-[var(--color-eggplant)]/65",
  },
  {
    branchLine: "border-[var(--color-sage)]",
    depthPill: "border-[var(--color-sage)] bg-[var(--color-sage)] text-[var(--color-black)]",
    neutralFrame: "border-[var(--color-beige)] bg-[var(--color-black)]/85",
  },
  {
    branchLine: "border-[var(--color-camel)]",
    depthPill: "border-[var(--color-camel)] bg-[var(--color-camel)] text-[var(--color-black)]",
    neutralFrame: "border-[var(--color-beige)] bg-[var(--color-chocolate)]/80",
  },
  {
    branchLine: "border-[var(--color-gray)]",
    depthPill: "border-[var(--color-gray)] bg-[var(--color-gray)] text-[var(--color-black)]",
    neutralFrame: "border-[var(--color-beige)] bg-[var(--color-navy)]/55",
  },
  {
    branchLine: "border-[var(--color-eggplant)]",
    depthPill: "border-[var(--color-eggplant)] bg-[var(--color-eggplant)] text-[var(--color-white)]",
    neutralFrame: "border-[var(--color-beige)] bg-[var(--color-black)]/75",
  },
] as const;

type TreeVisibilityMode = "expand-all" | "collapse-deep";

function TreeNodeCard({
  node,
  visitedOrderById,
  isRoot = false,
  nodePath,
  initialExpandedDepth,
  activeNodeId,
  activeDepth,
  lcaNodeId,
}: {
  node: DomTreeNode;
  visitedOrderById: Record<string, number>;
  isRoot?: boolean;
  nodePath: string;
  initialExpandedDepth: number;
  activeNodeId: string | null;
  activeDepth: number;
  lcaNodeId: string | null;
}) {
  const [isExpanded, setIsExpanded] = useState(isRoot || node.depth <= initialExpandedDepth);
  const visitOrder = visitedOrderById[node.id];
  const depthTone = DEPTH_TONES[node.depth % DEPTH_TONES.length];
  const isActiveNode = activeNodeId === node.id;
  const isActiveMatchedNode = isActiveNode && node.isMatch;
  const isLcaNode = lcaNodeId === node.id;
  const frameClass = node.isMatch
    ? "border-[var(--color-burgundy)]/60 bg-[var(--color-burgundy)]/12"
    : visitOrder
      ? "border-[var(--color-light-blue)] bg-[var(--color-light-blue)]/20"
      : depthTone.neutralFrame;
  const hasChildren = node.children.length > 0;

  useEffect(() => {
    if (hasChildren && activeDepth > node.depth) {
      setIsExpanded(true);
    }
  }, [activeDepth, hasChildren, node.depth]);

  return (
    <li className={isRoot ? "" : "relative pl-6"}>
      {!isRoot ? (
        <span className={`absolute left-2 top-0 h-full border-l-[3px] ${depthTone.branchLine}`} />
      ) : null}

      <div
        className={`border-[2px] ${frameClass} p-4 shadow-[2px_2px_0_#c19a6b] transition ${
          isLcaNode
            ? "ring-4 ring-[var(--color-sage)] ring-offset-2 ring-offset-[var(--color-black)]"
            : isActiveMatchedNode
            ? "ring-2 ring-[var(--color-camel)]/80 ring-offset-2 ring-offset-[var(--color-black)]"
            : isActiveNode
              ? "ring-4 ring-[var(--color-light-blue)] ring-offset-2 ring-offset-[var(--color-black)]"
              : ""
        }`}
        data-node-id={node.id}
      >
        <div className="flex flex-wrap items-center gap-2">
          <span className="text-sm font-black uppercase tracking-tight text-[var(--color-white)]">
            &lt;{node.label}&gt;
          </span>
          <span className="rounded-full border-[2px] border-[var(--color-beige)] bg-[var(--color-beige)] px-2.5 py-1 text-[11px] font-black uppercase tracking-[0.22em] text-[var(--color-black)]">
            {node.tagName}
          </span>
          {visitOrder ? (
            <span className="rounded-full border-[2px] border-[var(--color-beige)] bg-[var(--color-light-blue)] px-2.5 py-1 text-[11px] font-black uppercase tracking-[0.22em] text-[var(--color-black)]">
              visit #{visitOrder}
            </span>
          ) : null}
          {node.isMatch ? (
            <span className="rounded-full border-[2px] border-[var(--color-beige)] bg-[var(--color-burgundy)]/70 px-2.5 py-1 text-[11px] font-black uppercase tracking-[0.22em] text-[var(--color-white)]">
              match
            </span>
          ) : null}
          {isLcaNode ? (
            <span className="rounded-full border-[2px] border-[var(--color-beige)] bg-[var(--color-sage)] px-2.5 py-1 text-[11px] font-black uppercase tracking-[0.22em] text-[var(--color-black)]">
              lca
            </span>
          ) : null}
          {isActiveMatchedNode ? (
            <span className="rounded-full border-[2px] border-[var(--color-beige)] bg-[var(--color-camel)]/80 px-2.5 py-1 text-[11px] font-black uppercase tracking-[0.22em] text-[var(--color-black)]">
              active match
            </span>
          ) : null}
          {hasChildren ? (
            <button
              type="button"
              onClick={() => setIsExpanded((prev) => !prev)}
              className="ml-auto inline-flex items-center gap-2 rounded-[var(--radius-control)] border-[2px] border-[var(--color-beige)] bg-[var(--color-eggplant)]/50 px-3 py-1.5 text-[11px] font-black uppercase tracking-[0.2em] text-[var(--color-white)] transition hover:-translate-y-0.5 hover:bg-[var(--color-camel)] hover:text-[var(--color-black)]"
              aria-expanded={isExpanded}
              aria-label={isExpanded ? "Collapse node children" : "Expand node children"}
            >
              <span className="inline-flex h-5 w-5 items-center justify-center rounded-full border-[2px] border-current text-[10px] leading-none">
                {isExpanded ? "-" : "+"}
              </span>
              {isExpanded ? "hide" : "show"} children ({node.children.length})
            </button>
          ) : null}
        </div>

        {node.attributes.length > 0 ? (
          <div className="mt-3 flex flex-wrap gap-2">
            {node.attributes.map((attribute, index) => (
              <span
                key={`${nodePath}-attr-${attribute.name}-${index}`}
                className="rounded-full border-[2px] border-[var(--color-beige)] bg-[var(--color-eggplant)]/45 px-2.5 py-1 text-[11px] text-[var(--color-gray)]"
              >
                {attribute.name}="{attribute.value}"
              </span>
            ))}
          </div>
        ) : null}

        {node.textPreview ? (
          <p className="mt-3 max-w-3xl border-[2px] border-dashed border-[var(--color-beige)] bg-[var(--color-black)]/55 px-3 py-2 text-sm leading-6 text-[var(--color-gray)]">
            {node.textPreview}
          </p>
        ) : null}

        <div className="mt-3 flex flex-wrap gap-2 text-[11px] font-black uppercase tracking-[0.22em] text-[var(--color-gray)]">
          <span className={`rounded-full border-[2px] px-2.5 py-1 ${depthTone.depthPill}`}>
            depth {node.depth}
          </span>
          <span className="rounded-full border-[2px] border-[var(--color-beige)] bg-[var(--color-black)] px-2.5 py-1">
            children {node.children.length}
          </span>
        </div>

        {hasChildren && isExpanded ? (
          <ul className="mt-4 space-y-3">
            {node.children.map((child, index) => (
              <TreeNodeCard
                key={`${nodePath}-${child.id}-${index}`}
                node={child}
                visitedOrderById={visitedOrderById}
                nodePath={`${nodePath}-${index}`}
                initialExpandedDepth={initialExpandedDepth}
                activeNodeId={activeNodeId}
                activeDepth={activeDepth}
                lcaNodeId={lcaNodeId}
              />
            ))}
          </ul>
        ) : null}
      </div>
    </li>
  );
}

export function DOMTreeViewer({ result }: DOMTreeViewerProps) {
  const [visibilityMode, setVisibilityMode] = useState<TreeVisibilityMode>("collapse-deep");
  const [isPlaying, setIsPlaying] = useState(true);
  const [currentStep, setCurrentStep] = useState(0);
  const [speedMs, setSpeedMs] = useState(450);
  const treeContainerRef = useRef<HTMLDivElement | null>(null);
  const latestResultRef = useRef<TraversalResult | null>(result);
  const latestSpeedRef = useRef(speedMs);

  const totalSteps = result?.steps.length ?? 0;
  const activeStep =
    result && currentStep > 0 && totalSteps > 0
      ? result.steps[Math.min(currentStep, totalSteps) - 1]
      : null;
  const activeNodeId = activeStep?.nodeId ?? null;
  const activeDepth = activeStep?.depth ?? 0;
  const lcaNodeId = result?.lca?.available ? result.lca.nodeId : null;
  const initialExpandedDepth =
    visibilityMode === "expand-all"
      ? Number.POSITIVE_INFINITY
      : 2;

  const animatedVisitedOrderById = useMemo(() => {
    if (!result) {
      return {};
    }

    const visibleMap: Record<string, number> = {};

    for (let index = 0; index < currentStep && index < totalSteps; index += 1) {
      const step = result.steps[index];

      if (step) {
        visibleMap[step.nodeId] = step.order;
      }
    }

    return visibleMap;
  }, [currentStep, result, totalSteps]);

  useEffect(() => {
    latestResultRef.current = result;
  }, [result]);

  useEffect(() => {
    latestSpeedRef.current = speedMs;
  }, [speedMs]);

  useEffect(() => {
    setCurrentStep(0);
    setIsPlaying(true);
  }, [result]);

  useEffect(() => {
    if (!isPlaying || totalSteps === 0 || currentStep >= totalSteps) {
      return;
    }

    const timerId = window.setInterval(() => {
      setCurrentStep((previous) => Math.min(previous + 1, totalSteps));
    }, speedMs);

    return () => window.clearInterval(timerId);
  }, [currentStep, isPlaying, speedMs, totalSteps]);

  useEffect(() => {
    if (currentStep >= totalSteps && isPlaying) {
      setIsPlaying(false);
    }
  }, [currentStep, isPlaying, totalSteps]);

  useEffect(() => {
    if (!activeNodeId || !treeContainerRef.current || !latestResultRef.current) {
      return;
    }

    const container = treeContainerRef.current;
    const activeElement = container.querySelector<HTMLElement>(
      `[data-node-id="${activeNodeId}"]`,
    );

    if (activeElement) {
      const containerRect = container.getBoundingClientRect();
      const elementRect = activeElement.getBoundingClientRect();
      const comfortPadding = 96;
      const topBoundary = containerRect.top + comfortPadding;
      const bottomBoundary = containerRect.bottom - comfortPadding;

      let targetTop = container.scrollTop;

      if (elementRect.top < topBoundary) {
        targetTop -= topBoundary - elementRect.top;
      } else if (elementRect.bottom > bottomBoundary) {
        targetTop += elementRect.bottom - bottomBoundary;
      }

      const delta = Math.abs(targetTop - container.scrollTop);
      if (delta < 8) {
        return;
      }

      container.scrollTo({
        top: Math.max(0, targetTop),
        behavior: latestSpeedRef.current <= 360 ? "auto" : "smooth",
      });
    }
  }, [activeNodeId]);

  if (!result) {
    return (
      <section className="rounded-[var(--radius-panel)] border-[3px] border-[var(--color-beige)] bg-[var(--color-navy)]/95 shadow-[10px_10px_0_#121212]">
        <div className="p-6">
          <div className="text-[11px] font-black uppercase tracking-[0.34em] text-[var(--color-burgundy)]">
            DOM Tree
          </div>
          <div className="mt-3 text-lg font-black uppercase tracking-tight text-[var(--color-white)]">
            Run traversal to show tree.
          </div>
        </div>
      </section>
    );
  }

  return (
    <section className="rounded-[var(--radius-panel)] border-[3px] border-[var(--color-beige)] bg-[var(--color-navy)]/95 shadow-[10px_10px_0_#121212]">
      <div className="border-b-[3px] border-[var(--color-beige)] px-6 py-5 sm:px-8">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <div className="text-[11px] font-black uppercase tracking-[0.34em] text-[var(--color-burgundy)]">
              DOM Tree
            </div>
            <h2 className="mt-2 text-2xl font-black uppercase tracking-tight text-[var(--color-white)]">
              Traversal map
            </h2>
          </div>

          <div className="flex flex-wrap gap-2 text-sm font-black uppercase text-[var(--color-white)]">
            <span className="rounded-full border-[2px] border-[var(--color-beige)] bg-[var(--color-black)] px-3 py-1">
              max depth {result.metrics.maxDepth}
            </span>
            <span className="rounded-full border-[2px] border-[var(--color-beige)] bg-[var(--color-black)] px-3 py-1">
              total nodes {result.metrics.totalNodes}
            </span>
            <span className="rounded-full border-[2px] border-[var(--color-beige)] bg-[var(--color-eggplant)]/45 px-3 py-1">
              animated {Math.min(currentStep, totalSteps)}/{totalSteps}
            </span>
          </div>
        </div>

        {activeStep ? (
          <div className="mt-3 rounded-[var(--radius-control)] border-[2px] border-[var(--color-beige)] bg-[var(--color-black)]/70 px-3 py-2 text-xs text-[var(--color-gray)]">
            <span className="font-black uppercase tracking-[0.18em] text-[var(--color-light-blue)]">
              step #{activeStep.order}
            </span>{" "}
            <span className="font-semibold text-[var(--color-white)]">{activeStep.label}</span>{" "}
            <span className="uppercase">depth {activeStep.depth}</span>{" "}
            <span className="uppercase">{activeStep.matched ? "match" : "visit"}</span>
          </div>
        ) : null}

        <div className="mt-4 flex flex-wrap items-center gap-2">
          <button
            type="button"
            onClick={() => setVisibilityMode("collapse-deep")}
            className={`rounded-[var(--radius-control)] border-[2px] px-3 py-1.5 text-[11px] font-black uppercase tracking-[0.2em] transition ${
              visibilityMode === "collapse-deep"
                ? "border-[var(--color-burgundy)] bg-[var(--color-burgundy)] text-[var(--color-white)]"
                : "border-[var(--color-beige)] bg-[var(--color-eggplant)]/45 text-[var(--color-white)] hover:bg-[var(--color-beige)] hover:text-[var(--color-black)]"
            }`}
          >
            Collapse deep
          </button>
          <button
            type="button"
            onClick={() => setVisibilityMode("expand-all")}
            className={`rounded-[var(--radius-control)] border-[2px] px-3 py-1.5 text-[11px] font-black uppercase tracking-[0.2em] transition ${
              visibilityMode === "expand-all"
                ? "border-[var(--color-sage)] bg-[var(--color-sage)] text-[var(--color-black)]"
                : "border-[var(--color-beige)] bg-[var(--color-eggplant)]/45 text-[var(--color-white)] hover:bg-[var(--color-beige)] hover:text-[var(--color-black)]"
            }`}
          >
            Expand all
          </button>
        </div>

        <div className="mt-3 flex flex-wrap items-center gap-2">
          <button
            type="button"
            onClick={() => {
              if (currentStep >= totalSteps) {
                setCurrentStep(0);
                setIsPlaying(true);
                return;
              }

              setIsPlaying((previous) => !previous);
            }}
            className="rounded-[var(--radius-control)] border-[2px] border-[var(--color-beige)] bg-[var(--color-black)] px-3 py-1.5 text-[11px] font-black uppercase tracking-[0.2em] text-[var(--color-white)] transition hover:bg-[var(--color-beige)] hover:text-[var(--color-black)]"
          >
            {currentStep >= totalSteps ? "Restart" : isPlaying ? "Pause" : "Play"}
          </button>
          <button
            type="button"
            onClick={() => setSpeedMs(700)}
            className={`rounded-[var(--radius-control)] border-[2px] px-3 py-1.5 text-[11px] font-black uppercase tracking-[0.2em] transition ${
              speedMs === 700
                ? "border-[var(--color-burgundy)] bg-[var(--color-burgundy)] text-[var(--color-white)]"
                : "border-[var(--color-beige)] bg-[var(--color-eggplant)]/45 text-[var(--color-white)] hover:bg-[var(--color-beige)] hover:text-[var(--color-black)]"
            }`}
          >
            Slow
          </button>
          <button
            type="button"
            onClick={() => setSpeedMs(450)}
            className={`rounded-[var(--radius-control)] border-[2px] px-3 py-1.5 text-[11px] font-black uppercase tracking-[0.2em] transition ${
              speedMs === 450
                ? "border-[var(--color-burgundy)] bg-[var(--color-burgundy)] text-[var(--color-white)]"
                : "border-[var(--color-beige)] bg-[var(--color-eggplant)]/45 text-[var(--color-white)] hover:bg-[var(--color-beige)] hover:text-[var(--color-black)]"
            }`}
          >
            Normal
          </button>
          <button
            type="button"
            onClick={() => setSpeedMs(360)}
            className={`rounded-[var(--radius-control)] border-[2px] px-3 py-1.5 text-[11px] font-black uppercase tracking-[0.2em] transition ${
              speedMs === 360
                ? "border-[var(--color-burgundy)] bg-[var(--color-burgundy)] text-[var(--color-white)]"
                : "border-[var(--color-beige)] bg-[var(--color-eggplant)]/45 text-[var(--color-white)] hover:bg-[var(--color-beige)] hover:text-[var(--color-black)]"
            }`}
          >
            Fast
          </button>
        </div>
      </div>

      <div
        ref={treeContainerRef}
        className="max-h-[84vh] overflow-y-auto overflow-x-auto px-4 py-5 pr-3 sm:px-5 sm:pr-4"
      >
        <div className="inline-block min-w-full border-[2px] border-[var(--color-beige)] bg-[var(--color-black)] p-4">
          <ul className="w-max min-w-full space-y-3">
            <TreeNodeCard
              key={`${result.tree.id}-${visibilityMode}-${totalSteps}`}
              node={result.tree}
              visitedOrderById={animatedVisitedOrderById}
              isRoot
              nodePath="root"
              initialExpandedDepth={initialExpandedDepth}
              activeNodeId={activeNodeId}
              activeDepth={activeDepth}
              lcaNodeId={lcaNodeId}
            />
          </ul>
        </div>
      </div>
    </section>
  );
}
