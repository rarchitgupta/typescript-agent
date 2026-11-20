import { loadBuffer } from "cheerio"

export function readMetadata(html: Buffer, pageUrl: URL, charset?: string) {
  const $ = loadBuffer(html, {
    encoding: { transportLayerEncodingLabel: charset },
  })
  const value = (selector: string, attribute: string) =>
    $(selector).first().attr(attribute)?.trim() || undefined

  function assetUrl(raw: string | undefined) {
    if (!raw) return undefined
    try {
      const url = new URL(raw, pageUrl)
      if (url.protocol === "https:" && !url.username && !url.password) {
        return url.href
      }
    } catch {
      return undefined
    }
  }

  return {
    hostname: pageUrl.hostname,
    title:
      value('meta[property="og:title"]', "content") ||
      $("title").first().text().trim() ||
      pageUrl.hostname,
    description:
      value('meta[property="og:description"]', "content") ||
      value('meta[name="description"]', "content"),
    imageUrl: assetUrl(value('meta[property="og:image"]', "content")),
    faviconUrl: assetUrl(value('link[rel~="icon"]', "href")),
  }
}
