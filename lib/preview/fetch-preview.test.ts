import assert from "node:assert/strict"
import { Resolver } from "node:dns/promises"
import { mock, test } from "node:test"

import { fetchPreview, fetchPreviewAttempt } from "./fetch-preview"
import { readMetadata } from "./metadata"

test("prefers Open Graph and resolves assets against the response URL", () => {
  const html = Buffer.from(`
    <title>Fallback title</title>
    <meta property="og:title" content="Open &amp; Graph">
    <meta name="description" content="Fallback description">
    <meta property="og:image" content="cover.jpg">
    <link rel="shortcut icon" href="/favicon.ico">
  `)

  assert.deepEqual(
    readMetadata(html, new URL("https://example.com/articles/page")),
    {
      hostname: "example.com",
      title: "Open & Graph",
      description: "Fallback description",
      imageUrl: "https://example.com/articles/cover.jpg",
      faviconUrl: "https://example.com/favicon.ico",
    }
  )
  assert.equal(
    readMetadata(Buffer.from("<html></html>"), new URL("https://example.com"))
      .title,
    "example.com"
  )
})

test("rejects malformed input and blocks non-public destinations before fetching", async () => {
  assert.deepEqual(await fetchPreviewAttempt("http://example.com"), {
    status: "invalid",
  })
  assert.deepEqual(await fetchPreviewAttempt("https:///example.com"), {
    status: "invalid",
  })
  assert.deepEqual(await fetchPreviewAttempt("https://user:pass@example.com"), {
    status: "invalid",
  })
  assert.deepEqual(await fetchPreviewAttempt("https://127.0.0.1"), {
    status: "blocked",
  })
  assert.deepEqual(await fetchPreviewAttempt("https://[::1]"), {
    status: "blocked",
  })
})

test("normalizes www input and blocks a hostname with a non-public DNS answer", async () => {
  const ipv4 = mock.method(Resolver.prototype, "resolve4", async () => [
    "93.184.216.34",
  ])
  const ipv6 = mock.method(Resolver.prototype, "resolve6", async () => ["::1"])
  try {
    assert.deepEqual(await fetchPreviewAttempt("www.example.com"), {
      status: "blocked",
    })
    assert.deepEqual(ipv4.mock.calls[0]?.arguments, ["www.example.com"])
  } finally {
    ipv4.mock.restore()
    ipv6.mock.restore()
  }
})

test("aborting during backoff prevents another attempt", async () => {
  const signal = new AbortController()
  const ipv4 = mock.method(Resolver.prototype, "resolve4", async () => {
    setTimeout(() => signal.abort(), 20)
    throw Object.assign(new Error("Temporary DNS failure"), {
      code: "ETIMEOUT",
    })
  })
  const ipv6 = mock.method(Resolver.prototype, "resolve6", async () => [])
  try {
    assert.deepEqual(
      await fetchPreview("https://example.com", { signal: signal.signal }),
      {
        status: "canceled",
      }
    )
    assert.equal(ipv4.mock.callCount(), 1)
  } finally {
    ipv4.mock.restore()
    ipv6.mock.restore()
  }
})
