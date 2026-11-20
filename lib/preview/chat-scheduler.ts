import {
  PreviewRequestError,
  type useUrlPreview,
} from "@/hooks/use-url-preview"

import { normalizePreviewUrl } from "./normalize-url"
import { MAX_PREVIEW_RETRIES, previewRetryDelay } from "./retry-policy"

const MAX_ACTIVE_ATTEMPTS = 3
const MAX_PENDING_MESSAGES = 10
export const PREVIEW_QUEUE_FULL_MESSAGE =
  "Wait for a preview to finish or delete a pending message."

type PreviewSource = ReturnType<typeof useUrlPreview>
type Preview = Awaited<ReturnType<PreviewSource["fetchPreview"]>>

type MessageResult =
  | { status: "loading" }
  | { status: "ready"; preview: Preview }
  | { status: "blocked"; error: string }
  | { status: "unavailable"; error: string; linkUrl?: string }

export type PreviewMessage = { id: number; url: string } & MessageResult

type Submission =
  { accepted: true; id: number } | { accepted: false; error: string }

type Job = {
  url: string
  retries: number
  active: boolean
  retryTimer?: ReturnType<typeof setTimeout>
}

export function createChatScheduler(source: PreviewSource) {
  const listeners = new Set<() => void>()
  const jobs = new Map<string, Job>()
  const queue: Job[] = []
  let messages: readonly PreviewMessage[] = []
  let activeAttempts = 0
  let nextId = 0

  function notify() {
    listeners.forEach((listener) => listener())
  }

  function complete(job: Job, result: MessageResult) {
    jobs.delete(job.url)
    messages = messages.map((message) =>
      message.url === job.url && message.status === "loading"
        ? { id: message.id, url: message.url, ...result }
        : message
    )
    notify()
  }

  async function run(job: Job) {
    try {
      const preview = await source.fetchPreview(job.url)
      if (jobs.get(job.url) === job) complete(job, { status: "ready", preview })
    } catch (error) {
      if (jobs.get(job.url) !== job) return

      const failure = error instanceof PreviewRequestError ? error : undefined
      if (failure?.retryable && job.retries < MAX_PREVIEW_RETRIES) {
        job.retryTimer = setTimeout(() => {
          job.retryTimer = undefined
          queue.push(job)
          drain()
        }, previewRetryDelay(job.retries++))
      } else if (failure?.status === 403) {
        complete(job, { status: "blocked", error: failure.message })
      } else {
        complete(job, {
          status: "unavailable",
          error: failure?.message ?? "Preview unavailable",
          linkUrl: failure?.linkUrl,
        })
      }
    } finally {
      job.active = false
      activeAttempts--
      drain()
    }
  }

  function drain() {
    while (activeAttempts < MAX_ACTIVE_ATTEMPTS && queue.length) {
      const job = queue.shift()!
      job.active = true
      activeAttempts++
      void run(job)
    }
  }

  function isFull() {
    return (
      messages.filter((message) => message.status === "loading").length >=
      MAX_PENDING_MESSAGES
    )
  }

  return {
    isFull,
    getSnapshot: () => messages,

    subscribe(listener: () => void) {
      listeners.add(listener)
      return () => {
        listeners.delete(listener)
      }
    },

    submit(input: string): Submission {
      const normalized = normalizePreviewUrl(input)
      if (!normalized) {
        return {
          accepted: false,
          error: "Enter a valid URL starting with https:// or www.",
        }
      }

      const url = normalized.href
      const cached = source.getFreshPreview(url)
      if (!cached && isFull()) {
        return { accepted: false, error: PREVIEW_QUEUE_FULL_MESSAGE }
      }

      const id = ++nextId
      const result: MessageResult = cached
        ? { status: "ready", preview: cached }
        : { status: "loading" }
      messages = [...messages, { id, url, ...result }]
      if (result.status === "loading" && !jobs.has(url)) {
        const job = { url, retries: 0, active: false }
        jobs.set(url, job)
        queue.push(job)
      }
      notify()
      drain()
      return { accepted: true, id }
    },

    deleteMessage(id: number) {
      const removed = messages.find((message) => message.id === id)
      if (!removed) return

      messages = messages.filter((message) => message.id !== id)
      const job = jobs.get(removed.url)
      if (
        removed.status === "loading" &&
        job &&
        !messages.some(
          (message) =>
            message.url === removed.url && message.status === "loading"
        )
      ) {
        jobs.delete(job.url)
        clearTimeout(job.retryTimer)
        const queued = queue.indexOf(job)
        if (queued !== -1) queue.splice(queued, 1)
        if (job.active) void source.cancelPreview(job.url)
      }
      notify()
    },
  }
}
