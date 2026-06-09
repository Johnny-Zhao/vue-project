export interface DemoTask {
  id: number
  title: string
  owner: string
  status: 'todo' | 'doing' | 'done'
  priority: 'low' | 'medium' | 'high'
}

export interface ExpressOverview {
  project: string
  stack: string[]
  description: string
  conventions: string[]
}

export interface ExpressStructureItem {
  path: string
  role: string
}
