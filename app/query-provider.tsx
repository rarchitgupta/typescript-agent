"use client"

import {
  environmentManager,
  QueryClient,
  QueryClientProvider,
} from "@tanstack/react-query"
import type { ReactNode } from "react"

let browserQueryClient: QueryClient | undefined

export function QueryProvider({ children }: { children: ReactNode }) {
  const queryClient = environmentManager.isServer()
    ? new QueryClient()
    : (browserQueryClient ??= new QueryClient())

  return (
    <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
  )
}
