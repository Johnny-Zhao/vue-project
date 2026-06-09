export type TutorialTaskStatus = 'todo' | 'doing' | 'done'
export type TutorialTaskPriority = 'low' | 'medium' | 'high'

export interface TutorialMiddlewareItem {
  name: string
  role: string
}

export interface TutorialEndpointItem {
  method: string
  path: string
  description: string
}

export interface TutorialDatabaseInfo {
  engine: string
  command?: string
  file: string
  table: string
}

export interface TutorialGuide {
  title: string
  summary: string
  flowSteps: string[]
  middlewares: TutorialMiddlewareItem[]
  endpoints: TutorialEndpointItem[]
  database: TutorialDatabaseInfo
}

export interface TutorialTask {
  id: number
  title: string
  status: TutorialTaskStatus
  priority: TutorialTaskPriority
  assignee: string
  description: string
  createdAt: string
  updatedAt: string
}

export interface TutorialTaskPayload {
  title: string
  status: TutorialTaskStatus
  priority: TutorialTaskPriority
  assignee: string
  description: string
}

export interface TutorialTaskQuery {
  status?: string
  keyword?: string
  page?: number | string
  pageSize?: number | string
}

export interface TutorialTaskFilters {
  status: string
  keyword: string
  page: number
  pageSize: number
}

export interface TutorialTaskPageResult {
  list: TutorialTask[]
  total: number
  page: number
  pageSize: number
}

export interface TutorialTaskRow {
  id: number | string
  title: string
  status: TutorialTaskStatus
  priority: TutorialTaskPriority
  assignee: string
  description: string
  createdAt: string
  updatedAt: string
}
