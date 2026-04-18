import { NextResponse } from "next/server";

const DEEP_TEMPLATE_HTML = `<!doctype html>
<html lang="en">
  <head>
    <meta charset="utf-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1" />
    <title>Deep Traversal Fixture</title>
  </head>
  <body>
    <main id="root-shell" class="page page--fixture">
      <header class="hero hero--banner">
        <h1>Deep Traversal Fixture</h1>
        <p>Template for testing BFS and DFS on a deep, nested DOM.</p>
      </header>

      <section class="layer layer-1" data-depth="1">
        <article class="node card card-alpha" data-kind="module">
          <div class="stack stack-2" data-depth="2">
            <section class="layer layer-3" data-depth="3">
              <div class="grid grid-4" data-depth="4">
                <article class="card card-beta" data-depth="5">
                  <div class="inner inner-a" data-depth="6">
                    <ul class="items items-a" data-depth="7">
                      <li class="item item-a1" data-depth="8">
                        <a href="#a1" class="leaf leaf-a1">Leaf A1</a>
                      </li>
                      <li class="item item-a2" data-depth="8">
                        <a href="#a2" class="leaf leaf-a2">Leaf A2</a>
                      </li>
                      <li class="item item-a3" data-depth="8">
                        <button class="leaf leaf-a3">Leaf A3</button>
                      </li>
                    </ul>
                  </div>
                </article>

                <article class="card card-gamma" data-depth="5">
                  <div class="inner inner-b" data-depth="6">
                    <section class="panel panel-b" data-depth="7">
                      <div class="meta meta-b" data-depth="8">
                        <span class="token token-b1">Meta B1</span>
                        <span class="token token-b2">Meta B2</span>
                      </div>
                    </section>
                  </div>
                </article>
              </div>
            </section>
          </div>
        </article>

        <aside class="sidebar sidebar-main" data-depth="2">
          <nav class="menu menu-main" data-depth="3">
            <ul class="menu-list" data-depth="4">
              <li class="menu-item" data-depth="5">
                <span class="menu-label">Overview</span>
              </li>
              <li class="menu-item" data-depth="5">
                <span class="menu-label">Records</span>
              </li>
              <li class="menu-item" data-depth="5">
                <span class="menu-label">Settings</span>
              </li>
            </ul>
          </nav>
        </aside>
      </section>

      <section class="layer layer-1b" data-depth="1">
        <article class="card card-delta" data-kind="module">
          <div class="branch branch-d" data-depth="2">
            <div class="branch branch-d2" data-depth="3">
              <div class="branch branch-d3" data-depth="4">
                <div class="branch branch-d4" data-depth="5">
                  <div class="branch branch-d5" data-depth="6">
                    <div class="branch branch-d6" data-depth="7">
                      <p class="leaf leaf-d">Deep chain leaf</p>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </article>
      </section>

      <footer class="footer footer-main">
        <small>Fixture complete.</small>
      </footer>
    </main>
  </body>
</html>`;

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const format = searchParams.get("format") ?? "json";

  if (format === "raw") {
    return new Response(DEEP_TEMPLATE_HTML, {
      status: 200,
      headers: {
        "content-type": "text/html; charset=utf-8",
        "cache-control": "no-store",
      },
    });
  }

  return NextResponse.json(
    {
      name: "deep-template-html",
      description: "Nested HTML fixture for DOM traversal visualization testing.",
      html: DEEP_TEMPLATE_HTML,
      usage: {
        json: "/api/dummy-html",
        raw: "/api/dummy-html?format=raw",
      },
    },
    {
      headers: {
        "cache-control": "no-store",
      },
    },
  );
}
