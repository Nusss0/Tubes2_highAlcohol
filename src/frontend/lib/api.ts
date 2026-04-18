import type {
  DomTreeNode,
  HtmlTraversalInput,
  TraversalResult,
  TraversalStep,
} from "@/types/traversal";

export const SAMPLE_HTML = `
<!doctype html>
<html lang="en">
  <head>
    <meta charset="utf-8" />
    <title>Traversal Sample</title>
  </head>
  <body>
    <main class="page-shell">
      <section class="card hero">
        <h1>DOM Traversal Lab</h1>
        <p>Find every card and highlight the path.</p>
      </section>
      <section class="grid">
        <article class="card">Alpha</article>
        <article class="card">Beta</article>
        <article class="card">Gamma</article>
      </section>
      <footer data-role="footer">Traversal complete.</footer>
    </main>
  </body>
</html>
`;

export const DUMMY_HTML_API_ROUTE = "/api/dummy-html";
export const DUMMY_PRESET_API_ROUTE = "/api/dummy-presets";

interface DummyHtmlApiResponse {
  html: string;
}

export async function fetchDummyHtmlTemplate() {
  const response = await fetch(DUMMY_HTML_API_ROUTE, {
    cache: "no-store",
  });

  if (!response.ok) {
    throw new Error(`Failed to load dummy HTML template: ${response.status} ${response.statusText}`);
  }

  const data = (await response.json()) as DummyHtmlApiResponse;

  if (!data?.html || typeof data.html !== "string") {
    throw new Error("Dummy HTML API response is invalid.");
  }

  return data.html;
}

export async function fetchHtmlFromSource(source: string) {
  let normalizedUrl: URL;

  try {
    normalizedUrl = new URL(source);
  } catch {
    throw new Error("Invalid URL.");
  }

  const response = await fetch(normalizedUrl.toString(), {
    cache: "no-store",
    mode: "cors",
  });

  if (!response.ok) {
    throw new Error(`Failed to fetch HTML: ${response.status} ${response.statusText}`);
  }

  return await response.text();
}

export function analyzeDomTree(html: string, input: HtmlTraversalInput): TraversalResult {
  const startedAt = performance.now();

  const normalizedSelector = input.selector.trim() || "*";
  const htmlLength = html.length;

  const tree: DomTreeNode = {
    id: "root",
    label: "document",
    tagName: "document",
    depth: 0,
    attributes: [],
    textPreview: "Dummy traversal tree generated on frontend.",
    isMatch: false,
    children: [
      {
        id: "node-1",
        label: "main.fixture-shell",
        tagName: "main",
        depth: 1,
        attributes: [{ name: "class", value: "fixture-shell" }],
        textPreview: "",
        isMatch: false,
        children: [
          {
            id: "node-2",
            label: "section.card.hero",
            tagName: "section",
            depth: 2,
            attributes: [{ name: "class", value: "card hero" }],
            textPreview: "Dummy hero block",
            isMatch: true,
            children: [],
          },
          {
            id: "node-3",
            label: "section.grid",
            tagName: "section",
            depth: 2,
            attributes: [{ name: "class", value: "grid" }],
            textPreview: "",
            isMatch: false,
            children: [
              {
                id: "node-4",
                label: "article.card.alpha",
                tagName: "article",
                depth: 3,
                attributes: [{ name: "class", value: "card alpha" }],
                textPreview: "Alpha",
                isMatch: true,
                children: [],
              },
              {
                id: "node-5",
                label: "article.card.beta",
                tagName: "article",
                depth: 3,
                attributes: [{ name: "class", value: "card beta" }],
                textPreview: "Beta",
                isMatch: true,
                children: [],
              },
            ],
          },
          {
            id: "node-6",
            label: "footer.fixture-footer",
            tagName: "footer",
            depth: 2,
            attributes: [{ name: "class", value: "fixture-footer" }],
            textPreview: "Traversal dummy result",
            isMatch: false,
            children: [],
          },
        ],
      },
    ],
  };

  const stepNodeOrder =
    input.algorithm === "bfs"
      ? ["node-1", "node-2", "node-3", "node-6", "node-4", "node-5"]
      : ["node-1", "node-2", "node-3", "node-4", "node-5", "node-6"];

  const nodeMeta: Record<string, { label: string; depth: number; matched: boolean }> = {
    "node-1": { label: "main.fixture-shell", depth: 1, matched: false },
    "node-2": { label: "section.card.hero", depth: 2, matched: true },
    "node-3": { label: "section.grid", depth: 2, matched: false },
    "node-4": { label: "article.card.alpha", depth: 3, matched: true },
    "node-5": { label: "article.card.beta", depth: 3, matched: true },
    "node-6": { label: "footer.fixture-footer", depth: 2, matched: false },
  };

  const matchLimit = input.resultScope === "top" ? Math.max(1, input.limit) : Number.POSITIVE_INFINITY;
  const visitedOrderById: Record<string, number> = {};
  const matchedNodeIds: string[] = [];

  const steps: TraversalStep[] = stepNodeOrder.map((nodeId, index) => {
    const current = nodeMeta[nodeId];

    visitedOrderById[nodeId] = index + 1;
    if (current.matched && matchedNodeIds.length < matchLimit) {
      matchedNodeIds.push(nodeId);
    }

    const frontier = stepNodeOrder.slice(index + 1).map((id) => nodeMeta[id].label);

    return {
      order: index + 1,
      nodeId,
      label: current.label,
      depth: current.depth,
      matched: current.matched,
      frontier,
      message: current.matched
        ? `[DUMMY] ${current.label} marked as match for selector ${normalizedSelector}.`
        : `[DUMMY] Visited ${current.label} at depth ${current.depth}.`,
    };
  });

  const elapsedMs = Math.max(1, Math.round(performance.now() - startedAt));

  return {
    tree,
    steps,
    metrics: {
      algorithm: input.algorithm,
      selector: normalizedSelector,
      sourceType: input.sourceType,
      maxDepth: 3,
      totalNodes: 7,
      nodesVisited: steps.length,
      matchesFound: matchedNodeIds.length,
      elapsedMs,
    },
    visitedOrderById,
    matchedNodeIds,
    stopReason:
      input.resultScope === "top" && matchedNodeIds.length >= matchLimit
        ? `[DUMMY] Stopped at top limit ${matchLimit}.`
        : `[DUMMY] Frontend traversal is mocked. Source size: ${htmlLength} chars.`,
  };
}