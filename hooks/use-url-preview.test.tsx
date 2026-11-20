import assert from "node:assert/strict"
import { mock, test } from "node:test"
import { QueryClient, QueryClientProvider } from "@tanstack/react-query"
import { renderToString } from "react-dom/server"

import { PreviewRequestError, useUrlPreview } from "./use-url-preview"

const url = "https://www.example.com/#intro"
const preview = { url, hostname: "www.example.com", title: "Example" }

function setup() {
  const client = new QueryClient()
  let hook!: ReturnType<typeof useUrlPreview>
  function Consumer() {
    hook = useUrlPreview()
    return null
  }
  renderToString(
    <QueryClientProvider client={client}>
      <Consumer />
    </QueryClientProvider>
  )
  return { client, hook }
}

test("shares an in-flight request and keeps the result after cancellation of a completed entry", async () => {
  const { client, hook } = setup()
  const fetch = mock.method(globalThis, "fetch", async () =>
    Response.json(preview)
  )
  try {
    const first = hook.fetchPreview("www.example.com/#intro")
    const second = hook.fetchPreview(url)
    assert.deepEqual(await Promise.all([first, second]), [preview, preview])

    await hook.cancelPreview(url)
    assert.deepEqual(hook.getFreshPreview(url), preview)
    assert.deepEqual(await hook.fetchPreview(url), preview)
    assert.equal(fetch.mock.callCount(), 1)
    assert.equal(hook.getFreshPreview("www.example.com/#details"), undefined)
  } finally {
    fetch.mock.restore()
    client.clear()
  }
})

test("refetches expired data and keeps failed responses ineligible for reuse", async () => {
  const { client, hook } = setup()
  client.setQueryData(["url-preview", url], preview, {
    updatedAt: Date.now() - 300_000,
  })
  const fetch = mock.method(globalThis, "fetch", async () =>
    Response.json(
      { message: "Preview unavailable", retryable: true, canLink: true },
      { status: 502 }
    )
  )
  const retryable = (error: unknown) =>
    error instanceof PreviewRequestError &&
    error.retryable &&
    error.linkUrl === url
  try {
    assert.equal(hook.getFreshPreview(url), undefined)
    await assert.rejects(hook.fetchPreview(url), retryable)
    await assert.rejects(hook.fetchPreview(url), retryable)
    assert.equal(fetch.mock.callCount(), 2)
    assert.equal(hook.getFreshPreview(url), undefined)
  } finally {
    fetch.mock.restore()
    client.clear()
  }
})

test("cancels the active network request without caching a late response", async () => {
  const { client, hook } = setup()
  let signal: AbortSignal | null | undefined
  let complete!: (response: Response) => void
  const fetch = mock.method(
    globalThis,
    "fetch",
    (_input: RequestInfo | URL, init?: RequestInit) => {
      signal = init?.signal
      return new Promise<Response>((resolve) => {
        complete = resolve
      })
    }
  )
  try {
    const rejected = assert.rejects(hook.fetchPreview(url))
    await hook.cancelPreview(url)
    assert.equal(signal?.aborted, true)
    complete(Response.json(preview))
    await rejected
    assert.equal(hook.getFreshPreview(url), undefined)
  } finally {
    fetch.mock.restore()
    client.clear()
  }
})
