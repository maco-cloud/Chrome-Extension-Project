import { handleHealth } from "./routes/health.js";
import { handleStripeWebhook } from "./routes/stripe-webhook.js";
import { handleValidateLicense } from "./routes/validate-license.js";
import { handleRevokeLicense } from "./routes/revoke-license.js";
import { notFound, methodNotAllowed } from "./utils/response.js";

const CORS_HEADERS = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "GET, POST, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type, Authorization, X-Admin-Secret",
};

function withCors(response) {
  const headers = new Headers(response.headers);
  Object.entries(CORS_HEADERS).forEach(([k, v]) => headers.set(k, v));
  return new Response(response.body, { status: response.status, headers });
}

export default {
  async fetch(request, env) {
    if (request.method === "OPTIONS") {
      return new Response(null, { status: 204, headers: CORS_HEADERS });
    }

    const url = new URL(request.url);
    const path = url.pathname.replace(/\/+$/, "") || "/";

    try {
      let response;

      if (path === "/health" && request.method === "GET") {
        response = handleHealth();
      } else if (path === "/stripe-webhook" && request.method === "POST") {
        response = await handleStripeWebhook(request, env);
      } else if (path === "/validate-license" && request.method === "POST") {
        response = await handleValidateLicense(request, env);
      } else if (path === "/revoke-license" && request.method === "POST") {
        response = await handleRevokeLicense(request, env);
      } else if (path === "/" && request.method === "GET") {
        response = handleHealth();
      } else {
        response = request.method === "GET" || request.method === "POST"
          ? notFound()
          : methodNotAllowed();
      }

      return withCors(response);
    } catch {
      return withCors(
        new Response(JSON.stringify({ ok: false, error: "Service unavailable" }), {
          status: 500,
          headers: { "Content-Type": "application/json", ...CORS_HEADERS },
        }),
      );
    }
  },
};
