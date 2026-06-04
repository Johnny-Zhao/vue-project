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

export interface DemoTaskItem {
  id: number
  title: string
  owner: string
  status: string
  priority: string
}

export interface EchoPayloadResult {
  receivedAt: string
  keys: string[]
  payload: Record<string, unknown>
}
