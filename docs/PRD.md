# Rich URL Preview App

**Status** — Final

## Overview and Goals

A single chat-style interface lets users submit URLs and see rich previews they can click to visit. The MVP is for anyone who wants to see what a link points to before opening it.

## Core User Workflows

1. Submit an HTTPS URL or a URL beginning with `www.`. A valid submission immediately appears as a loading message. An invalid submission shows a clear input error.
2. Keep submitting URLs while earlier previews load. Messages stay in submission order regardless of completion order.
3. Open the submitted URL from a preview card, including a fallback card, once the destination has passed safety checks.
4. Delete any message. It disappears immediately, and deleting the last message awaiting a shared request cancels that request.

## Features and Scope

| Priority | Scope |
| --- | --- |
| Must-have | One chat with multiple messages, non-blocking submissions, rich previews, per-message loading and failure states, deletion, request sharing, five-minute in-memory caching, and destination safety checks |
| Nice-to-have | None identified |
| Out of scope | Multiple chats, persistent storage, crawling beyond the target HTML response, and rendering pages or executing their scripts |

## Entities and Data Models

| Entity | Fields and constraints |
| --- | --- |
| Message | Unique ID, normalized URL, submission position, and status of loading, ready, unavailable, or blocked. Each submission creates its own message, including duplicate URLs. |
| Preview metadata | Required hostname and display title. Optional description, image URL, and favicon URL. |
| Cache entry | Normalized URL, successful metadata result, and expiry five minutes after the result is obtained. Stored in memory. |
| In-flight request | One pending fetch per normalized URL, shared by messages awaiting that URL in the chat. |

## Retry and Queue Behavior

- Allow up to three automatic retries after the initial attempt for transient failures such as timeouts, temporary connection errors, and upstream server errors. Use exponential backoff. The delays are 1, 2, and 4 seconds.
- Validation errors, blocked destinations, and permanent fetch failures end immediately. During backoff, the message stays loading. When retries are exhausted, show **Preview unavailable** and leave the cache empty for that URL.
- Duplicate submissions share the same queued fetch or retry sequence. Deleting its last waiting message removes queued work or cancels the active fetch or retry timer.
- The limits are three concurrent fetch attempts and ten pending messages total, including messages waiting in the queue or in backoff. With three distinct URLs actively fetching, this leaves room for up to seven more pending messages. Cached previews render immediately and bypass the pending-message limit.
- Queue initial fetches in submission order. A request in backoff releases its concurrency slot and rejoins the queue when its delay ends. When the pending-message limit is reached, show an inline message asking the user to wait or delete a pending message. Keep their input and add no loading card.

## Business Rules and Validation

- Accept well-formed `https://` URLs and inputs starting with `www.`. Prepend `https://` to the latter. Reject malformed URLs and other input forms with a clear explanation.
- Fetch the target HTML and derive the preview from Open Graph tags and other page metadata. Display the hostname and use it as the title when the title is missing. Omit missing descriptions, images, and favicons.
- Treat HTML that yields only the hostname fallback as a successful preview. If metadata retrieval fails for a destination that passed safety checks, show a clickable **Preview unavailable** card. One failure affects only messages waiting on that request.
- Block internal and private destinations before making a network request to them, including targets reached through redirects or host resolution. A blocked submission shows a clear error without a clickable link.
- Use fresh cached metadata for repeated normalized URLs. On expiry, fetch again, sharing any already pending request for that URL. Cache successful results only.
- Deleting one waiting message leaves a shared request running for the other waiting messages. Deleting the last waiting message aborts the request, stops further fetch activity for it, and discards any late result. Deleting a message after a successful fetch preserves the cached result until expiry.

## API Endpoints and Expected Behavior

| Method and endpoint | Request | Expected response |
| --- | --- | --- |
| `POST /api/preview` | JSON body with a required string `url` | `200` with normalized URL, hostname, title, and available description, image URL, and favicon URL |
| Same endpoint | Missing, malformed, or unsupported URL | `400` with a user-facing validation message |
| Same endpoint | Destination fails safety checks | `403` with a user-facing blocked-destination message |
| Same endpoint | Metadata retrieval fails after safety checks | `502` with a user-facing unavailable message for the clickable fallback card |

A canceled request has no user-visible result. Message deletion is an action in the single chat and needs no separate endpoint in this contract.

## Acceptance Criteria

- [ ] Submitting an HTTPS page with complete metadata shows a clickable card with its title, description, image, hostname, and favicon.
- [ ] A `www.` input becomes HTTPS. Malformed URLs, bare domains without `www.`, and HTTP URLs show clear input errors.
- [ ] Two URLs can load concurrently. If the second finishes first, its preview updates in place while both messages retain submission order.
- [ ] HTML missing metadata shows the hostname as the fallback title and omits missing optional fields. A retrieval failure after safety checks shows a clickable **Preview unavailable** card while unrelated previews continue.
- [ ] An internal or private destination, including one reached through a redirect or host resolution, shows a blocked error without a link or an outbound request to that destination.
- [ ] Two pending submissions for the same normalized URL share one fetch and each get their own card. Deleting one leaves the other loading.
- [ ] Deleting the last waiting message aborts the fetch. A late result never renders a card or populates the cache.
- [ ] A successful result is reused within five minutes even after its message is deleted. A submission at or after expiry fetches again. A failed fetch can be retried immediately.
- [ ] A transient failure triggers up to three retries with increasing delays. A successful retry resolves all waiting messages, and exhaustion shows the fallback. Deleting the last waiting message during backoff prevents further attempts.
- [ ] At most three fetch attempts run concurrently. An uncached submission beyond ten pending messages leaves the input intact and adds no card. A cached submission still renders immediately.
