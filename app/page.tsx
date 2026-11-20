import { Link2 } from "lucide-react"

import { UrlPreviewComposer } from "@/components/url-preview-composer"

export default function Page() {
  return (
    <main className="flex h-dvh justify-center bg-muted/40 p-3 sm:p-6">
      <section
        aria-labelledby="preview-heading"
        className="flex w-full max-w-4xl min-w-0 flex-col overflow-hidden rounded-2xl border border-border/80 bg-card text-card-foreground shadow-sm"
      >
        <header className="flex shrink-0 items-center gap-3 border-b border-border/70 px-4 py-4 sm:px-6">
          <span className="grid size-9 shrink-0 place-items-center rounded-xl bg-muted">
            <Link2 className="size-4" aria-hidden="true" />
          </span>
          <h1
            id="preview-heading"
            className="text-base font-semibold tracking-tight"
          >
            URL Preview
          </h1>
        </header>
        <UrlPreviewComposer />
      </section>
    </main>
  )
}
