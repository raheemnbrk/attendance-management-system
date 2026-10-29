// Streams attendance export files from the Express backend to the browser so
// the client only ever talks to the Next.js origin. The backend response
// (Content-Type, Content-Disposition, file body) is forwarded as-is; errors
// like 429 rate limiting are forwarded as JSON with the backend message.
const BACKEND_URL = process.env.BACKEND_URL ?? "http://localhost:3000";

export async function GET(request: Request): Promise<Response> {
  const { search } = new URL(request.url);
  const authorization = request.headers.get("authorization") ?? "";

  let backendResponse: Response;
  try {
    backendResponse = await fetch(`${BACKEND_URL}/api/attendance/export${search}`, {
      headers: authorization ? { authorization } : undefined,
    });
  } catch {
    return Response.json(
      { success: false, message: "Cannot reach the server" },
      { status: 502 },
    );
  }

  const contentType = backendResponse.headers.get("content-type") ?? "";

  if (!backendResponse.ok || contentType.includes("application/json")) {
    let message = backendResponse.ok ? "Export failed" : `Export failed (${backendResponse.status})`;

    try {
      const data = (await backendResponse.json()) as { message?: string };
      if (data.message) {
        message = data.message;
      }
    } catch {
      // Not JSON; keep the fallback message.
    }

    return Response.json({ success: false, message }, { status: backendResponse.status });
  }

  const headers = new Headers();
  const disposition = backendResponse.headers.get("content-disposition");
  if (disposition) {
    headers.set("content-disposition", disposition);
  }
  headers.set("content-type", contentType);
  headers.set("cache-control", "no-store");

  return new Response(backendResponse.body, {
    status: backendResponse.status,
    headers,
  });
}
