import type {
  HtmlTraversalInput,
  TraversalResult,
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
export const TRAVERSE_API_ROUTE = "/api/traverse";

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

export async function analyzeDomTree(input: HtmlTraversalInput): Promise<TraversalResult> {
  const response = await fetch(TRAVERSE_API_ROUTE, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    cache: "no-store",
    body: JSON.stringify(input),
  });

  if (!response.ok) {
    const message = await response.text();
    throw new Error(
      message || `Traversal request failed: ${response.status} ${response.statusText}`,
    );
  }

  return (await response.json()) as TraversalResult;
}