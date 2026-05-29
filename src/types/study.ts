export type StudyStatus = 'todo' | 'doing' | 'done'

export type StudyCategory = 'TypeScript' | 'Vue' | 'React' | 'Node' | 'AI'

export type PriorityLevel = 'high' | 'medium' | 'low'

export interface StudyTask {
  id: number
  title: string
  summary: string
  category: StudyCategory
  status: StudyStatus
  priority: PriorityLevel
  estimateHours: number
}

export type CreateTaskForm = Omit<StudyTask, 'id'>

export interface SummaryCard {
  label: string
  value: string
  hint: string
}

export type DialogMode = 'create' | 'edit'

export type SortDirection = 'asc' | 'desc'

export type TaskSortField = keyof Pick<
  StudyTask,
  'title' | 'estimateHours' | 'status' | 'priority'
>
