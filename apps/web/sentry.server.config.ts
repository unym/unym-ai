import * as Sentry from "@sentry/nextjs"

Sentry.init({
  dsn: process.env.SENTRY_DSN,

  tracesSampleRate: 0.1,

  enabled: process.env.NODE_ENV === "production",

  /**
   * NFR23: Strip any potential PII from error reports before sending.
   * Server-side requests may contain user prompts in request bodies.
   */
  beforeSend(event) {
    // Remove request body — may contain AI prompts or user-authored text
    if (event.request) {
      delete event.request.data
      delete event.request.cookies
      if (event.request.headers) {
        const { authorization, cookie, ...safeHeaders } = event.request.headers as Record<string, string>
        void authorization
        void cookie
        event.request.headers = safeHeaders
      }
    }

    // Strip user identity (keep only anonymized id)
    if (event.user) {
      event.user = { id: event.user.id }
    }

    // Clear breadcrumbs — may capture user input in console/fetch/xhr logs
    delete event.breadcrumbs

    delete event.extra

    return event
  },
})
