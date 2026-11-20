"use client"

import { useQueryClient } from "@tanstack/react-query"

import { normalizePreviewUrl } from "@/lib/preview/normalize-url"

const PREVIEW_TTL_MS = 5 * 60 * 1000

type Preview = {
  url: string
  hostname: string
  title: string
  description?: string
  imageUrl?: string
  faviconUrl?: string
}

export class PreviewRequestError extends Error {
  constructor(
    message: string,
    readonly status: number,
    readonly retryable = false,
    readonly linkUrl?: string
  ) {
    super(message)
    this.name = "PreviewRequestError"
  }
}

const previewKey = (url: string) => ["url-preview", url] as const

async function requestPreview(
  url: string,
  signal: AbortSignal
): Promise<Preview> {
  let response: Response
  try {
    response = await fetch("/api/preview", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ url }),
      signal,
    })
  } catch {
    signal.throwIfAborted()
    throw new PreviewRequestError("Preview unavailable", 0, true)
  }

  if (response.status === 204) {
    throw new DOMException("Preview request canceled", "AbortError")
  }
  if (response.ok) return response.json() as Promise<Preview>

  const failure = await response.json().catch(() => null)
  throw new PreviewRequestError(
    failure?.message ?? "Preview unavailable",
    response.status,
    response.status === 502 && failure?.retryable === true,
    response.status === 502 && failure?.canLink === true ? url : undefined
  )
}

export function useUrlPreview() {
  const queryClient = useQueryClient()

  return {
    getFreshPreview(input: string) {
      const url = normalizePreviewUrl(input)
      if (!url) return undefined
      const state = queryClient.getQueryState<Preview>(previewKey(url.href))
      if (
        state &&
        !state.isInvalidated &&
        Date.now() - state.dataUpdatedAt < PREVIEW_TTL_MS
      ) {
        return state.data
      }
    },

    async fetchPreview(input: string) {
      const url = normalizePreviewUrl(input)
      if (!url) {
        throw new PreviewRequestError(
          "Enter a valid URL starting with https:// or www.",
          400
        )
      }

      return queryClient.query({
        queryKey: previewKey(url.href),
        queryFn: ({ signal }) => requestPreview(url.href, signal),
        staleTime: PREVIEW_TTL_MS,
        gcTime: PREVIEW_TTL_MS,
        retry: false,
        networkMode: "always",
      })
    },

    async cancelPreview(input: string) {
      const url = normalizePreviewUrl(input)
      if (url)
        await queryClient.cancelQueries({
          queryKey: previewKey(url.href),
          exact: true,
        })
    },
  }
}
