"use client"

import { useState, useSyncExternalStore } from "react"
import { zodResolver } from "@hookform/resolvers/zod"
import { MessageScroller } from "@shadcn/react/message-scroller"
import { Send } from "lucide-react"
import { useForm } from "react-hook-form"
import { z } from "zod"

import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { PreviewChatMessage } from "@/components/preview-chat-message"
import { useUrlPreview } from "@/hooks/use-url-preview"
import {
  createChatScheduler,
  PREVIEW_QUEUE_FULL_MESSAGE,
} from "@/lib/preview/chat-scheduler"
import { normalizePreviewUrl } from "@/lib/preview/normalize-url"

export const urlPreviewFormSchema = z.object({
  url: z.string().transform((input, ctx) => {
    const url = normalizePreviewUrl(input)
    if (url) return url.href

    ctx.addIssue({
      code: "custom",
      message: input.trim()
        ? "Enter a valid URL starting with https:// or www."
        : "Enter a URL.",
    })
    return z.NEVER
  }),
})

export function UrlPreviewComposer() {
  const previewSource = useUrlPreview()
  const [scheduler] = useState(() => createChatScheduler(previewSource))
  const messages = useSyncExternalStore(
    scheduler.subscribe,
    scheduler.getSnapshot,
    scheduler.getSnapshot
  )
  const queueFull = scheduler.isFull()
  const {
    register,
    handleSubmit,
    reset,
    setError,
    formState: { errors },
  } = useForm({
    defaultValues: { url: "" },
    resolver: zodResolver(urlPreviewFormSchema),
  })
  const urlField = register("url")

  return (
    <div className="flex min-h-0 flex-1 flex-col">
      <MessageScroller.Provider autoScroll>
        <MessageScroller.Root className="relative flex min-h-0 flex-1 flex-col">
          <MessageScroller.Viewport className="min-h-0 flex-1 overflow-y-auto">
            <MessageScroller.Content className="flex flex-col gap-8 px-4 py-5 sm:px-6">
              {messages.map((message) => (
                <MessageScroller.Item
                  key={message.id}
                  messageId={String(message.id)}
                >
                  <PreviewChatMessage
                    message={message}
                    onDelete={() => scheduler.deleteMessage(message.id)}
                  />
                </MessageScroller.Item>
              ))}
            </MessageScroller.Content>
          </MessageScroller.Viewport>
        </MessageScroller.Root>
      </MessageScroller.Provider>
      <form
        className="shrink-0 border-t border-border/70 px-4 py-4 sm:px-6 sm:py-5"
        noValidate
        onSubmit={handleSubmit(({ url }) => {
          const result = scheduler.submit(url)
          if (result.accepted) reset()
          else if (result.error !== PREVIEW_QUEUE_FULL_MESSAGE) {
            setError("url", { message: result.error })
          }
        })}
      >
        <label htmlFor="preview-url" className="mb-2 block text-sm font-medium">
          Website URL
        </label>
        <div className="flex gap-2">
          <Input
            {...urlField}
            id="preview-url"
            type="text"
            inputMode="url"
            autoCapitalize="none"
            spellCheck={false}
            disabled={queueFull}
            placeholder="https://example.com"
            className="h-11 grow bg-background px-3"
            aria-invalid={Boolean(errors.url)}
            aria-describedby={
              queueFull
                ? "preview-queue-status"
                : errors.url
                  ? "preview-url-error"
                  : undefined
            }
          />
          <Button
            type="submit"
            disabled={queueFull}
            className="h-11 shrink-0 px-4"
          >
            <Send aria-hidden="true" />
            Send
          </Button>
        </div>
        {errors.url && (
          <p
            id="preview-url-error"
            role="alert"
            className="mt-2 text-sm text-destructive"
          >
            {errors.url.message}
          </p>
        )}
        {queueFull && (
          <p
            id="preview-queue-status"
            role="status"
            className="mt-2 text-sm text-muted-foreground"
          >
            {PREVIEW_QUEUE_FULL_MESSAGE}
          </p>
        )}
      </form>
    </div>
  )
}
