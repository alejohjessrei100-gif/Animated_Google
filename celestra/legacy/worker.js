const ROUTES = {
  "/": { key: "index.html", type: "text/html; charset=utf-8" },
  "/index.html": { key: "index.html", type: "text/html; charset=utf-8" },
  "/style.css": { key: "style.css", type: "text/css; charset=utf-8" },
  "/audio.js": { key: "audio.js", type: "application/javascript; charset=utf-8" },
  "/vfx.js": { key: "vfx.js", type: "application/javascript; charset=utf-8" },
  "/fighters.js": { key: "fighters.js", type: "application/javascript; charset=utf-8" },
  "/game.js": { key: "game.js", type: "application/javascript; charset=utf-8" }
};
export default {
  async fetch(request, env) {
    const url = new URL(request.url);
    const entry = ROUTES[url.pathname];
    if (!entry) return new Response("Not Found", { status: 404 });
    const body = await env.ASSETS_KV.get(entry.key, "arrayBuffer");
    if (!body) return new Response("Asset Missing", { status: 404 });
    return new Response(body, {
      status: 200,
      headers: { "Content-Type": entry.type, "Cache-Control": "public, max-age=300" }
    });
  }
};
