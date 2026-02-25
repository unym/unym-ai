export type EntityType =
  | "PERSON_NAME"
  | "EMAIL"
  | "PHONE"
  | "ADDRESS"
  | "FINANCIAL"
  | "NATIONAL_ID"
  | "ORGANIZATION"
  | "DATE_OF_BIRTH"
  | "IP_ADDRESS"

export interface Entity {
  type: EntityType
  value: string
  startIndex: number
  endIndex: number
  confidence: number
  source: "regex" | "ner"
}
