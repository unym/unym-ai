import type { Entity, EntityType } from "../types"

interface RegexPattern {
  type: EntityType
  pattern: RegExp
  validate?: (match: string) => boolean
}

// ---------------------------------------------------------------------------
// Validation helpers
// ---------------------------------------------------------------------------

function luhnCheck(value: string): boolean {
  const digits = value.replace(/\D/g, "")
  let sum = 0
  let isOdd = false
  for (let i = digits.length - 1; i >= 0; i--) {
    let digit = parseInt(digits[i]!, 10)
    if (isOdd) {
      digit *= 2
      if (digit > 9) digit -= 9
    }
    sum += digit
    isOdd = !isOdd
  }
  return sum % 10 === 0
}

function ibanCheck(iban: string): boolean {
  const normalized = iban.replace(/[\s-]/g, "").toUpperCase()
  if (normalized.length < 15 || normalized.length > 34) return false
  const rearranged = normalized.slice(4) + normalized.slice(0, 4)
  const numeric = rearranged
    .split("")
    .map((c) => (c >= "A" && c <= "Z" ? (c.charCodeAt(0) - 55).toString() : c))
    .join("")
  let remainder = 0
  for (const chunk of numeric.match(/.{1,9}/g) ?? []) {
    remainder = parseInt(`${remainder}${chunk}`, 10) % 97
  }
  return remainder === 1
}

function nirCheck(value: string): boolean {
  const digits = value.replace(/[\s]/g, "")
  if (!/^\d{15}$/.test(digits)) return false
  const number = BigInt(digits.slice(0, 13))
  const key = parseInt(digits.slice(13), 10)
  return 97 - Number(number % 97n) === key
}

function dniCheck(value: string): boolean {
  const letters = "TRWAGMYFPDXBNJZSQVHLCKE"
  const match = value.match(/^(\d{8})([A-Z])$/)
  if (!match) return false
  return letters[parseInt(match[1]!, 10) % 23] === match[2]
}

function nieCheck(value: string): boolean {
  const letters = "TRWAGMYFPDXBNJZSQVHLCKE"
  const match = value.match(/^([XYZ])(\d{7})([A-Z])$/)
  if (!match) return false
  const prefix = { X: "0", Y: "1", Z: "2" }[match[1]!]!
  return letters[parseInt(`${prefix}${match[2]}`, 10) % 23] === match[3]
}

function personalausweisCheck(value: string): boolean {
  const upper = value.toUpperCase()
  if (upper.length !== 10) return false
  const weights = [7, 3, 1]
  let sum = 0
  for (let i = 0; i < 9; i++) {
    const c = upper[i]!
    const val = c >= "A" && c <= "Z" ? c.charCodeAt(0) - 55 : parseInt(c, 10)
    if (isNaN(val)) return false
    sum += val * weights[i % 3]!
  }
  return sum % 10 === parseInt(upper[9]!, 10)
}

function codiceFiscaleCheck(value: string): boolean {
  const pattern =
    /^[A-Z]{6}[0-9]{2}[ABCDEHLMPRST][0-9]{2}[A-Z][0-9]{3}[A-Z]$/i
  return pattern.test(value)
}

function nifCheck(value: string): boolean {
  if (!/^\d{9}$/.test(value)) return false
  const weights = [9, 8, 7, 6, 5, 4, 3, 2]
  const sum = weights.reduce(
    (acc, w, i) => acc + w * parseInt(value[i]!, 10),
    0
  )
  const check = 11 - (sum % 11)
  const expected = check >= 10 ? 0 : check
  return parseInt(value[8]!, 10) === expected
}

// ---------------------------------------------------------------------------
// Patterns
// ---------------------------------------------------------------------------

const PATTERNS: RegexPattern[] = [
  // EMAIL — RFC 5322 simplified
  {
    type: "EMAIL",
    pattern:
      /\b[a-zA-Z0-9._%+\-]+@[a-zA-Z0-9.\-]+\.[a-zA-Z]{2,}\b/g,
  },

  // PHONE — International: FR(+33), UK(+44), US(+1), DE(+49), ES(+34), IT(+39), PT(+351)
  {
    type: "PHONE",
    pattern:
      /(?:\+|00)(?:33|44|1|49|34|39|351)\s?(?:\(0\)\s?)?(?:\d[\s.\-]?){6,12}\d/g,
  },

  // PHONE — FR local (0X XX XX XX XX), e.g. 06 12 34 56 78
  {
    type: "PHONE",
    pattern: /\b0[1-9](?:[\s.\-]?\d{2}){4}\b/g,
  },

  // FINANCIAL — Credit cards: Visa (16d, starts 4), Mastercard (16d, starts 51-55/2221-2720), Amex (15d, starts 34/37)
  {
    type: "FINANCIAL",
    pattern:
      /\b(?:4[0-9]{3}[\s\-]?[0-9]{4}[\s\-]?[0-9]{4}[\s\-]?[0-9]{4}|(?:5[1-5][0-9]{2}|2(?:2[2-9][1-9]|[3-6][0-9]{2}|7[01][0-9]|720))[0-9]{0,1}[\s\-]?[0-9]{4}[\s\-]?[0-9]{4}[\s\-]?[0-9]{4}|3[47][0-9]{2}[\s\-]?[0-9]{6}[\s\-]?[0-9]{5})\b/g,
    validate: luhnCheck,
  },

  // IBAN — FR, DE, ES, IT, PT, GB (with checksum)
  {
    type: "FINANCIAL",
    pattern:
      /\b(?:FR|DE|ES|IT|PT|GB)[0-9]{2}[A-Z0-9]{11,27}\b/g,
    validate: ibanCheck,
  },

  // NATIONAL_ID — French NIR/INSEE (15 digits with optional spaces)
  // Corsican departments 2A and 2B are substituted to 19 and 20 before checksum
  {
    type: "NATIONAL_ID",
    pattern:
      /\b[12]\s?\d{2}\s?\d{2}\s?(?:\d{2}|2A|2B)\s?\d{3}\s?\d{3}\s?\d{2}\b/g,
    validate: (v) =>
      nirCheck(v.replace(/2A/gi, "19").replace(/2B/gi, "20").replace(/[^0-9]/g, "")),
  },

  // NATIONAL_ID — German Personalausweis (1 letter + 4 digits + 4 alphanumeric + 1 check digit)
  {
    type: "NATIONAL_ID",
    pattern: /\b[A-Z][0-9]{4}[A-Z0-9]{4}[0-9]\b/g,
    validate: personalausweisCheck,
  },

  // NATIONAL_ID — Spanish DNI (8 digits + check letter)
  {
    type: "NATIONAL_ID",
    pattern: /\b\d{8}[A-Z]\b/g,
    validate: dniCheck,
  },

  // NATIONAL_ID — Spanish NIE (X/Y/Z + 7 digits + check letter)
  {
    type: "NATIONAL_ID",
    pattern: /\b[XYZ]\d{7}[A-Z]\b/g,
    validate: nieCheck,
  },

  // NATIONAL_ID — Italian Codice Fiscale (16 chars)
  {
    type: "NATIONAL_ID",
    pattern: /\b[A-Z]{6}[0-9]{2}[ABCDEHLMPRST][0-9]{2}[A-Z][0-9]{3}[A-Z]\b/gi,
    validate: codiceFiscaleCheck,
  },

  // NATIONAL_ID — Portuguese NIF (9 digits with check)
  {
    type: "NATIONAL_ID",
    pattern: /\b[1-9]\d{8}\b/g,
    validate: nifCheck,
  },

  // IP_ADDRESS — IPv4
  {
    type: "IP_ADDRESS",
    pattern:
      /\b(?:(?:25[0-5]|2[0-4]\d|[01]?\d\d?)\.){3}(?:25[0-5]|2[0-4]\d|[01]?\d\d?)\b/g,
  },

  // IP_ADDRESS — IPv6 (full and compressed forms, including ::1 loopback)
  {
    type: "IP_ADDRESS",
    pattern:
      /\b(?:[0-9a-fA-F]{1,4}:){7}[0-9a-fA-F]{1,4}\b|\b(?:[0-9a-fA-F]{1,4}:){1,7}:\b|(?<![0-9a-fA-F:])::(?:[0-9a-fA-F]{1,4}:){0,6}[0-9a-fA-F]{1,4}\b|\b(?:[0-9a-fA-F]{1,4}:){1,6}:[0-9a-fA-F]{1,4}\b|\b(?:[0-9a-fA-F]{1,4}:){1,5}(?::[0-9a-fA-F]{1,4}){1,2}\b/g,
  },
]

// ---------------------------------------------------------------------------
// Detector
// ---------------------------------------------------------------------------

export function detectWithRegex(text: string): Entity[] {
  const entities: Entity[] = []

  for (const { type, pattern, validate } of PATTERNS) {
    // Reset lastIndex for global patterns
    pattern.lastIndex = 0
    for (const match of text.matchAll(pattern)) {
      if (validate && !validate(match[0])) continue
      entities.push({
        type,
        value: match[0],
        startIndex: match.index!,
        endIndex: match.index! + match[0].length,
        confidence: 1.0,
        source: "regex",
      })
    }
  }

  // Sort by startIndex; remove exact duplicates (same span from overlapping patterns)
  entities.sort((a, b) => a.startIndex - b.startIndex)
  return deduplicateExact(entities)
}

function deduplicateExact(entities: Entity[]): Entity[] {
  const seen = new Set<string>()
  return entities.filter((e) => {
    const key = `${e.startIndex}-${e.endIndex}-${e.type}`
    if (seen.has(key)) return false
    seen.add(key)
    return true
  })
}
