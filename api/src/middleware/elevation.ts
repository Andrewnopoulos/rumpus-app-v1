// Authorization guards over a loaded session.
//
//   requireParentMode — rejects if there's no session, or it's in kid mode
//                       (active_profile set). Device-trusted parent is fine.
//   requireElevated   — requires parent mode AND elevated_until in the future.
//
// Each returns an error Response to send, or null when the session passes.

import { errorResponse } from "../lib/responses";
import { nowSec } from "../lib/time";
import type { SessionRecord } from "./session";

export function requireParentMode(session: SessionRecord | null): Response | null {
  if (!session) {
    return errorResponse(401, "unauthenticated", "Sign in required.");
  }
  if (session.active_profile) {
    return errorResponse(403, "parent_mode_required", "This action requires parent mode.");
  }
  return null;
}

export function requireElevated(session: SessionRecord | null): Response | null {
  const parentGuard = requireParentMode(session);
  if (parentGuard) return parentGuard;

  // session is non-null and in parent mode here.
  const elevatedUntil = session!.elevated_until ?? 0;
  if (elevatedUntil <= nowSec()) {
    return errorResponse(403, "elevation_required", "This action requires recent re-authentication.");
  }
  return null;
}
