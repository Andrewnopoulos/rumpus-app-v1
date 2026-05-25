// JSON response helpers and the canonical error shape:
//   { "error": { "code": string, "message": string } }

const JSON_HEADERS = { "content-type": "application/json; charset=utf-8" };

/** JSON success/data response. */
export function json(data: unknown, init: ResponseInit = {}): Response {
  return new Response(JSON.stringify(data), {
    ...init,
    headers: { ...JSON_HEADERS, ...(init.headers ?? {}) },
  });
}

/** JSON error response in the canonical shape. */
export function errorResponse(status: number, code: string, message: string): Response {
  return json({ error: { code, message } }, { status });
}

/** Parse a JSON request body; returns null on empty/invalid JSON. */
export async function readJsonBody<T = unknown>(req: Request): Promise<T | null> {
  try {
    return (await req.json()) as T;
  } catch {
    return null;
  }
}
