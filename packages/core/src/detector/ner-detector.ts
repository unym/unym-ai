import type { Entity, EntityType } from "../types"
import { getGlinerInstance } from "./model-loader"

// ---------------------------------------------------------------------------
// Label mapping
// ---------------------------------------------------------------------------

/** Zero-shot labels passed to GLiNER at inference time */
const NER_LABELS = [
  "person name",
  "organization",
  "street address",
  "date of birth",
] as const

const LABEL_TO_ENTITY_TYPE: Record<string, EntityType> = {
  "person name": "PERSON_NAME",
  organization: "ORGANIZATION",
  "street address": "ADDRESS",
  "date of birth": "DATE_OF_BIRTH",
}

// ---------------------------------------------------------------------------
// Chunking
// ---------------------------------------------------------------------------

const MAX_CHUNK_CHARS = 1_000

/** Split text on sentence boundaries, keeping chunks under MAX_CHUNK_CHARS */
function chunkText(text: string): Array<{ text: string; offset: number }> {
  if (text.length <= MAX_CHUNK_CHARS) return [{ text, offset: 0 }]

  const chunks: Array<{ text: string; offset: number }> = []
  // Split on sentence-ending punctuation followed by whitespace
  const sentenceEnds = /[.!?]\s+/g
  let chunkStart = 0
  let lastSentenceEnd = 0

  for (const match of text.matchAll(sentenceEnds)) {
    const pos = match.index! + match[0].length
    if (pos - chunkStart > MAX_CHUNK_CHARS && lastSentenceEnd > chunkStart) {
      chunks.push({
        text: text.slice(chunkStart, lastSentenceEnd),
        offset: chunkStart,
      })
      chunkStart = lastSentenceEnd
    }
    lastSentenceEnd = pos
  }

  // Remainder
  if (chunkStart < text.length) {
    // If remaining is still too long, hard-split
    let pos = chunkStart
    while (pos < text.length) {
      chunks.push({
        text: text.slice(pos, pos + MAX_CHUNK_CHARS),
        offset: pos,
      })
      pos += MAX_CHUNK_CHARS
    }
  }

  return chunks.length > 0 ? chunks : [{ text, offset: 0 }]
}

// ---------------------------------------------------------------------------
// Detector
// ---------------------------------------------------------------------------

/**
 * Detects contextual PII using GLiNER zero-shot NER.
 * Throws if the model is not loaded.
 */
export async function detectWithNer(text: string): Promise<Entity[]> {
  const gliner = getGlinerInstance()
  if (!gliner) throw new Error("NER model not loaded")

  const chunks = chunkText(text)
  const allEntities: Entity[] = []

  for (const chunk of chunks) {
    const results = await gliner.inference({
      texts: [chunk.text],
      entities: [...NER_LABELS],
      threshold: 0.4,
      flatNer: true,
    })

    const chunkEntities = results[0] ?? []
    for (const { spanText, start, end, label, score } of chunkEntities) {
      const type = LABEL_TO_ENTITY_TYPE[label]
      if (!type) continue
      allEntities.push({
        type,
        value: spanText,
        startIndex: chunk.offset + start,
        endIndex: chunk.offset + end,
        confidence: score,
        source: "ner",
      })
    }
  }

  return allEntities.sort((a, b) => a.startIndex - b.startIndex)
}
