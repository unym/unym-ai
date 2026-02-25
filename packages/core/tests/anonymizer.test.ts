import { describe, it, expect } from "vitest"
import { anonymizeText } from "../src/anonymizer/anonymizer"
import type { Entity } from "../src/types/entities"

function makeEntity(
  type: Entity["type"],
  value: string,
  text: string,
  offset = 0
): Entity {
  const idx = text.indexOf(value, offset)
  return {
    type,
    value,
    startIndex: idx,
    endIndex: idx + value.length,
    confidence: 1.0,
    source: "regex",
  }
}

// ---------------------------------------------------------------------------
// Basic replacements
// ---------------------------------------------------------------------------

describe("anonymizeText — basic", () => {
  it("returns original text unchanged when no entities", () => {
    const result = anonymizeText("Hello world", [])
    expect(result.processedText).toBe("Hello world")
    expect(result.mappings).toHaveLength(0)
  })

  it("replaces a single entity with typed placeholder", () => {
    const text = "Contact Alice at alice@example.com"
    const entities: Entity[] = [
      { type: "EMAIL", value: "alice@example.com", startIndex: 17, endIndex: 34, confidence: 1.0, source: "regex" },
    ]
    const result = anonymizeText(text, entities)
    expect(result.processedText).toBe("Contact Alice at [EMAIL_1]")
    expect(result.mappings).toHaveLength(1)
    expect(result.mappings[0]!.replacement).toBe("[EMAIL_1]")
    expect(result.mappings[0]!.original).toBe("alice@example.com")
  })

  it("uses NAME placeholder for PERSON_NAME type", () => {
    const text = "Hello Jean Dupont!"
    const entities: Entity[] = [
      { type: "PERSON_NAME", value: "Jean Dupont", startIndex: 6, endIndex: 17, confidence: 1.0, source: "ner" },
    ]
    const result = anonymizeText(text, entities)
    expect(result.processedText).toBe("Hello [NAME_1]!")
  })
})

// ---------------------------------------------------------------------------
// Numbering — sequential per type
// ---------------------------------------------------------------------------

describe("anonymizeText — numbering", () => {
  it("assigns sequential numbers per type", () => {
    const text = "Alice and Bob met Charlie"
    const entities: Entity[] = [
      { type: "PERSON_NAME", value: "Alice", startIndex: 0, endIndex: 5, confidence: 1.0, source: "ner" },
      { type: "PERSON_NAME", value: "Bob", startIndex: 10, endIndex: 13, confidence: 1.0, source: "ner" },
      { type: "PERSON_NAME", value: "Charlie", startIndex: 18, endIndex: 25, confidence: 1.0, source: "ner" },
    ]
    const result = anonymizeText(text, entities)
    expect(result.processedText).toBe("[NAME_1] and [NAME_2] met [NAME_3]")
  })

  it("keeps separate counters per type", () => {
    const text = "Alice emailed bob@test.com and Carol called +33 6 12 34 56 78"
    const entities: Entity[] = [
      { type: "PERSON_NAME", value: "Alice", startIndex: 0, endIndex: 5, confidence: 1.0, source: "ner" },
      { type: "EMAIL", value: "bob@test.com", startIndex: 14, endIndex: 26, confidence: 1.0, source: "regex" },
      { type: "PERSON_NAME", value: "Carol", startIndex: 31, endIndex: 36, confidence: 1.0, source: "ner" },
      { type: "PHONE", value: "+33 6 12 34 56 78", startIndex: 44, endIndex: 61, confidence: 1.0, source: "regex" },
    ]
    const result = anonymizeText(text, entities)
    expect(result.processedText).toBe("[NAME_1] emailed [EMAIL_1] and [NAME_2] called [PHONE_1]")
  })
})

// ---------------------------------------------------------------------------
// Coherence — same original → same placeholder
// ---------------------------------------------------------------------------

describe("anonymizeText — coherence", () => {
  it("same entity value gets same placeholder (multiple occurrences)", () => {
    const text = "Jean Dupont said hello. Jean Dupont left."
    const entities: Entity[] = [
      { type: "PERSON_NAME", value: "Jean Dupont", startIndex: 0, endIndex: 11, confidence: 1.0, source: "ner" },
      { type: "PERSON_NAME", value: "Jean Dupont", startIndex: 24, endIndex: 35, confidence: 1.0, source: "ner" },
    ]
    const result = anonymizeText(text, entities)
    expect(result.processedText).toBe("[NAME_1] said hello. [NAME_1] left.")
  })

  it("case-insensitive coherence for PERSON_NAME", () => {
    const text = "Jean dupont and JEAN DUPONT are the same"
    const entities: Entity[] = [
      { type: "PERSON_NAME", value: "Jean dupont", startIndex: 0, endIndex: 11, confidence: 1.0, source: "ner" },
      { type: "PERSON_NAME", value: "JEAN DUPONT", startIndex: 16, endIndex: 27, confidence: 1.0, source: "ner" },
    ]
    const result = anonymizeText(text, entities)
    // Both should get the same placeholder number
    const placeholders = result.processedText.match(/\[NAME_\d+\]/g)
    expect(placeholders).toHaveLength(2)
    expect(placeholders![0]).toBe(placeholders![1])
  })

  it("entity appearing 3 times gets same placeholder all three times", () => {
    const text = "Call Alice, email Alice, meet Alice tomorrow"
    const entities: Entity[] = [
      { type: "PERSON_NAME", value: "Alice", startIndex: 5, endIndex: 10, confidence: 1.0, source: "ner" },
      { type: "PERSON_NAME", value: "Alice", startIndex: 18, endIndex: 23, confidence: 1.0, source: "ner" },
      { type: "PERSON_NAME", value: "Alice", startIndex: 30, endIndex: 35, confidence: 1.0, source: "ner" },
    ]
    const result = anonymizeText(text, entities)
    const placeholders = result.processedText.match(/\[NAME_\d+\]/g)
    expect(placeholders).toHaveLength(3)
    expect(new Set(placeholders).size).toBe(1)
  })
})

// ---------------------------------------------------------------------------
// Right-to-left replacement — no index corruption
// ---------------------------------------------------------------------------

describe("anonymizeText — right-to-left correctness", () => {
  it("correctly replaces multiple entities without index corruption", () => {
    const text = "Name: Alice, Email: a@b.com, Phone: +33612345678"
    const entities: Entity[] = [
      { type: "PERSON_NAME", value: "Alice", startIndex: 6, endIndex: 11, confidence: 1.0, source: "ner" },
      { type: "EMAIL", value: "a@b.com", startIndex: 20, endIndex: 27, confidence: 1.0, source: "regex" },
      { type: "PHONE", value: "+33612345678", startIndex: 36, endIndex: 48, confidence: 1.0, source: "regex" },
    ]
    const result = anonymizeText(text, entities)
    expect(result.processedText).toBe("Name: [NAME_1], Email: [EMAIL_1], Phone: [PHONE_1]")
  })

  it("preserves text before first and after last entity", () => {
    const text = "Hello Jean Dupont, how are you?"
    const entities: Entity[] = [
      { type: "PERSON_NAME", value: "Jean Dupont", startIndex: 6, endIndex: 17, confidence: 1.0, source: "ner" },
    ]
    const result = anonymizeText(text, entities)
    expect(result.processedText).toBe("Hello [NAME_1], how are you?")
  })
})

// ---------------------------------------------------------------------------
// MappingEntry structure
// ---------------------------------------------------------------------------

describe("anonymizeText — MappingEntry structure", () => {
  it("mapping positions reflect original text positions", () => {
    const text = "Alice is here"
    const entities: Entity[] = [
      { type: "PERSON_NAME", value: "Alice", startIndex: 0, endIndex: 5, confidence: 1.0, source: "ner" },
    ]
    const result = anonymizeText(text, entities)
    const mapping = result.mappings[0]!
    expect(mapping.original).toBe("Alice")
    expect(mapping.type).toBe("PERSON_NAME")
    expect(mapping.positions).toHaveLength(1)
    expect(mapping.positions[0]).toEqual({ startIndex: 0, endIndex: 5 })
  })

  it("merges positions for same entity appearing multiple times", () => {
    const text = "Alice and Alice"
    const entities: Entity[] = [
      { type: "PERSON_NAME", value: "Alice", startIndex: 0, endIndex: 5, confidence: 1.0, source: "ner" },
      { type: "PERSON_NAME", value: "Alice", startIndex: 10, endIndex: 15, confidence: 1.0, source: "ner" },
    ]
    const result = anonymizeText(text, entities)
    expect(result.mappings).toHaveLength(1)
    expect(result.mappings[0]!.positions).toHaveLength(2)
  })
})

// ---------------------------------------------------------------------------
// All entity types
// ---------------------------------------------------------------------------

describe("anonymizeText — all entity types produce placeholders", () => {
  const typeTests: Array<[Entity["type"], string, string]> = [
    ["EMAIL", "user@example.com", "[EMAIL_1]"],
    ["PHONE", "+33612345678", "[PHONE_1]"],
    ["ADDRESS", "12 rue de la Paix, Paris", "[ADDRESS_1]"],
    ["FINANCIAL", "FR7630006000011234567890189", "[FINANCIAL_1]"],
    ["NATIONAL_ID", "123456789", "[NATIONAL_ID_1]"],
    ["ORGANIZATION", "ACME Corp", "[ORGANIZATION_1]"],
    ["DATE_OF_BIRTH", "1985-03-14", "[DATE_OF_BIRTH_1]"],
    ["IP_ADDRESS", "192.168.1.1", "[IP_ADDRESS_1]"],
  ]

  for (const [type, value, expectedPlaceholder] of typeTests) {
    it(`replaces ${type} with ${expectedPlaceholder}`, () => {
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
      const result = anonymizeText(text, entities)
      expect(result.processedText).toBe(`Value: ${expectedPlaceholder}`)
    })
  }
})
