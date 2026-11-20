import assert from "node:assert/strict"
import { test } from "node:test"

import { urlPreviewFormSchema } from "./url-preview-composer"

test("normalizes supported URL forms", () => {
  assert.deepEqual(
    urlPreviewFormSchema.parse({ url: " www.example.com/path#section " }),
    {
      url: "https://www.example.com/path#section",
    }
  )
  assert.deepEqual(urlPreviewFormSchema.parse({ url: "https://example.com" }), {
    url: "https://example.com/",
  })
})

test("provides field errors for missing, malformed, and unsupported URLs", () => {
  for (const url of [
    "",
    "example.com",
    "http://example.com",
    "https:///example.com",
    "www.",
  ]) {
    const result = urlPreviewFormSchema.safeParse({ url })
    assert.equal(result.success, false)
    assert.equal(result.error?.issues[0].path[0], "url")
  }
})
