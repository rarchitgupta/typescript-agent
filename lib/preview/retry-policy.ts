export const MAX_PREVIEW_RETRIES = 3

export function previewRetryDelay(retriesSoFar: number) {
  return 1_000 * 2 ** retriesSoFar
}
