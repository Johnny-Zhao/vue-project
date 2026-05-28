export type StudyStatus = 'todo' | 'doing' | 'done'

export type StudyCategory = 'TypeScript' | 'Vue' | 'React' | 'Node' | 'AI'

export type PriorityLevel = 'high' | 'medium' | 'low'

export interface StudyTask {
  id: number | null
  title: string
  summary: string
  category: StudyCategory
  status: StudyStatus
  priority: PriorityLevel
  estimateHours: number
}

export interface SummaryCard {
  label: string
  value: string
  hint: string
}
