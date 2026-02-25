import { describe, it, expect } from "vitest"
import { CoherenceMap } from "../src/anonymizer/coherence"

describe("CoherenceMap", () => {
  it("returns same replacement for same original", () => {
    const cm = new CoherenceMap()
    let callCount = 0
    const gen = () => { callCount++; return "FAKE_VALUE" }

    const r1 = cm.getOrCreate("Jean Dupont", "PERSON_NAME", gen)
    const r2 = cm.getOrCreate("Jean Dupont", "PERSON_NAME", gen)
    expect(r1).toBe("FAKE_VALUE")
    expect(r2).toBe("FAKE_VALUE")
    expect(callCount).toBe(1) // generator called only once
  })

  it("returns same replacement appearing 3+ times", () => {
    const cm = new CoherenceMap()
    let callCount = 0
    const gen = () => { callCount++; return "REPLACEMENT_X" }

    const results = [1, 2, 3, 4, 5].map(() =>
      cm.getOrCreate("Alice Smith", "PERSON_NAME", gen)
    )
    expect(results.every((r) => r === "REPLACEMENT_X")).toBe(true)
    expect(callCount).toBe(1)
  })

  it("is case-insensitive for PERSON_NAME", () => {
    const cm = new CoherenceMap()
    const gen = () => "FAKE_NAME"

    const r1 = cm.getOrCreate("Jean Dupont", "PERSON_NAME", gen)
    const r2 = cm.getOrCreate("JEAN DUPONT", "PERSON_NAME", gen)
    const r3 = cm.getOrCreate("jean dupont", "PERSON_NAME", gen)
    expect(r1).toBe(r2)
    expect(r2).toBe(r3)
  })

  it("is case-sensitive for non-name types", () => {
    const cm = new CoherenceMap()
    let counter = 0
    const gen = () => `FAKE_${++counter}`

    const r1 = cm.getOrCreate("user@example.com", "EMAIL", gen)
    const r2 = cm.getOrCreate("USER@EXAMPLE.COM", "EMAIL", gen)
    expect(r1).not.toBe(r2)
  })

  it("maps different originals to different replacements", () => {
    const cm = new CoherenceMap()
    let counter = 0
    const gen = () => `FAKE_${++counter}`

    const r1 = cm.getOrCreate("Alice", "PERSON_NAME", gen)
    const r2 = cm.getOrCreate("Bob", "PERSON_NAME", gen)
    expect(r1).not.toBe(r2)
  })

  it("separates same value with different types", () => {
    const cm = new CoherenceMap()
    let counter = 0
    const gen = () => `FAKE_${++counter}`

    const r1 = cm.getOrCreate("value", "ORGANIZATION", gen)
    const r2 = cm.getOrCreate("value", "EMAIL", gen)
    expect(r1).not.toBe(r2)
  })

  it("tracks size correctly", () => {
    const cm = new CoherenceMap()
    const gen = () => "X"

    cm.getOrCreate("a", "EMAIL", gen)
    cm.getOrCreate("b", "EMAIL", gen)
    cm.getOrCreate("a", "EMAIL", gen) // duplicate
    expect(cm.size()).toBe(2)
  })
})
