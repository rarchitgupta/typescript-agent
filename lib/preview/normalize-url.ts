export function normalizePreviewUrl(input: string) {
  const raw = input.trim()
  if (
    !/^(https:\/\/|www\.)[^/\\?#\s]/i.test(raw) ||
    /[\\\s\u0000-\u001f\u007f]/.test(raw)
  ) {
    return undefined
  }
  try {
    const url = new URL(/^www\./i.test(raw) ? `https://${raw}` : raw)
    if (url.protocol === "https:" && !url.username && !url.password) return url
  } catch {
    return undefined
  }
}
