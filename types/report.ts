export type StatusType =
  | "Adequado"
  | "Baixo"
  | "Muito baixo"
  | "Baixo risco"
  | "Alto"
  | "Muito alto"

export interface ReportItem {
  name: string
  value?: string
  unit?: string
  status: StatusType
  notes?: string
}

export interface NutritionalCategory {
  category: string
  items: ReportItem[]
}

export interface ScoreCategory {
  name: string
  score: number
}

export interface ReportData {
  patient?: {
    name?: string
    age?: number
    collectionDate?: string
  }
  nutritionalStatus: NutritionalCategory[]
  coreScore: {
    overall: number
    categories: ScoreCategory[]
  }
  interpretation: {
    positives: string[]
    attentionPoints: string[]
  }
}
