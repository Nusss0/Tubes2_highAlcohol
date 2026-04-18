import { NextResponse } from "next/server";

export async function GET() {
  return NextResponse.json(
    {
      name: "dummy-presets",
      description: "Preset values for testing API-powered traversal workflows.",
      presets: {
        sourceType: "url",
        source: "http://localhost:3000/api/dummy-html?format=raw",
        algorithm: "bfs",
        selector: ".card, .leaf, [data-depth]",
        resultScope: "top",
        limit: 12,
      },
      selectors: [
        ".card",
        ".leaf",
        ".branch",
        "[data-depth='6']",
        "nav .menu-item",
      ],
      usage: {
        preset: "/api/dummy-presets",
        deepHtmlJson: "/api/dummy-html",
        deepHtmlRaw: "/api/dummy-html?format=raw",
      },
    },
    {
      headers: {
        "cache-control": "no-store",
      },
    },
  );
}
