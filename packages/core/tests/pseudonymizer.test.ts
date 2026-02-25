import { describe, it, expect } from "vitest"
import { pseudonymizeText } from "../src/anonymizer/pseudonymizer"
import type { Entity } from "../src/types/entities"

// ---------------------------------------------------------------------------
// Basic replacements
// ---------------------------------------------------------------------------

describe("pseudonymizeText — basic", () => {
  it("returns original text unchanged when no entities", () => {
    const result = pseudonymizeText("Hello world", [])
    expect(result.processedText).toBe("Hello world")
    expect(result.mappings).toHaveLength(0)
  })

  it("replaces a single entity with a fake value (not original)", () => {
    const text = "Call Jean Dupont now"
    const entities: Entity[] = [
      { type: "PERSON_NAME", value: "Jean Dupont", startIndex: 5, endIndex: 16, confidence: 1.0, source: "ner" },
    ]
    const result = pseudonymizeText(text, entities, 42)
    expect(result.processedText).not.toContain("Jean Dupont")
    expect(result.processedText.length).toBeGreaterThan(0)
  })

  it("fake name looks realistic (has a space)", () => {
    const text = "Hello Jean Dupont!"
    const entities: Entity[] = [
      { type: "PERSON_NAME", value: "Jean Dupont", startIndex: 6, endIndex: 17, confidence: 1.0, source: "ner" },
    ]
    const result = pseudonymizeText(text, entities, 1)
    const replacedName = result.mappings[0]!.replacement
    expect(replacedName.includes(" ")).toBe(true)
  })

  it("fake email contains @ sign", () => {
    const text = "Email: user@example.com"
    const entities: Entity[] = [
      { type: "EMAIL", value: "user@example.com", startIndex: 7, endIndex: 23, confidence: 1.0, source: "regex" },
    ]
    const result = pseudonymizeText(text, entities, 1)
    const replacement = result.mappings[0]!.replacement
    expect(replacement).toContain("@")
  })

  it("fake IP is in 10.x.x.x reserved range", () => {
    const text = "Server: 192.168.1.1"
    const entities: Entity[] = [
      { type: "IP_ADDRESS", value: "192.168.1.1", startIndex: 8, endIndex: 19, confidence: 1.0, source: "regex" },
    ]
    const result = pseudonymizeText(text, entities, 1)
    expect(result.mappings[0]!.replacement).toMatch(/^10\.\d+\.\d+\.\d+$/)
  })
})

// ---------------------------------------------------------------------------
// Coherence — same original → same replacement
// ---------------------------------------------------------------------------

describe("pseudonymizeText — coherence", () => {
  it("same entity value gets same fake replacement", () => {
    const text = "Jean Dupont said hello. Jean Dupont left."
    const entities: Entity[] = [
      { type: "PERSON_NAME", value: "Jean Dupont", startIndex: 0, endIndex: 11, confidence: 1.0, source: "ner" },
      { type: "PERSON_NAME", value: "Jean Dupont", startIndex: 23, endIndex: 34, confidence: 1.0, source: "ner" },
    ]
    const result = pseudonymizeText(text, entities, 42)
    const placeholders = result.processedText.match(/[A-Z][a-z]+ [A-Z][a-z]+|[A-Z]+ [A-Z]+/g) ?? []
    // There should only be one unique fake name used
    expect(result.mappings).toHaveLength(1)
    const replacement = result.mappings[0]!.replacement
    // both occurrences should be the same fake name
    expect(result.processedText.split(replacement)).toHaveLength(3) // 2 occurrences = 3 parts
  })

  it("entity appearing 3+ times gets same fake value all times", () => {
    const text = "Alice called Alice and Alice replied"
    const entities: Entity[] = [
      { type: "PERSON_NAME", value: "Alice", startIndex: 0, endIndex: 5, confidence: 1.0, source: "ner" },
      { type: "PERSON_NAME", value: "Alice", startIndex: 13, endIndex: 18, confidence: 1.0, source: "ner" },
      { type: "PERSON_NAME", value: "Alice", startIndex: 23, endIndex: 28, confidence: 1.0, source: "ner" },
    ]
    const result = pseudonymizeText(text, entities, 42)
    expect(result.mappings).toHaveLength(1)
    const fakeName = result.mappings[0]!.replacement
    // processedText should contain the fake name 3 times
    const count = result.processedText.split(fakeName).length - 1
    expect(count).toBe(3)
  })
})

// ---------------------------------------------------------------------------
// Right-to-left replacement
// ---------------------------------------------------------------------------

describe("pseudonymizeText — right-to-left correctness", () => {
  it("correctly replaces multiple entities without index corruption", () => {
    const text = "Name: Alice, Email: alice@test.com, Phone: +33612345678"
    const entities: Entity[] = [
      { type: "PERSON_NAME", value: "Alice", startIndex: 6, endIndex: 11, confidence: 1.0, source: "ner" },
      { type: "EMAIL", value: "alice@test.com", startIndex: 20, endIndex: 34, confidence: 1.0, source: "regex" },
      { type: "PHONE", value: "+33612345678", startIndex: 43, endIndex: 55, confidence: 1.0, source: "regex" },
    ]
    const result = pseudonymizeText(text, entities, 42)
    // None of the original values should remain
    expect(result.processedText).not.toContain("Alice")
    expect(result.processedText).not.toContain("alice@test.com")
    expect(result.processedText).not.toContain("+33612345678")
    expect(result.mappings).toHaveLength(3)
  })
})

// ---------------------------------------------------------------------------
// Determinism — same seed → same output
// ---------------------------------------------------------------------------

describe("pseudonymizeText — determinism", () => {
  it("same input + same seed → same output", () => {
    const text = "Jean Dupont called +33 6 12 34 56 78"
    const entities: Entity[] = [
      { type: "PERSON_NAME", value: "Jean Dupont", startIndex: 0, endIndex: 11, confidence: 1.0, source: "ner" },
      { type: "PHONE", value: "+33 6 12 34 56 78", startIndex: 19, endIndex: 36, confidence: 1.0, source: "regex" },
    ]
    const r1 = pseudonymizeText(text, entities, 123)
    const r2 = pseudonymizeText(text, entities, 123)
    expect(r1.processedText).toBe(r2.processedText)
    expect(r1.mappings.map((m) => m.replacement)).toEqual(r2.mappings.map((m) => m.replacement))
  })

  it("different seed may produce different output", () => {
    const text = "Jean Dupont"
    const entities: Entity[] = [
      { type: "PERSON_NAME", value: "Jean Dupont", startIndex: 0, endIndex: 11, confidence: 1.0, source: "ner" },
    ]
    const r1 = pseudonymizeText(text, entities, 1)
    const r2 = pseudonymizeText(text, entities, 999)
    // It's possible (rare) they collide, but statistically very unlikely
    // We just verify both runs produce valid non-empty text
    expect(r1.processedText).toBeTruthy()
    expect(r2.processedText).toBeTruthy()
  })
})

// ---------------------------------------------------------------------------
// All entity types produce realistic fake values
// ---------------------------------------------------------------------------

describe("pseudonymizeText — all entity types", () => {
  const tests: Array<{ type: Entity["type"]; value: string; check: (v: string) => boolean }> = [
    { type: "PERSON_NAME", value: "Jean Dupont", check: (v) => v.includes(" ") },
    { type: "EMAIL", value: "user@example.com", check: (v) => v.includes("@") },
    { type: "PHONE", value: "+33612345678", check: (v) => v.startsWith("+") },
    { type: "ADDRESS", value: "12 rue de Paris", check: (v) => v.length > 5 },
    { type: "FINANCIAL", value: "FR7630006000011234567890189", check: (v) => /^[A-Z]{2}00/.test(v) },
    { type: "NATIONAL_ID", value: "1 85 05 78 006 084 91", check: (v) => v.endsWith("00") },
    { type: "ORGANIZATION", value: "ACME Corp", check: (v) => v.length > 3 },
    { type: "DATE_OF_BIRTH", value: "1985-03-14", check: (v) => /^\d{4}-\d{2}-\d{2}$/.test(v) },
    { type: "IP_ADDRESS", value: "192.168.1.1", check: (v) => v.startsWith("10.") },
  ]

  for (const { type, value, check } of tests) {
    it(`produces realistic fake value for ${type}`, () => {
      const text = `Value: ${value}`
      const entities: Entity[] = [
        {
          type,
          value,
          startIndex: 7,
          endIndex: 7 + value.length,
          confidence: 1.0,
          source: "regex",
        },
      ]
      const result = pseudonymizeText(text, entities, 42)
      const fakeValue = result.mappings[0]!.replacement
      expect(check(fakeValue)).toBe(true)
    })
  }
})

// ---------------------------------------------------------------------------
// MappingEntry structure
// ---------------------------------------------------------------------------

describe("pseudonymizeText — MappingEntry structure", () => {
  it("returns correct positions in original text", () => {
    const text = "Contact Jean Dupont please"
    const entities: Entity[] = [
      { type: "PERSON_NAME", value: "Jean Dupont", startIndex: 8, endIndex: 19, confidence: 1.0, source: "ner" },
    ]
    const result = pseudonymizeText(text, entities, 42)
    expect(result.mappings[0]!.positions[0]).toEqual({ startIndex: 8, endIndex: 19 })
    expect(result.mappings[0]!.original).toBe("Jean Dupont")
    expect(result.mappings[0]!.type).toBe("PERSON_NAME")
  })
})
