/**
 * Smoke test: load a real GLiNER model and exercise the full detect() pipeline.
 *
 * Usage:
 *   pnpm --filter @unym/core test:model
 *   pnpm --filter @unym/core test:model /path/to/model.onnx
 */

import { existsSync, mkdirSync, writeFileSync } from "node:fs"
import { join } from "node:path"
import { homedir } from "node:os"

// ort-resolve hook (registered via --import) fixes the CJS/ESM interop
// so this static import now works correctly:
import { Gliner } from "gliner/node"

import { _setLoadedInstance, detect, NER_MODEL_ID } from "../src/index.ts"

// ---------------------------------------------------------------------------
// Model download / cache
// ---------------------------------------------------------------------------

const CACHE_DIR = join(
  homedir(),
  ".cache",
  "gliner",
  NER_MODEL_ID.replace("/", "_"),
)
const CACHED_MODEL = join(CACHE_DIR, "model.onnx")
const HF_CANDIDATE_PATHS = ["onnx/model.onnx", "model.onnx"]
const HF_BASE = `https://huggingface.co/${NER_MODEL_ID}/resolve/main`

async function downloadModel(): Promise<string> {
  mkdirSync(CACHE_DIR, { recursive: true })
  console.log("Model not in cache — downloading from HuggingFace...")

  for (const candidate of HF_CANDIDATE_PATHS) {
    const url = `${HF_BASE}/${candidate}`
    console.log(`  Trying ${url} ...`)

    const res = await fetch(url)
    if (!res.ok) {
      console.log(`  → ${res.status} ${res.statusText}, skipping`)
      continue
    }

    const buf = Buffer.from(await res.arrayBuffer())
    writeFileSync(CACHED_MODEL, buf)
    console.log(
      `  ✓ Saved ${(buf.byteLength / 1_048_576).toFixed(1)} MB → ${CACHED_MODEL}`,
    )
    return CACHED_MODEL
  }

  throw new Error(
    `Could not download model from HuggingFace.\n` +
      `Tried:\n${HF_CANDIDATE_PATHS.map((p) => `  ${HF_BASE}/${p}`).join("\n")}\n` +
      `You can pass a local ONNX path as an argument instead.`,
  )
}

async function ensureModel(localOverride?: string): Promise<string> {
  if (localOverride) {
    if (!existsSync(localOverride))
      throw new Error(`Model file not found: ${localOverride}`)
    console.log(`Using local model: ${localOverride}`)
    return localOverride
  }

  if (existsSync(CACHED_MODEL)) {
    console.log(`Using cached model: ${CACHED_MODEL}`)
    return CACHED_MODEL
  }

  return downloadModel()
}

// ---------------------------------------------------------------------------
// Test cases
// ---------------------------------------------------------------------------

const TEST_CASES = [
  {
    label: "Person + email",
    text: "My name is Jean Dupont and you can reach me at jean.dupont@example.fr.",
  },
  {
    label: "Org + address",
    text: "Please invoice Acme Corp at 42 Baker Street, London.",
  },
  {
    label: "Person + DOB",
    text: "Sophie Martin was born on 3rd March 1985 and works at the European Commission.",
  },
  {
    label: "Credit card + IBAN",
    text: "Card 4111 1111 1111 1111 and IBAN FR7630006000011234567890189.",
  },
  {
    label: "Phone + NIR",
    text: "Call +33 6 12 34 56 78. NIR: 1 85 05 78 006 084 91.",
  },
]

// ---------------------------------------------------------------------------
// Main
// ---------------------------------------------------------------------------

async function main() {
  const modelPath = await ensureModel(process.argv[2])

  console.log(`\nModel: ${NER_MODEL_ID}`)
  console.log("Initializing...\n")

  const gliner = new Gliner({
    tokenizerPath: NER_MODEL_ID,
    onnxSettings: {
      modelPath,
      executionProvider: "cpu",
    },
  })

  const t0 = performance.now()
  await gliner.initialize()
  console.log(`Ready in ${(performance.now() - t0).toFixed(0)}ms\n`)

  _setLoadedInstance(gliner)

  for (const { label, text } of TEST_CASES) {
    console.log(`[${label}]`)
    console.log(`  "${text}"`)

    const result = await detect(text, { sensitivity: "medium" })
    console.log(
      `  Tier ${result.tierComplete}  Risk: ${result.riskScore.level} (${result.riskScore.score})  ${result.processingTimeMs.toFixed(0)}ms`,
    )

    if (result.entities.length === 0) {
      console.log("  (no entities detected)")
    } else {
      for (const e of result.entities) {
        console.log(
          `  [${e.source.padEnd(5)}] ${e.type.padEnd(15)}  "${e.value}"  conf=${e.confidence.toFixed(2)}`,
        )
      }
    }
    console.log()
  }
}

main()