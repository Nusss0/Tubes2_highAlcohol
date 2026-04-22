import { NextResponse } from "next/server";

const BACKEND_BASE =
  process.env.BACKEND_INTERNAL_URL?.replace(/\/$/, "") ??
  process.env.NEXT_PUBLIC_BACKEND_URL?.replace(/\/$/, "") ??
  "http://localhost:8080";

type CanonicalTraversalRequest = {
  sourceType: "html" | "url";
  source: string;
  algorithm: "bfs" | "dfs";
  selector: string;
  resultScope: "top" | "all";
  limit: number;
};

function toStringValue(value: unknown) {
  return typeof value === "string" ? value.trim() : "";
}

function toPositiveInteger(value: unknown, fallback: number) {
  if (typeof value === "number" && Number.isFinite(value)) {
    return Math.max(1, Math.floor(value));
  }

  if (typeof value === "string" && value.trim() !== "") {
    const parsed = Number(value);
    if (Number.isFinite(parsed)) {
      return Math.max(1, Math.floor(parsed));
    }
  }

  return fallback;
}

function normalizeTraversalRequest(payload: unknown): CanonicalTraversalRequest {
  const body =
    payload && typeof payload === "object"
      ? (payload as Record<string, unknown>)
      : {};

  const sourceTypeRaw =
    toStringValue(body.sourceType) ||
    toStringValue(body.inputType) ||
    (toStringValue(body.url) ? "url" : "html");
  const sourceType: "html" | "url" = sourceTypeRaw === "url" ? "url" : "html";

  const source =
    toStringValue(body.source) ||
    toStringValue(body.html) ||
    toStringValue(body.url) ||
    toStringValue(body.input);

  const algorithmRaw =
    toStringValue(body.algorithm) ||
    toStringValue(body.traversal) ||
    toStringValue(body.method);
  const algorithm: "bfs" | "dfs" = algorithmRaw === "dfs" ? "dfs" : "bfs";

  const resultScopeRaw =
    toStringValue(body.resultScope) ||
    toStringValue(body.scope);
  const resultScope: "top" | "all" = resultScopeRaw === "all" ? "all" : "top";

  const limit = toPositiveInteger(body.limit ?? body.n ?? body.maxResults, 1);
  const selector = toStringValue(body.selector) || "*";

  return {
    sourceType,
    source,
    algorithm,
    selector,
    resultScope,
    limit,
  };
}

export async function POST(request: Request) {
  let payload: unknown;

  try {
    payload = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON body" }, { status: 400 });
  }

  const normalizedPayload = normalizeTraversalRequest(payload);
  if (!normalizedPayload.source) {
    return NextResponse.json(
      { error: "Request must include a non-empty source (HTML or URL)." },
      { status: 400 },
    );
  }

  try {
    const upstream = await fetch(`${BACKEND_BASE}/api/traverse`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      cache: "no-store",
      body: JSON.stringify(normalizedPayload),
    });

    const text = await upstream.text();
    const contentType = upstream.headers.get("content-type") ?? "application/json";

    return new Response(text, {
      status: upstream.status,
      headers: {
        "content-type": contentType,
        "cache-control": "no-store",
      },
    });
  } catch {
    return NextResponse.json(
      { error: "Failed to reach backend traversal service" },
      { status: 502 },
    );
  }
}
