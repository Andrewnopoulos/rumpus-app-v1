import type { Ctx } from "../index";
import { json } from "../lib/responses";
import { nowSec } from "../lib/time";

/** GET /health — liveness check, no auth. */
export function health(_c: Ctx): Response {
  return json({ status: "ok", time: nowSec() });
}
