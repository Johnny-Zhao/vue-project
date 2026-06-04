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
  status: 'todo' | 'doing' | 'done'
  priority: 'low' | 'medium' | 'high'
  assignee: string
  description: string
  createdAt: string
  updatedAt: string
}

export interface TutorialTaskPayload {
  title: string
  status: 'todo' | 'doing' | 'done'
  priority: 'low' | 'medium' | 'high'
  assignee: string
  description: string
}

export interface TutorialTaskQuery {
  status?: string
  keyword?: string
}
