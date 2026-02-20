import * as Sentry from "@sentry/nextjs"

Sentry.init({
  dsn: process.env.NEXT_PUBLIC_SENTRY_DSN,

  // Lower sample rate — we're free tier MVP
  tracesSampleRate: 0.1,

  // Only enable in production
  enabled: process.env.NODE_ENV === "production",

  /**
   * NFR23: Strip any potential PII from error reports before sending.
   * unym handles sensitive AI prompts — nothing user-authored should
   * ever appear in error payloads.
   */
  beforeSend(event) {
    // Remove request body — may contain AI prompts or user-authored text
    if (event.request) {
      delete event.request.data
      delete event.request.cookies
      if (event.request.headers) {
        // Retain only non-sensitive headers
        const { authorization, cookie, ...safeHeaders } = event.request.headers as Record<string, string>
        void authorization
        void cookie
        event.request.headers = safeHeaders
      }
    }

    // Strip user identity fields (keep only anonymized id if present)
    if (event.user) {
      event.user = { id: event.user.id }
    }

    // Clear breadcrumbs — may capture user input in console/fetch/xhr logs
    delete event.breadcrumbs

    // Strip extra context that could contain user content
    delete event.extra

    return event
  },
})
