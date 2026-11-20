import assert from "node:assert/strict"
import { setTimeout as delay } from "node:timers/promises"
import { test } from "node:test"

import { PreviewRequestError } from "@/hooks/use-url-preview"

import { createChatScheduler } from "./chat-scheduler"

const url = (n: number) => `https://example.com/${n}`
const preview = (url: string) => ({ url, hostname: "example.com", title: url })

function setup() {
  const attempts: string[] = []
  const canceled: string[] = []
  const requests = new Map<
    string,
    PromiseWithResolvers<ReturnType<typeof preview>>
  >()
  const cache = new Map<string, ReturnType<typeof preview>>()
  const scheduler = createChatScheduler({
    getFreshPreview: (url) => cache.get(url),
    fetchPreview(url) {
      attempts.push(url)
      const request = Promise.withResolvers<ReturnType<typeof preview>>()
      requests.set(url, request)
      return request.promise
    },
    async cancelPreview(url) {
      canceled.push(url)
    },
  })

  function submit(url: string) {
    const result = scheduler.submit(url)
    assert.equal(result.accepted, true)
    return result.id
  }

  return { scheduler, attempts, canceled, requests, cache, submit }
}

test("caps active attempts and pending messages and keeps submission order", async () => {
  const { scheduler, attempts, requests, cache, submit } = setup()
  for (let i = 0; i < 10; i++) submit(url(i))

  assert.deepEqual(attempts, [url(0), url(1), url(2)])
  assert.equal(scheduler.isFull(), true)
  assert.equal(scheduler.submit(url(10)).accepted, false)
  assert.equal(scheduler.submit(url(0)).accepted, false)

  cache.set(url(11), preview(url(11)))
  const cached = submit(url(11))
  assert.equal(scheduler.getSnapshot().at(-1)?.status, "ready")
  scheduler.deleteMessage(cached)
  submit(url(11))
  assert.equal(scheduler.getSnapshot().at(-1)?.status, "ready")

  requests.get(url(1))!.resolve(preview(url(1)))
  await Promise.resolve()
  assert.equal(scheduler.isFull(), false)
  assert.deepEqual(attempts, [url(0), url(1), url(2), url(3)])
  assert.deepEqual(
    scheduler
      .getSnapshot()
      .slice(0, 3)
      .map(({ url, status }) => [url, status]),
    [
      [url(0), "loading"],
      [url(1), "ready"],
      [url(2), "loading"],
    ]
  )
})

test("shares duplicate work and cancels only after the last waiting message is deleted", async () => {
  const { scheduler, attempts, canceled, requests, submit } = setup()
  const first = submit(url(0))
  const second = submit(url(0))
  assert.deepEqual(attempts, [url(0)])

  scheduler.deleteMessage(first)
  assert.deepEqual(canceled, [])
  assert.equal(scheduler.getSnapshot()[0].status, "loading")
  scheduler.deleteMessage(second)
  assert.deepEqual(canceled, [url(0)])

  submit(url(0))
  const late = requests.get(url(0))!
  scheduler.deleteMessage(scheduler.getSnapshot()[0].id)
  assert.deepEqual(scheduler.getSnapshot(), [])
  late.resolve(preview(url(0)))
  await Promise.resolve()
  assert.deepEqual(scheduler.getSnapshot(), [])
})

test("releases its slot during backoff and resolves every waiting duplicate after a retry", async () => {
  const { scheduler, attempts, requests, submit } = setup()
  for (let i = 0; i < 4; i++) submit(url(i))
  submit(url(0))
  requests
    .get(url(0))!
    .reject(new PreviewRequestError("Temporary failure", 502, true))
  await Promise.resolve()

  assert.deepEqual(attempts, [url(0), url(1), url(2), url(3)])
  requests.get(url(3))!.resolve(preview(url(3)))
  await delay(1_050)
  assert.equal(attempts.at(-1), url(0))
  requests.get(url(0))!.resolve(preview(url(0)))
  await Promise.resolve()
  assert.deepEqual(
    scheduler
      .getSnapshot()
      .filter((message) => message.url === url(0))
      .map((message) => message.status),
    ["ready", "ready"]
  )
})

test("removes queued work and cancels a scheduled retry on deletion", async () => {
  const { scheduler, attempts, canceled, requests, submit } = setup()
  const retrying = submit(url(0))
  submit(url(1))
  submit(url(2))
  const queued = submit(url(3))
  scheduler.deleteMessage(queued)

  requests
    .get(url(0))!
    .reject(new PreviewRequestError("Temporary failure", 502, true))
  await Promise.resolve()
  scheduler.deleteMessage(retrying)
  await delay(1_050)
  assert.deepEqual(attempts, [url(0), url(1), url(2)])
  assert.deepEqual(canceled, [])
})

test(
  "exhausts three retries and preserves the fallback link while other requests finish",
  { timeout: 10_000 },
  async () => {
    const { scheduler, attempts, requests, submit } = setup()
    submit(url(0))
    submit(url(1))
    const failure = new PreviewRequestError(
      "Preview unavailable",
      502,
      true,
      url(0)
    )

    requests.get(url(1))!.resolve(preview(url(1)))
    for (const backoff of [1_000, 2_000, 4_000]) {
      requests.get(url(0))!.reject(failure)
      await Promise.resolve()
      assert.equal(scheduler.getSnapshot()[0].status, "loading")
      await delay(backoff + 25)
    }
    requests.get(url(0))!.reject(failure)
    await Promise.resolve()

    assert.equal(attempts.filter((attempt) => attempt === url(0)).length, 4)
    assert.deepEqual(scheduler.getSnapshot(), [
      {
        id: 1,
        url: url(0),
        status: "unavailable",
        error: "Preview unavailable",
        linkUrl: url(0),
      },
      { id: 2, url: url(1), status: "ready", preview: preview(url(1)) },
    ])
  }
)
