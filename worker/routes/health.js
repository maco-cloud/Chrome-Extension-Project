import { json } from "../utils/response.js";

export function handleHealth() {
  return json({
    ok: true,
    service: "quickdigest-license-api",
    timestamp: Date.now(),
  });
}
