import { describe, it, expect } from "vitest"
import { detectWithRegex } from "../src/detector/regex-detector"
import { anonymize } from "../src/anonymizer/index"

// ---------------------------------------------------------------------------
// Integration: detect → anonymize pipeline
// ---------------------------------------------------------------------------

describe("detect → anonymize pipeline", () => {
  it("anonymize mode: replaces all regex-detected entities with placeholders", () => {
    const text = "Contact jean.dupont@example.fr or call +33 6 12 34 56 78"
    const entities = detectWithRegex(text)
    const result = anonymize(text, entities, { mode: "anonymize" })

    // No original PII should remain in the processed text
    expect(result.processedText).not.toContain("jean.dupont@example.fr")
    expect(result.processedText).not.toContain("+33 6 12 34 56 78")
    expect(result.processedText).toContain("[EMAIL_1]")
    expect(result.processedText).toContain("[PHONE_1]")
  })

  it("pseudonymize mode: replaces all regex-detected entities with realistic fakes", () => {
    const text = "Card: 4111 1111 1111 1111, Server: 192.168.1.1"
    const entities = detectWithRegex(text)
    const result = anonymize(text, entities, { mode: "pseudonymize", seed: 42 })

    expect(result.processedText).not.toContain("4111 1111 1111 1111")
    expect(result.processedText).not.toContain("192.168.1.1")
    expect(result.mappings).toHaveLength(2)
  })

  it("default mode is pseudonymize", () => {
    const text = "IP: 10.20.30.40"
    const entities = detectWithRegex(text)
    // With no mode specified, default should be pseudonymize → no [IP_ADDRESS_N] placeholder
    const result = anonymize(text, entities)
    expect(result.processedText).not.toContain("[IP_ADDRESS_1]")
    // The fake IP should be in reserved range
    expect(result.mappings[0]?.replacement).toMatch(/^10\.\d+\.\d+\.\d+$/)
  })

  it("processedText contains no real PII after full pipeline", () => {
    const text = [
      "Name: Jean Dupont",
      "Email: jean.dupont@example.fr",
      "Phone: +33 6 12 34 56 78",
      "Card: 4111 1111 1111 1111",
      "IP: 192.168.1.100",
    ].join(". ")

    const entities = detectWithRegex(text)
    const result = anonymize(text, entities, { mode: "anonymize" })

    expect(result.processedText).not.toContain("jean.dupont@example.fr")
    expect(result.processedText).not.toContain("+33 6 12 34 56 78")
    expect(result.processedText).not.toContain("4111 1111 1111 1111")
    expect(result.processedText).not.toContain("192.168.1.100")
  })
})

// ---------------------------------------------------------------------------
// Mixed-language text
// ---------------------------------------------------------------------------

describe("mixed-language text", () => {
  it("handles French email and German phone in same text", () => {
    const text = "Contactez marie.leroy@example.fr, tel: +49 30 12345678"
    const entities = detectWithRegex(text)
    const result = anonymize(text, entities, { mode: "pseudonymize", seed: 42 })

    expect(result.processedText).not.toContain("marie.leroy@example.fr")
    expect(result.processedText).not.toContain("+49 30 12345678")
    expect(result.mappings).toHaveLength(2)
  })

  it("handles multiple entity types from different locales", () => {
    const text = [
      "FR IBAN: FR7630006000011234567890189",
      "DE IBAN: DE89370400440532013000",
      "ES phone: +34 612 345 678",
      "IT phone: +39 333 123 4567",
    ].join(". ")

    const entities = detectWithRegex(text)
    const result = anonymize(text, entities, { mode: "anonymize" })

    // All financial entities should be replaced
    expect(result.processedText).not.toContain("FR7630006000011234567890189")
    expect(result.processedText).not.toContain("DE89370400440532013000")
    expect(result.processedText).not.toContain("+34 612 345 678")
    expect(result.processedText).not.toContain("+39 333 123 4567")
  })
})

// ---------------------------------------------------------------------------
// Deterministic output with seeded generators
// ---------------------------------------------------------------------------

describe("deterministic output", () => {
  it("same input + same seed → same processedText", () => {
    const text = "Call +33 6 12 34 56 78 about 4111 1111 1111 1111"
    const entities = detectWithRegex(text)

    const r1 = anonymize(text, entities, { mode: "pseudonymize", seed: 77 })
    const r2 = anonymize(text, entities, { mode: "pseudonymize", seed: 77 })

    expect(r1.processedText).toBe(r2.processedText)
    expect(r1.mappings.map((m) => m.replacement)).toEqual(r2.mappings.map((m) => m.replacement))
  })

  it("anonymize mode is deterministic (no seed needed — placeholders are deterministic)", () => {
    const text = "Email user@test.com, call +33 6 12 34 56 78"
    const entities = detectWithRegex(text)

    const r1 = anonymize(text, entities, { mode: "anonymize" })
    const r2 = anonymize(text, entities, { mode: "anonymize" })

    expect(r1.processedText).toBe(r2.processedText)
  })
})

// ---------------------------------------------------------------------------
// NER-sourced entities (M6: validate the NER → anonymize path)
// ---------------------------------------------------------------------------

describe("NER-sourced entities", () => {
  it("anonymizes a PERSON_NAME entity sourced from NER", () => {
    const text = "Jean Dupont will attend the meeting tomorrow"
    const nerEntity: Parameters<typeof anonymize>[1][number] = {
      type: "PERSON_NAME",
      value: "Jean Dupont",
      startIndex: 0,
      endIndex: 11,
      confidence: 0.95,
      source: "ner",
    }
    const result = anonymize(text, [nerEntity], { mode: "anonymize" })
    expect(result.processedText).toBe("[NAME_1] will attend the meeting tomorrow")
    expect(result.mappings[0]!.type).toBe("PERSON_NAME")
  })

  it("pseudonymizes a PERSON_NAME entity sourced from NER", () => {
    const text = "Contact Sophie Martin for details"
    const nerEntity: Parameters<typeof anonymize>[1][number] = {
      type: "PERSON_NAME",
      value: "Sophie Martin",
      startIndex: 8,
      endIndex: 21,
      confidence: 0.87,
      source: "ner",
    }
    const result = anonymize(text, [nerEntity], { mode: "pseudonymize", seed: 42 })
    expect(result.processedText).not.toContain("Sophie Martin")
    expect(result.mappings[0]!.replacement).toContain(" ") // realistic full name
  })

  it("mixes NER and regex entities correctly", () => {
    const text = "Jean Dupont can be reached at jean.dupont@example.fr"
    const entities: Parameters<typeof anonymize>[1] = [
      { type: "PERSON_NAME", value: "Jean Dupont", startIndex: 0, endIndex: 11, confidence: 0.92, source: "ner" },
      { type: "EMAIL", value: "jean.dupont@example.fr", startIndex: 30, endIndex: 52, confidence: 1.0, source: "regex" },
    ]
    const result = anonymize(text, entities, { mode: "anonymize" })
    expect(result.processedText).toBe("[NAME_1] can be reached at [EMAIL_1]")
    expect(result.mappings).toHaveLength(2)
  })
})

// ---------------------------------------------------------------------------
// Overlapping entity guard
// ---------------------------------------------------------------------------

describe("overlapping entity guard", () => {
  it("drops later overlapping entities to prevent index corruption", () => {
    const text = "jean.dupont@example.com"
    // Simulate overlapping: EMAIL covers full span, PERSON_NAME covers a subset
    const entities: Parameters<typeof anonymize>[1] = [
      { type: "EMAIL", value: "jean.dupont@example.com", startIndex: 0, endIndex: 23, confidence: 1.0, source: "regex" },
      { type: "PERSON_NAME", value: "jean.dupont", startIndex: 0, endIndex: 11, confidence: 0.6, source: "ner" },
    ]
    const result = anonymize(text, entities, { mode: "anonymize" })
    // Only the first entity (EMAIL) should be replaced; overlap is dropped
    expect(result.processedText).toBe("[EMAIL_1]")
    expect(result.mappings).toHaveLength(1)
  })
})

// ---------------------------------------------------------------------------
// AnonymizationResult shape
// ---------------------------------------------------------------------------

describe("AnonymizationResult shape", () => {
  it("returns processedText and mappings array", () => {
    const text = "IP: 192.168.0.1"
    const entities = detectWithRegex(text)
    const result = anonymize(text, entities, { mode: "anonymize" })

    expect(typeof result.processedText).toBe("string")
    expect(Array.isArray(result.mappings)).toBe(true)
    for (const m of result.mappings) {
      expect(typeof m.original).toBe("string")
      expect(typeof m.replacement).toBe("string")
      expect(typeof m.type).toBe("string")
      expect(Array.isArray(m.positions)).toBe(true)
    }
  })

  it("empty text returns empty processedText with no mappings", () => {
    const result = anonymize("", [], { mode: "anonymize" })
    expect(result.processedText).toBe("")
    expect(result.mappings).toHaveLength(0)
  })
})
