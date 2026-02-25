import type { EntityType } from "../types/entities"

// ---------------------------------------------------------------------------
// Seeded PRNG (Mulberry32) — deterministic, no external dependency
// ---------------------------------------------------------------------------

function mulberry32(seed: number): () => number {
  let s = seed
  return function () {
    s |= 0
    s = (s + 0x6d2b79f5) | 0
    let t = Math.imul(s ^ (s >>> 15), 1 | s)
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296
  }
}

export function createSeededRng(seed: number): () => number {
  return mulberry32(seed)
}

function pick<T>(arr: T[], rng: () => number): T {
  if (arr.length === 0) throw new Error("pick() called with empty array")
  return arr[Math.floor(rng() * arr.length)]!
}

function randInt(min: number, max: number, rng: () => number): number {
  return min + Math.floor(rng() * (max - min + 1))
}

// ---------------------------------------------------------------------------
// Static fake data — locale-aware (FR, EN, DE, ES, IT, PT)
// ---------------------------------------------------------------------------

export const FAKE_FIRST_NAMES_FR = [
  "Alice", "Baptiste", "Camille", "David", "Emma", "François",
  "Gabriel", "Héloïse", "Inès", "Julien", "Karine", "Laurent",
  "Marie", "Nicolas", "Océane", "Pierre", "Quentin", "Rachel",
  "Sophie", "Thomas",
]

export const FAKE_FIRST_NAMES_EN = [
  "Adam", "Bella", "Charlie", "Diana", "Ethan", "Fiona",
  "George", "Hannah", "Isaac", "Julia", "Kevin", "Laura",
  "Michael", "Natalie", "Oliver", "Patricia", "Quinn", "Rebecca",
  "Samuel", "Tara",
]

export const FAKE_FIRST_NAMES_DE = [
  "Alexander", "Britta", "Christian", "Daniela", "Erik", "Franziska",
  "Günther", "Helga", "Ingo", "Jana", "Klaus", "Lisa",
  "Markus", "Nina", "Otto", "Petra", "Ralf", "Sabine",
  "Stefan", "Ursula",
]

export const FAKE_FIRST_NAMES_ES = [
  "Alejandro", "Beatriz", "Carlos", "Diana", "Eduardo", "Fernanda",
  "Gonzalo", "Helena", "Ignacio", "Juana", "Luis", "María",
  "Miguel", "Nuria", "Oscar", "Paula", "Ramón", "Sara",
  "Tomás", "Valentina",
]

export const FAKE_FIRST_NAMES_IT = [
  "Alessandro", "Bianca", "Carlo", "Daniela", "Emilio", "Federica",
  "Giorgio", "Isabella", "Lorenzo", "Lucia", "Marco", "Martina",
  "Paolo", "Roberta", "Sergio", "Silvia", "Stefano", "Teresa",
  "Valentino", "Viviana",
]

export const FAKE_FIRST_NAMES_PT = [
  "André", "Beatriz", "Carlos", "Diana", "Eduardo", "Fernanda",
  "Gustavo", "Helena", "João", "Joana", "Lucas", "Mariana",
  "Pedro", "Rita", "Rodrigo", "Sofia", "Tiago", "Vera",
  "Victor", "Vanessa",
]

export const FAKE_LAST_NAMES_FR = [
  "Dupont", "Martin", "Lefevre", "Moreau", "Simon", "Laurent",
  "Lefebvre", "Michel", "Garcia", "Bernard", "Thomas", "Robert",
  "Richard", "Petit", "Durand", "Leroy", "Morel", "Fontaine",
  "Henry", "Rousseau",
]

export const FAKE_LAST_NAMES_EN = [
  "Smith", "Johnson", "Williams", "Brown", "Jones", "Miller",
  "Davis", "Wilson", "Moore", "Taylor", "Anderson", "Thomas",
  "Jackson", "White", "Harris", "Martin", "Thompson", "Garcia",
  "Martinez", "Robinson",
]

export const FAKE_LAST_NAMES_DE = [
  "Müller", "Schmidt", "Schneider", "Fischer", "Weber", "Meyer",
  "Wagner", "Becker", "Schulz", "Hoffmann", "Koch", "Richter",
  "Bauer", "Klein", "Wolf", "Schröder", "Neumann", "Schwarz",
  "Braun", "Zimmermann",
]

export const FAKE_LAST_NAMES_ES = [
  "García", "González", "Rodríguez", "Fernández", "López", "Martínez",
  "Sánchez", "Pérez", "Gómez", "Martín", "Jiménez", "Ruiz",
  "Hernández", "Díaz", "Moreno", "Muñoz", "Álvarez", "Romero",
  "Alonso", "Gutiérrez",
]

export const FAKE_LAST_NAMES_IT = [
  "Rossi", "Russo", "Ferrari", "Esposito", "Bianchi", "Romano",
  "Colombo", "Ricci", "Marino", "Greco", "Bruno", "Gallo",
  "Conti", "De Luca", "Costa", "Mancini", "Giordano", "Rizzo",
  "Lombardi", "Barbieri",
]

export const FAKE_LAST_NAMES_PT = [
  "Silva", "Santos", "Ferreira", "Pereira", "Oliveira", "Costa",
  "Rodrigues", "Martins", "Jesus", "Sousa", "Fernandes", "Gonçalves",
  "Gomes", "Lopes", "Marques", "Alves", "Almeida", "Ribeiro",
  "Pinto", "Carvalho",
]

const ALL_FIRST_NAMES = [
  ...FAKE_FIRST_NAMES_FR,
  ...FAKE_FIRST_NAMES_EN,
  ...FAKE_FIRST_NAMES_DE,
  ...FAKE_FIRST_NAMES_ES,
  ...FAKE_FIRST_NAMES_IT,
  ...FAKE_FIRST_NAMES_PT,
]

const ALL_LAST_NAMES = [
  ...FAKE_LAST_NAMES_FR,
  ...FAKE_LAST_NAMES_EN,
  ...FAKE_LAST_NAMES_DE,
  ...FAKE_LAST_NAMES_ES,
  ...FAKE_LAST_NAMES_IT,
  ...FAKE_LAST_NAMES_PT,
]

export const FAKE_ORG_NAMES = [
  "Nexova Solutions", "Brightwave Technologies", "Arcadia Group",
  "Luminos Corp", "Meridian Partners", "Zenith Industries",
  "Cobalt Ventures", "Prism Analytics", "Stratus Networks",
  "Quartz Digital", "Vantage Capital", "Pinnacle Systems",
  "Aurora Dynamics", "Horizon Labs", "Stellar Consulting",
  "Vertex Inc", "Cascade Enterprises", "Mosaic Group",
  "Ember Technologies", "Solstice Partners",
]

const FAKE_CITIES = [
  "Paris", "Lyon", "Marseille", "Berlin", "Munich", "Hamburg",
  "Madrid", "Barcelona", "Valencia", "Rome", "Milan", "Naples",
  "London", "Manchester", "Birmingham", "Lisbon", "Porto", "Braga",
  "Buenos Aires", "Seville",
]

const FAKE_STREETS = [
  "12 Rue de la Paix", "47 Avenue des Fleurs", "3 Boulevard Haussmann",
  "89 Hauptstraße", "22 Müllerstraße", "5 Bahnhofplatz",
  "15 Calle Mayor", "73 Paseo de Gracia", "8 Avenida de la Constitución",
  "34 Via Roma", "67 Corso Garibaldi", "2 Piazza della Repubblica",
  "101 High Street", "55 King's Road", "18 Oxford Street",
  "9 Rua Augusta", "41 Avenida da Liberdade", "27 Rua do Ouro",
]

const FAKE_POSTAL_CODES: Record<string, string[]> = {
  FR: ["75001", "69001", "13001", "33000", "31000", "44000"],
  DE: ["10115", "80333", "20095", "40210", "50667", "70173"],
  ES: ["28001", "08001", "46001", "41001", "29001", "48001"],
  IT: ["00100", "20100", "80100", "10100", "40100", "50100"],
  EN: ["EC1A 1BB", "W1A 0AX", "M1 1AE", "B1 1BB", "E1 6AN", "N1 9GU"],
  PT: ["1000-001", "4000-001", "3000-001", "2000-001", "8000-001", "9000-001"],
}

// ---------------------------------------------------------------------------
// Transliteration — normalize non-ASCII chars for email local-part generation
// ---------------------------------------------------------------------------

function transliterate(str: string): string {
  // NFD decomposition removes most combining diacritical marks (é→e, ü→u, etc.)
  // Then handle ligatures and special chars not covered by decomposition
  return str
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[ø]/gi, "o")
    .replace(/[ł]/gi, "l")
    .replace(/[ß]/g, "ss")
    .replace(/[æ]/gi, "ae")
    .replace(/[œ]/gi, "oe")
}

// ---------------------------------------------------------------------------
// Fake email domains
// ---------------------------------------------------------------------------

const FAKE_EMAIL_DOMAINS = [
  "example.com", "test.org", "sample.net", "demo.io",
  "placeholder.com", "fakemail.org",
]

// ---------------------------------------------------------------------------
// Generator functions
// ---------------------------------------------------------------------------

export function generateFakeName(rng: () => number, realValues: Set<string> = new Set()): string {
  for (let attempt = 0; attempt < 20; attempt++) {
    const first = pick(ALL_FIRST_NAMES, rng)
    const last = pick(ALL_LAST_NAMES, rng)
    const name = `${first} ${last}`
    if (!realValues.has(name)) return name
  }
  // Fallback: append index to guarantee no collision
  return `${pick(ALL_FIRST_NAMES, rng)} ${pick(ALL_LAST_NAMES, rng)}_fake`
}

export function generateFakeEmail(fakeName: string, rng: () => number, realValues: Set<string> = new Set()): string {
  const parts = transliterate(fakeName).toLowerCase().replace(/[^a-z0-9]/g, ".").split(".").filter(Boolean)
  const local = parts.join(".")
  for (let attempt = 0; attempt < 20; attempt++) {
    const domain = pick(FAKE_EMAIL_DOMAINS, rng)
    const email = `${local}@${domain}`
    if (!realValues.has(email)) return email
  }
  return `${local}.fake@example.com`
}

export function generateFakePhone(rng: () => number, realValues: Set<string> = new Set()): string {
  const formats = [
    () => `+33 6 ${randInt(10, 99, rng)} ${randInt(10, 99, rng)} ${randInt(10, 99, rng)} ${randInt(10, 99, rng)}`,
    () => `+49 ${randInt(30, 89, rng)} ${randInt(1000000, 9999999, rng)}`,
    () => `+34 6${randInt(10, 99, rng)} ${randInt(100, 999, rng)} ${randInt(100, 999, rng)}`,
    () => `+39 3${randInt(10, 99, rng)} ${randInt(100, 999, rng)} ${randInt(1000, 9999, rng)}`,
    () => `+351 9${randInt(10, 99, rng)} ${randInt(100, 999, rng)} ${randInt(100, 999, rng)}`,
    () => `+1 ${randInt(200, 999, rng)} ${randInt(200, 999, rng)} ${randInt(1000, 9999, rng)}`,
  ]
  for (let attempt = 0; attempt < 20; attempt++) {
    const phone = pick(formats, rng)()
    if (!realValues.has(phone)) return phone
  }
  return "+33 6 00 00 00 00"
}

export function generateFakeAddress(rng: () => number, realValues: Set<string> = new Set()): string {
  const locales = Object.keys(FAKE_POSTAL_CODES) as Array<keyof typeof FAKE_POSTAL_CODES>
  for (let attempt = 0; attempt < 20; attempt++) {
    const locale = pick(locales, rng)
    const street = pick(FAKE_STREETS, rng)
    const city = pick(FAKE_CITIES, rng)
    const postal = pick(FAKE_POSTAL_CODES[locale]!, rng)
    const address = `${street}, ${postal} ${city}`
    if (!realValues.has(address)) return address
  }
  return "1 Fake Street, 00000 Faketown"
}

export function generateFakeFinancial(rng: () => number, realValues: Set<string> = new Set()): string {
  // Fake IBAN with intentionally invalid checksum (uses 00 as check digits)
  const countryCodes = ["FR00", "DE00", "ES00", "IT00", "GB00", "PT00"]
  for (let attempt = 0; attempt < 20; attempt++) {
    const prefix = pick(countryCodes, rng)
    const bban = Array.from({ length: 20 }, () => randInt(0, 9, rng)).join("")
    const iban = `${prefix}${bban}`
    if (!realValues.has(iban)) return iban
  }
  return "FR0000000000000000000000"
}

export function generateFakeNationalId(rng: () => number, realValues: Set<string> = new Set()): string {
  const LETTERS = "ABCDEFGHIJKLMNOPRSTUVWXYZ".split("")

  // One generator per supported locale — all produce values with "00" as
  // the trailing check digits, making the checksum intentionally invalid.
  const formats: Array<() => string> = [
    // FR: NIR-style (sex yy mm dept commune order 00)
    () => {
      const sex = randInt(1, 2, rng)
      const year = randInt(50, 99, rng).toString().padStart(2, "0")
      const mo = randInt(1, 12, rng).toString().padStart(2, "0")
      const dept = randInt(1, 95, rng).toString().padStart(2, "0")
      const commune = randInt(1, 999, rng).toString().padStart(3, "0")
      const order = randInt(1, 999, rng).toString().padStart(3, "0")
      return `${sex} ${year} ${mo} ${dept} ${commune} ${order} 00`
    },
    // DE: German ID card-style (letter + 7 digits + 00)
    () => {
      const letter = pick(LETTERS, rng)
      const digits = Array.from({ length: 7 }, () => randInt(0, 9, rng)).join("")
      return `${letter}${digits}00`
    },
    // ES: Spanish DNI-style (8 digits + -00)
    () => {
      const digits = Array.from({ length: 8 }, () => randInt(0, 9, rng)).join("")
      return `${digits}-00`
    },
    // UK: NI-style (AB nn nn nn 00)
    () => {
      const l1 = pick(LETTERS, rng)
      const l2 = pick(LETTERS, rng)
      const n1 = randInt(10, 99, rng)
      const n2 = randInt(10, 99, rng)
      const n3 = randInt(10, 99, rng)
      return `${l1}${l2} ${n1} ${n2} ${n3} 00`
    },
  ]

  for (let attempt = 0; attempt < 20; attempt++) {
    const id = pick(formats, rng)()
    if (!realValues.has(id)) return id
  }
  return "1 00 01 00 000 000 00"
}

export function generateFakeOrg(rng: () => number, realValues: Set<string> = new Set()): string {
  for (let attempt = 0; attempt < 20; attempt++) {
    const org = pick(FAKE_ORG_NAMES, rng)
    if (!realValues.has(org)) return org
  }
  return "Fake Corp Inc"
}

export function generateFakeDateOfBirth(rng: () => number, realValues: Set<string> = new Set()): string {
  const DAYS_IN_MONTH = [31, 29, 31, 30, 31, 30, 31, 31, 30, 31, 30, 31]
  for (let attempt = 0; attempt < 20; attempt++) {
    const year = randInt(1940, 2005, rng)
    const monthNum = randInt(1, 12, rng)
    const month = monthNum.toString().padStart(2, "0")
    const day = randInt(1, DAYS_IN_MONTH[monthNum - 1]!, rng).toString().padStart(2, "0")
    const date = `${year}-${month}-${day}`
    if (!realValues.has(date)) return date
  }
  return "1970-01-01"
}

export function generateFakeIpAddress(rng: () => number, realValues: Set<string> = new Set()): string {
  // Always use 10.x.x.x reserved range
  for (let attempt = 0; attempt < 20; attempt++) {
    const ip = `10.${randInt(0, 255, rng)}.${randInt(0, 255, rng)}.${randInt(1, 254, rng)}`
    if (!realValues.has(ip)) return ip
  }
  return "10.0.0.1"
}

// ---------------------------------------------------------------------------
// Unified dispatch by EntityType
// ---------------------------------------------------------------------------

export function generateFakeValue(
  type: EntityType,
  rng: () => number,
  realValues: Set<string> = new Set(),
  context?: { fakeName?: string }
): string {
  switch (type) {
    case "PERSON_NAME":
      return generateFakeName(rng, realValues)
    case "EMAIL": {
      const fakeName = context?.fakeName ?? generateFakeName(rng, realValues)
      return generateFakeEmail(fakeName, rng, realValues)
    }
    case "PHONE":
      return generateFakePhone(rng, realValues)
    case "ADDRESS":
      return generateFakeAddress(rng, realValues)
    case "FINANCIAL":
      return generateFakeFinancial(rng, realValues)
    case "NATIONAL_ID":
      return generateFakeNationalId(rng, realValues)
    case "ORGANIZATION":
      return generateFakeOrg(rng, realValues)
    case "DATE_OF_BIRTH":
      return generateFakeDateOfBirth(rng, realValues)
    case "IP_ADDRESS":
      return generateFakeIpAddress(rng, realValues)
  }
}
