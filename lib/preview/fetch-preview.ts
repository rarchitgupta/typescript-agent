import "server-only"

import { Resolver } from "node:dns/promises"
import { isIP } from "node:net"
import { MIMEType } from "node:util"
import { setTimeout as delay } from "node:timers/promises"
// Bun's bare undici import can substitute a client that ignores the custom dispatcher.
import { Agent, fetch } from "undici/index.js"
import ipaddr from "ipaddr.js"

import { readMetadata } from "./metadata"
import { normalizePreviewUrl } from "./normalize-url"
import { MAX_PREVIEW_RETRIES, previewRetryDelay } from "./retry-policy"

const MAX_HTML_BYTES = 512 * 1024
const MAX_REDIRECTS = 3
const ATTEMPT_TIMEOUT_MS = 5_000

type PreviewResult =
  | { status: "ready"; url: string; metadata: ReturnType<typeof readMetadata> }
  | { status: "invalid" | "blocked" | "canceled" }
  | { status: "unavailable"; url: string; retryable: boolean; canLink: boolean }

class BlockedDestination extends Error {}

async function publicAddress(url: URL, signal: AbortSignal) {
  if (url.protocol !== "https:" || url.username || url.password) {
    throw new BlockedDestination()
  }

  const host = url.hostname.replace(/^\[|\]$/g, "").replace(/\.$/, "")
  const literal = isIP(host)
  let addresses: string[]
  if (literal) {
    addresses = [host]
  } else {
    if (
      !host.includes(".") ||
      /\.(localhost|local|internal|home\.arpa|onion)$/i.test(host)
    ) {
      throw new BlockedDestination()
    }

    signal.throwIfAborted()
    const resolver = new Resolver()
    const cancel = () => resolver.cancel()
    signal.addEventListener("abort", cancel, { once: true })
    try {
      const results = await Promise.allSettled([
        resolver.resolve4(host),
        resolver.resolve6(host),
      ])
      signal.throwIfAborted()
      addresses = results.flatMap((result) => {
        if (result.status === "fulfilled") return result.value
        if (
          result.reason?.code === "ENODATA" ||
          result.reason?.code === "ENOTFOUND"
        )
          return []
        throw result.reason
      })
    } finally {
      signal.removeEventListener("abort", cancel)
    }
  }

  if (
    addresses.some((address) => ipaddr.process(address).range() !== "unicast")
  ) {
    throw new BlockedDestination()
  }
  if (!addresses.length)
    throw Object.assign(new Error("Host has no addresses"), {
      code: "ENOTFOUND",
    })
  return addresses[0]
}

async function readHtml(response: Awaited<ReturnType<typeof fetch>>) {
  if (!response.body) return undefined
  const reader = response.body.getReader()
  const chunks: Uint8Array[] = []
  let bytes = 0

  try {
    for (;;) {
      const { done, value } = await reader.read()
      if (done) return Buffer.concat(chunks, bytes)
      bytes += value.byteLength
      if (bytes > MAX_HTML_BYTES) return undefined
      chunks.push(value)
    }
  } finally {
    await reader.cancel().catch(() => {})
  }
}

function isTransient(error: unknown) {
  const cause = error instanceof Error && error.cause ? error.cause : error
  const code = (cause as NodeJS.ErrnoException | undefined)?.code
  return [
    "EAI_AGAIN",
    "ETIMEOUT",
    "ETIMEDOUT",
    "ECONNRESET",
    "ECONNREFUSED",
    "UND_ERR_CONNECT_TIMEOUT",
    "UND_ERR_HEADERS_TIMEOUT",
    "UND_ERR_BODY_TIMEOUT",
    "UND_ERR_SOCKET",
  ].includes(code ?? "")
}

export async function fetchPreviewAttempt(
  input: string,
  { signal }: { signal?: AbortSignal } = {}
): Promise<PreviewResult> {
  if (signal?.aborted) return { status: "canceled" }
  const submitted = normalizePreviewUrl(input)
  if (!submitted) return { status: "invalid" }

  const timeout = AbortSignal.timeout(ATTEMPT_TIMEOUT_MS)
  const attemptSignal = signal ? AbortSignal.any([timeout, signal]) : timeout
  let target = submitted
  let canLink = false
  const unavailable = (retryable: boolean): PreviewResult => ({
    status: "unavailable",
    url: submitted.href,
    retryable,
    canLink,
  })

  try {
    for (let redirects = 0; ; redirects++) {
      canLink = false
      const address = await publicAddress(target, attemptSignal)
      attemptSignal.throwIfAborted()
      canLink = true
      const family = isIP(address)
      // The connector must use the checked address while TLS verifies the URL hostname.
      const dispatcher = new Agent({
        connect: {
          autoSelectFamily: false,
          lookup: (_hostname, options, callback) => {
            if (options.all) callback(null, [{ address, family }])
            else callback(null, address, family)
          },
        },
      })
      try {
        const response = await fetch(target, {
          dispatcher,
          redirect: "manual",
          signal: attemptSignal,
          headers: { accept: "text/html, application/xhtml+xml" },
        })
        if ([301, 302, 303, 307, 308].includes(response.status)) {
          canLink = false
          const location = response.headers.get("location")
          if (!location || redirects === MAX_REDIRECTS)
            return unavailable(false)
          try {
            target = new URL(location, target)
          } catch {
            return unavailable(false)
          }
          continue
        }
        if (!response.ok)
          return unavailable(response.status >= 500 || response.status === 408)

        const contentType = response.headers.get("content-type")
        const mime = contentType ? new MIMEType(contentType) : undefined
        if (
          !mime ||
          !["text/html", "application/xhtml+xml"].includes(mime.essence)
        ) {
          return unavailable(false)
        }
        const html = await readHtml(response)
        attemptSignal.throwIfAborted()
        if (!html) return unavailable(false)

        return {
          status: "ready",
          url: submitted.href,
          metadata: readMetadata(
            html,
            target,
            mime.params.get("charset") ?? undefined
          ),
        }
      } finally {
        await dispatcher.destroy()
      }
    }
  } catch (error) {
    if (signal?.aborted) return { status: "canceled" }
    if (error instanceof BlockedDestination) return { status: "blocked" }
    return unavailable(timeout.aborted || isTransient(error))
  }
}

export async function fetchPreview(
  input: string,
  options: { signal?: AbortSignal } = {}
): Promise<PreviewResult> {
  for (let attempt = 0; ; attempt++) {
    const result = await fetchPreviewAttempt(input, options)
    if (options.signal?.aborted) return { status: "canceled" }
    if (
      result.status !== "unavailable" ||
      !result.retryable ||
      attempt === MAX_PREVIEW_RETRIES
    ) {
      return result
    }
    try {
      await delay(previewRetryDelay(attempt), undefined, {
        signal: options.signal,
      })
    } catch (error) {
      if (options.signal?.aborted) return { status: "canceled" }
      throw error
    }
  }
}
