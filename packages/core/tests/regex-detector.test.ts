import { describe, it, expect } from "vitest"
import { detectWithRegex } from "../src/detector/regex-detector"

// ---------------------------------------------------------------------------
// Email
// ---------------------------------------------------------------------------
describe("Email detection", () => {
  it("detects a standard email", () => {
    const result = detectWithRegex("Contact me at user@example.com for details.")
    const emails = result.filter((e) => e.type === "EMAIL")
    expect(emails).toHaveLength(1)
    expect(emails[0]!.value).toBe("user@example.com")
    expect(emails[0]!.source).toBe("regex")
    expect(emails[0]!.confidence).toBe(1.0)
  })

  it("detects email with plus sign", () => {
    const result = detectWithRegex("Send to user+tag@sub.domain.org")
    expect(result.filter((e) => e.type === "EMAIL")).toHaveLength(1)
  })

  it("does not detect invalid email (no TLD)", () => {
    const result = detectWithRegex("not-an-email@")
    expect(result.filter((e) => e.type === "EMAIL")).toHaveLength(0)
  })

  it("does not detect bare @ sign", () => {
    const result = detectWithRegex("hello @ world")
    expect(result.filter((e) => e.type === "EMAIL")).toHaveLength(0)
  })
})

// ---------------------------------------------------------------------------
// Phone numbers
// ---------------------------------------------------------------------------
describe("Phone detection — FR", () => {
  it("detects French mobile (local format)", () => {
    const result = detectWithRegex("Mon numéro est 06 12 34 56 78.")
    expect(result.filter((e) => e.type === "PHONE")).toHaveLength(1)
  })

  it("detects French international format", () => {
    const result = detectWithRegex("+33 6 12 34 56 78")
    expect(result.filter((e) => e.type === "PHONE")).toHaveLength(1)
  })
})

describe("Phone detection — EN (US)", () => {
  it("detects US number with country code", () => {
    const result = detectWithRegex("+1 415 555 2671")
    expect(result.filter((e) => e.type === "PHONE")).toHaveLength(1)
  })
})

describe("Phone detection — DE", () => {
  it("detects German number with country code", () => {
    const result = detectWithRegex("+49 30 12345678")
    expect(result.filter((e) => e.type === "PHONE")).toHaveLength(1)
  })
})

describe("Phone detection — ES", () => {
  it("detects Spanish number with country code", () => {
    const result = detectWithRegex("+34 612 345 678")
    expect(result.filter((e) => e.type === "PHONE")).toHaveLength(1)
  })
})

describe("Phone detection — IT", () => {
  it("detects Italian mobile with country code", () => {
    const result = detectWithRegex("+39 333 123 4567")
    expect(result.filter((e) => e.type === "PHONE")).toHaveLength(1)
  })
})

describe("Phone detection — PT", () => {
  it("detects Portuguese number with country code", () => {
    const result = detectWithRegex("+351 912 345 678")
    expect(result.filter((e) => e.type === "PHONE")).toHaveLength(1)
  })
})

// ---------------------------------------------------------------------------
// Financial — Credit cards
// ---------------------------------------------------------------------------
describe("Credit card detection", () => {
  it("detects Visa (Luhn-valid)", () => {
    // 4111111111111111 is the canonical test Visa
    const result = detectWithRegex("Card: 4111 1111 1111 1111")
    expect(result.filter((e) => e.type === "FINANCIAL")).toHaveLength(1)
  })

  it("rejects Luhn-invalid Visa", () => {
    const result = detectWithRegex("Card: 4111 1111 1111 1112")
    expect(result.filter((e) => e.type === "FINANCIAL" && e.value.includes("4111"))).toHaveLength(0)
  })

  it("detects Mastercard (Luhn-valid)", () => {
    const result = detectWithRegex("5500 0000 0000 0004")
    expect(result.filter((e) => e.type === "FINANCIAL")).toHaveLength(1)
  })

  it("detects Amex (Luhn-valid)", () => {
    const result = detectWithRegex("378282246310005")
    expect(result.filter((e) => e.type === "FINANCIAL")).toHaveLength(1)
  })
})

// ---------------------------------------------------------------------------
// Financial — IBAN
// ---------------------------------------------------------------------------
describe("IBAN detection", () => {
  it("detects French IBAN", () => {
    const result = detectWithRegex("IBAN: FR7630006000011234567890189")
    expect(result.filter((e) => e.type === "FINANCIAL")).toHaveLength(1)
  })

  it("detects German IBAN", () => {
    const result = detectWithRegex("DE89370400440532013000")
    expect(result.filter((e) => e.type === "FINANCIAL")).toHaveLength(1)
  })

  it("detects Spanish IBAN", () => {
    const result = detectWithRegex("ES9121000418450200051332")
    expect(result.filter((e) => e.type === "FINANCIAL")).toHaveLength(1)
  })

  it("detects GB IBAN", () => {
    const result = detectWithRegex("GB29NWBK60161331926819")
    expect(result.filter((e) => e.type === "FINANCIAL")).toHaveLength(1)
  })

  it("rejects invalid IBAN checksum", () => {
    const result = detectWithRegex("DE89370400440532013001")
    expect(result.filter((e) => e.type === "FINANCIAL")).toHaveLength(0)
  })
})

// ---------------------------------------------------------------------------
// National IDs
// ---------------------------------------------------------------------------
describe("National ID — French NIR", () => {
  it("detects valid NIR", () => {
    // 1 85 05 78 006 084 91 — Key = 97 - (1850578006084 % 97) = 91
    const result = detectWithRegex("NIR: 1 85 05 78 006 084 91")
    expect(result.filter((e) => e.type === "NATIONAL_ID")).toHaveLength(1)
  })

  it("rejects NIR with bad check key", () => {
    const result = detectWithRegex("NIR: 1 85 05 78 006 084 99")
    expect(result.filter((e) => e.type === "NATIONAL_ID" && e.value.includes("99"))).toHaveLength(0)
  })
})

describe("National ID — Spanish DNI", () => {
  it("detects valid DNI", () => {
    // 12345678Z — Z is correct letter for 12345678
    const result = detectWithRegex("DNI: 12345678Z")
    expect(result.filter((e) => e.type === "NATIONAL_ID")).toHaveLength(1)
  })

  it("rejects DNI with wrong check letter", () => {
    const result = detectWithRegex("DNI: 12345678A")
    expect(result.filter((e) => e.type === "NATIONAL_ID")).toHaveLength(0)
  })
})

describe("National ID — Spanish NIE", () => {
  it("detects valid NIE", () => {
    // X1234567L — valid NIE
    const result = detectWithRegex("NIE: X1234567L")
    expect(result.filter((e) => e.type === "NATIONAL_ID")).toHaveLength(1)
  })
})

describe("National ID — Italian Codice Fiscale", () => {
  it("detects valid Codice Fiscale", () => {
    const result = detectWithRegex("CF: RSSMRA85M01H501Z")
    expect(result.filter((e) => e.type === "NATIONAL_ID")).toHaveLength(1)
  })

  it("rejects malformed Codice Fiscale", () => {
    const result = detectWithRegex("CF: RSSMRA85X01H501Z")
    expect(result.filter((e) => e.type === "NATIONAL_ID")).toHaveLength(0)
  })
})

describe("National ID — Portuguese NIF", () => {
  it("detects valid NIF", () => {
    // 123456789 — valid Portuguese NIF
    const result = detectWithRegex("NIF: 123456789")
    expect(result.filter((e) => e.type === "NATIONAL_ID")).toHaveLength(1)
  })

  it("rejects NIF with bad check digit", () => {
    const result = detectWithRegex("NIF: 123456780")
    expect(result.filter((e) => e.type === "NATIONAL_ID" && e.value === "123456780")).toHaveLength(0)
  })
})

// ---------------------------------------------------------------------------
// IP addresses
// ---------------------------------------------------------------------------
describe("IPv4 detection", () => {
  it("detects valid IPv4", () => {
    const result = detectWithRegex("Server at 192.168.1.1.")
    expect(result.filter((e) => e.type === "IP_ADDRESS")).toHaveLength(1)
    expect(result.find((e) => e.type === "IP_ADDRESS")!.value).toBe("192.168.1.1")
  })

  it("does not detect invalid IPv4 (octet > 255)", () => {
    const result = detectWithRegex("999.999.999.999")
    expect(result.filter((e) => e.type === "IP_ADDRESS")).toHaveLength(0)
  })
})

describe("IPv6 detection", () => {
  it("detects full IPv6", () => {
    const result = detectWithRegex("2001:0db8:85a3:0000:0000:8a2e:0370:7334")
    expect(result.filter((e) => e.type === "IP_ADDRESS")).toHaveLength(1)
  })
})

// ---------------------------------------------------------------------------
// Entity properties
// ---------------------------------------------------------------------------
describe("Entity structure", () => {
  it("returns correct startIndex and endIndex", () => {
    const text = "Email: user@test.com end"
    const result = detectWithRegex(text)
    const email = result.find((e) => e.type === "EMAIL")!
    expect(email.value).toBe("user@test.com")
    expect(text.slice(email.startIndex, email.endIndex)).toBe("user@test.com")
  })

  it("sorts entities by startIndex", () => {
    const result = detectWithRegex("4111111111111111 and user@example.com")
    for (let i = 1; i < result.length; i++) {
      expect(result[i]!.startIndex).toBeGreaterThanOrEqual(result[i - 1]!.startIndex)
    }
  })
})

// ---------------------------------------------------------------------------
// Performance benchmark (AC NFR1)
// ---------------------------------------------------------------------------
describe("Performance", () => {
  it("completes in <50ms on 500-char mixed PII input", () => {
    const text = [
      "Contact Jean Dupont at jean.dupont@example.fr or +33 6 12 34 56 78.",
      "His card is 4111 1111 1111 1111 and IBAN FR7630006000011234567890189.",
      "Server IP: 192.168.1.100. NIR: 1 85 05 78 006 084 91.",
    ]
      .join(" ")
      .slice(0, 500)
      .padEnd(500, " x")

    const start = performance.now()
    detectWithRegex(text)
    const elapsed = performance.now() - start
    expect(elapsed).toBeLessThan(50)
  })
})
