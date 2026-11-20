import Image from "next/image"
import { ArrowUpRight, Trash2 } from "lucide-react"

import { Bubble, BubbleContent } from "@/components/ui/bubble"
import { Message, MessageGroup } from "@/components/ui/message"
import { Skeleton } from "@/components/ui/skeleton"
import { Button } from "@/components/ui/button"
import type { PreviewMessage } from "@/lib/preview/chat-scheduler"

const previewCard =
  "w-full max-w-sm overflow-hidden rounded-xl border border-border bg-background shadow-xs"

export function PreviewChatMessage({
  message,
  onDelete,
}: {
  message: PreviewMessage
  onDelete: () => void
}) {
  return (
    <MessageGroup className="gap-3">
      <Message align="end" className="items-start">
        <Bubble align="end">
          <BubbleContent className="rounded-tr-sm px-4 py-2.5 wrap-anywhere">
            {message.url}
          </BubbleContent>
        </Bubble>
        <Button
          type="button"
          variant="ghost"
          size="icon"
          className="text-muted-foreground"
          aria-label={`Delete message for ${message.url}`}
          onClick={onDelete}
        >
          <Trash2 aria-hidden="true" />
        </Button>
      </Message>
      <Message>
        {message.status === "loading" && (
          <div className={previewCard} role="status">
            <span className="sr-only">Loading preview for {message.url}</span>
            <div
              aria-hidden="true"
              className="space-y-3 p-4 motion-safe:animate-pulse"
            >
              <Skeleton className="h-4 w-3/5 animate-none rounded bg-muted-foreground/25" />
              <div className="space-y-2">
                <Skeleton className="h-2 w-full animate-none rounded bg-muted-foreground/12" />
                <Skeleton className="h-2 w-4/5 animate-none rounded bg-muted-foreground/12" />
              </div>
            </div>
          </div>
        )}

        {message.status === "ready" && (
          <a
            href={message.url}
            className={`${previewCard} block transition-colors hover:border-muted-foreground focus-visible:outline-2 focus-visible:outline-ring`}
          >
            {message.preview.imageUrl && (
              <Image
                src={message.preview.imageUrl}
                alt=""
                width={384}
                height={192}
                unoptimized
                referrerPolicy="no-referrer"
                className="aspect-2/1 w-full border-b border-border object-cover"
              />
            )}
            <div className="space-y-2 p-4">
              <div className="flex items-start justify-between gap-3">
                <p className="text-sm font-semibold wrap-anywhere">
                  {message.preview.title}
                </p>
                <ArrowUpRight
                  aria-hidden="true"
                  className="size-4 shrink-0 text-muted-foreground"
                />
              </div>
              {message.preview.description && (
                <p className="text-sm wrap-anywhere text-muted-foreground">
                  {message.preview.description}
                </p>
              )}
              <div className="flex items-center gap-2 text-xs break-all text-muted-foreground">
                {message.preview.faviconUrl && (
                  <Image
                    src={message.preview.faviconUrl}
                    alt=""
                    width={16}
                    height={16}
                    unoptimized
                    referrerPolicy="no-referrer"
                    className="size-4 shrink-0"
                  />
                )}
                {message.preview.hostname}
              </div>
            </div>
          </a>
        )}

        {message.status === "unavailable" && message.linkUrl && (
          <a
            href={message.linkUrl}
            className={`${previewCard} flex items-center justify-between gap-3 p-4 text-sm text-muted-foreground hover:border-muted-foreground focus-visible:outline-2 focus-visible:outline-ring`}
          >
            {message.error}
            <ArrowUpRight aria-hidden="true" className="size-4 shrink-0" />
          </a>
        )}

        {(message.status === "blocked" ||
          (message.status === "unavailable" && !message.linkUrl)) && (
          <p
            className={`${previewCard} p-4 text-sm text-muted-foreground`}
            role="status"
          >
            {message.error}
          </p>
        )}
      </Message>
    </MessageGroup>
  )
}
