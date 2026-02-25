import { describe, it, expect } from "vitest"
import {
  createSeededRng,
  generateFakeName,
  generateFakeEmail,
  generateFakePhone,
  generateFakeAddress,
  generateFakeFinancial,
  generateFakeNationalId,
  generateFakeOrg,
  generateFakeDateOfBirth,
  generateFakeIpAddress,
  generateFakeValue,
} from "../src/anonymizer/strategies"

// ---------------------------------------------------------------------------
// Seeded RNG — determinism
// ---------------------------------------------------------------------------

describe("createSeededRng", () => {
  it("returns same sequence for same seed", () => {
    const rng1 = createSeededRng(12345)
    const rng2 = createSeededRng(12345)
    const seq1 = Array.from({ length: 10 }, () => rng1())
    const seq2 = Array.from({ length: 10 }, () => rng2())
    expect(seq1).toEqual(seq2)
  })

  it("returns different sequence for different seeds", () => {
    const rng1 = createSeededRng(1)
    const rng2 = createSeededRng(2)
    const first1 = rng1()
    const first2 = rng2()
    expect(first1).not.toBe(first2)
  })
})

// ---------------------------------------------------------------------------
// generateFakeName
// ---------------------------------------------------------------------------

describe("generateFakeName", () => {
  it("returns a non-empty string with a space (first + last name)", () => {
    const rng = createSeededRng(1)
    const name = generateFakeName(rng)
    expect(name).toBeTruthy()
    expect(name.includes(" ")).toBe(true)
  })

  it("is deterministic given same seed", () => {
    const name1 = generateFakeName(createSeededRng(99))
    const name2 = generateFakeName(createSeededRng(99))
    expect(name1).toBe(name2)
  })

  it("avoids collision with real values", () => {
    const rng = createSeededRng(42)
    const first = generateFakeName(rng)
    // Exclude that first name so next call must produce something different
    const realValues = new Set([first])
    const rng2 = createSeededRng(42)
    // consume first call
    generateFakeName(rng2)
    const second = generateFakeName(rng2, realValues)
    // second should not be in realValues
    expect(realValues.has(second)).toBe(false)
  })
})

// ---------------------------------------------------------------------------
// generateFakeEmail
// ---------------------------------------------------------------------------

describe("generateFakeEmail", () => {
  it("contains @ and a domain", () => {
    const rng = createSeededRng(1)
    const email = generateFakeEmail("Alice Dupont", rng)
    expect(email).toContain("@")
    const parts = email.split("@")
    expect(parts).toHaveLength(2)
    expect(parts[1]).toBeTruthy()
  })

  it("derives local part from provided name", () => {
    const rng = createSeededRng(1)
    const email = generateFakeEmail("Alice Dupont", rng)
    expect(email.startsWith("alice")).toBe(true)
  })

  it("is deterministic given same inputs and seed", () => {
    const e1 = generateFakeEmail("Jean Martin", createSeededRng(7))
    const e2 = generateFakeEmail("Jean Martin", createSeededRng(7))
    expect(e1).toBe(e2)
  })
})

// ---------------------------------------------------------------------------
// generateFakePhone
// ---------------------------------------------------------------------------

describe("generateFakePhone", () => {
  it("returns a non-empty string starting with +", () => {
    const rng = createSeededRng(1)
    const phone = generateFakePhone(rng)
    expect(phone).toBeTruthy()
    expect(phone.startsWith("+")).toBe(true)
  })

  it("is deterministic given same seed", () => {
    const p1 = generateFakePhone(createSeededRng(5))
    const p2 = generateFakePhone(createSeededRng(5))
    expect(p1).toBe(p2)
  })
})

// ---------------------------------------------------------------------------
// generateFakeAddress
// ---------------------------------------------------------------------------

describe("generateFakeAddress", () => {
  it("returns a non-empty address string", () => {
    const rng = createSeededRng(1)
    const address = generateFakeAddress(rng)
    expect(address).toBeTruthy()
    expect(address.length).toBeGreaterThan(5)
  })

  it("is deterministic given same seed", () => {
    const a1 = generateFakeAddress(createSeededRng(3))
    const a2 = generateFakeAddress(createSeededRng(3))
    expect(a1).toBe(a2)
  })
})

// ---------------------------------------------------------------------------
// generateFakeFinancial
// ---------------------------------------------------------------------------

describe("generateFakeFinancial", () => {
  it("returns a string that looks like an IBAN (2 letter prefix + 00 + digits)", () => {
    const rng = createSeededRng(1)
    const fin = generateFakeFinancial(rng)
    expect(fin).toMatch(/^[A-Z]{2}00\d+$/)
  })

  it("has invalid checksum (uses 00)", () => {
    const rng = createSeededRng(1)
    const fin = generateFakeFinancial(rng)
    expect(fin.slice(2, 4)).toBe("00")
  })

  it("is deterministic given same seed", () => {
    const f1 = generateFakeFinancial(createSeededRng(11))
    const f2 = generateFakeFinancial(createSeededRng(11))
    expect(f1).toBe(f2)
  })
})

// ---------------------------------------------------------------------------
// generateFakeNationalId
// ---------------------------------------------------------------------------

describe("generateFakeNationalId", () => {
  it("returns a non-empty string", () => {
    const rng = createSeededRng(1)
    const id = generateFakeNationalId(rng)
    expect(id).toBeTruthy()
  })

  it("ends with check key 00 (invalid checksum)", () => {
    const rng = createSeededRng(1)
    const id = generateFakeNationalId(rng)
    expect(id.endsWith("00")).toBe(true)
  })

  it("is deterministic given same seed", () => {
    const id1 = generateFakeNationalId(createSeededRng(8))
    const id2 = generateFakeNationalId(createSeededRng(8))
    expect(id1).toBe(id2)
  })
})

// ---------------------------------------------------------------------------
// generateFakeOrg
// ---------------------------------------------------------------------------

describe("generateFakeOrg", () => {
  it("returns a non-empty string", () => {
    const rng = createSeededRng(1)
    const org = generateFakeOrg(rng)
    expect(org).toBeTruthy()
  })

  it("is deterministic given same seed", () => {
    const o1 = generateFakeOrg(createSeededRng(4))
    const o2 = generateFakeOrg(createSeededRng(4))
    expect(o1).toBe(o2)
  })
})

// ---------------------------------------------------------------------------
// generateFakeDateOfBirth
// ---------------------------------------------------------------------------

describe("generateFakeDateOfBirth", () => {
  it("returns a date in YYYY-MM-DD format", () => {
    const rng = createSeededRng(1)
    const dob = generateFakeDateOfBirth(rng)
    expect(dob).toMatch(/^\d{4}-\d{2}-\d{2}$/)
  })

  it("returns a year in plausible range (1940–2005)", () => {
    const rng = createSeededRng(1)
    const dob = generateFakeDateOfBirth(rng)
    const year = parseInt(dob.split("-")[0]!, 10)
    expect(year).toBeGreaterThanOrEqual(1940)
    expect(year).toBeLessThanOrEqual(2005)
  })

  it("is deterministic given same seed", () => {
    const d1 = generateFakeDateOfBirth(createSeededRng(6))
    const d2 = generateFakeDateOfBirth(createSeededRng(6))
    expect(d1).toBe(d2)
  })
})

// ---------------------------------------------------------------------------
// generateFakeIpAddress
// ---------------------------------------------------------------------------

describe("generateFakeIpAddress", () => {
  it("returns an IP in 10.x.x.x reserved range", () => {
    const rng = createSeededRng(1)
    const ip = generateFakeIpAddress(rng)
    expect(ip).toMatch(/^10\.\d{1,3}\.\d{1,3}\.\d{1,3}$/)
  })

  it("is deterministic given same seed", () => {
    const i1 = generateFakeIpAddress(createSeededRng(2))
    const i2 = generateFakeIpAddress(createSeededRng(2))
    expect(i1).toBe(i2)
  })
})

// ---------------------------------------------------------------------------
// generateFakeValue — dispatch per EntityType
// ---------------------------------------------------------------------------

describe("generateFakeValue — all entity types", () => {
  const types = [
    "PERSON_NAME", "EMAIL", "PHONE", "ADDRESS",
    "FINANCIAL", "NATIONAL_ID", "ORGANIZATION",
    "DATE_OF_BIRTH", "IP_ADDRESS",
  ] as const

  for (const type of types) {
    it(`produces a non-empty value for ${type}`, () => {
      const rng = createSeededRng(42)
      const value = generateFakeValue(type, rng)
      expect(value).toBeTruthy()
    })

    it(`is deterministic for ${type}`, () => {
      const v1 = generateFakeValue(type, createSeededRng(42))
      const v2 = generateFakeValue(type, createSeededRng(42))
      expect(v1).toBe(v2)
    })
  }
})
