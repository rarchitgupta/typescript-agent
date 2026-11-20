import assert from "node:assert/strict"
import { Resolver } from "node:dns/promises"
import { mock, test } from "node:test"

import { POST } from "./route"

function request(body: string, signal?: AbortSignal) {
  return new Request("https://example.com/api/preview", {
    method: "POST",
    headers: { "content-type": "application/json" },
    body,
    signal,
  })
}

test("rejects malformed JSON, missing or non-string URLs, and unsupported URLs", async () => {
  for (const body of [
    "{",
    "{}",
    '{"url":42}',
    '{"url":"http://example.com"}',
  ]) {
    const response = await POST(request(body))
    assert.equal(response.status, 400)
    assert.equal(typeof (await response.json()).message, "string")
  }
})

test("returns 403 without a link for a blocked destination", async () => {
  const response = await POST(request('{"url":"https://127.0.0.1"}'))
  assert.equal(response.status, 403)
  assert.deepEqual(await response.json(), {
    message: "This URL points to a blocked destination.",
  })
})

test("returns retry and link eligibility when a preview is unavailable", async () => {
  const ipv4 = mock.method(Resolver.prototype, "resolve4", async () => {
    throw Object.assign(new Error("Temporary DNS failure"), {
      code: "ETIMEOUT",
    })
  })
  const ipv6 = mock.method(Resolver.prototype, "resolve6", async () => [])
  try {
    const response = await POST(request('{"url":"www.example.com"}'))
    assert.equal(response.status, 502)
    assert.deepEqual(await response.json(), {
      message: "Preview unavailable",
      url: "https://www.example.com/",
      canLink: false,
      retryable: true,
    })
    assert.equal(ipv4.mock.callCount(), 1)
  } finally {
    ipv4.mock.restore()
    ipv6.mock.restore()
  }
})

test("returns an empty response when the request is canceled", async () => {
  const response = await POST(
    request('{"url":"https://example.com"}', AbortSignal.abort())
  )
  assert.equal(response.status, 204)
  assert.equal(await response.text(), "")
})
