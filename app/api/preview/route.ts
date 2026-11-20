import { fetchPreviewAttempt } from "@/lib/preview/fetch-preview"

export async function POST(request: Request) {
  const body: unknown = await request.json().catch(() => null)

  if (request.signal.aborted) return new Response(null, { status: 204 })

  if (
    !body ||
    typeof body !== "object" ||
    !("url" in body) ||
    typeof body.url !== "string"
  ) {
    return Response.json(
      { message: "Provide a URL as a string." },
      { status: 400 }
    )
  }

  const result = await fetchPreviewAttempt(body.url, { signal: request.signal })
  switch (result.status) {
    case "ready":
      return Response.json({ url: result.url, ...result.metadata })
    case "invalid":
      return Response.json(
        { message: "Enter a valid URL starting with https:// or www." },
        { status: 400 }
      )
    case "blocked":
      return Response.json(
        { message: "This URL points to a blocked destination." },
        { status: 403 }
      )
    case "unavailable":
      return Response.json(
        {
          message: "Preview unavailable",
          url: result.url,
          canLink: result.canLink,
          retryable: result.retryable,
        },
        { status: 502 }
      )
    case "canceled":
      return new Response(null, { status: 204 })
  }
}
