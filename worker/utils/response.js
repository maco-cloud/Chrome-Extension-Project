import { JSON_HEADERS } from "./constants.js";

export function json(data, status = 200) {
  return new Response(JSON.stringify(data), {
    status,
    headers: JSON_HEADERS,
  });
}

export function errorResponse(message, status = 400) {
  return json({ ok: false, error: message }, status);
}

export function notFound() {
  return errorResponse("Not found", 404);
}

export function methodNotAllowed() {
  return errorResponse("Method not allowed", 405);
}
