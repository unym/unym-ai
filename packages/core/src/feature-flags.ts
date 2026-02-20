/**
 * Feature flags for the unym application.
 * All flags are static at MVP — no runtime configuration.
 */
export const flags = {
  nerModelEnabled: true,
  autoAnonymizeDefault: false,
  sendInterceptionEnabled: true,
  responseDeAnonymization: true,
  debugOverlay: false,
} as const

export type Flags = typeof flags
