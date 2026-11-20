import assert from "node:assert/strict"
import { test } from "node:test"
import { renderToStaticMarkup } from "react-dom/server"

import { PreviewChatMessage } from "./preview-chat-message"
import type { PreviewMessage } from "@/lib/preview/chat-scheduler"

const url = "https://example.com/"
const render = (message: PreviewMessage) =>
  renderToStaticMarkup(
    <PreviewChatMessage message={message} onDelete={() => {}} />
  )

test("renders the outgoing URL and three incoming skeleton bars while loading", () => {
  const html = render({ id: 1, url, status: "loading" })
  assert.match(html, /data-align="end"/)
  assert.match(html, /https:\/\/example\.com\//)
  assert.match(html, /Loading preview/)
  assert.equal(html.match(/data-slot="skeleton"/g)?.length, 3)
})

test("links ready previews and eligible fallbacks while leaving blocked messages as text", () => {
  assert.match(
    render({
      id: 1,
      url,
      status: "ready",
      preview: {
        url,
        title: "Example title",
        description: "Example description",
        hostname: "example.com",
      },
    }),
    /href="https:\/\/example\.com\/"[\s\S]*Example title[\s\S]*Example description/
  )
  assert.match(
    render({
      id: 1,
      url,
      status: "unavailable",
      error: "Preview unavailable",
      linkUrl: url,
    }),
    /href="https:\/\/example\.com\/"[\s\S]*Preview unavailable/
  )
  assert.doesNotMatch(
    render({ id: 1, url, status: "blocked", error: "Blocked" }),
    /href=/
  )
})
