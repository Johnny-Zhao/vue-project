import { demoTasks, expressOverview, expressStructure } from '../data/demo.data.ts'
import type { DemoTask, ExpressOverview, ExpressStructureItem } from '../types/demo.ts'

export function getServerHealth() {
  return {
    status: 'ok',
    service: 'express-demo-server',
    now: new Date().toISOString(),
  }
}

export function getExpressOverview(): ExpressOverview {
  return expressOverview
}

export function getExpressStructure(): ExpressStructureItem[] {
  return expressStructure
}

export function listDemoTasks(): DemoTask[] {
  return demoTasks
}

export function getDemoTaskById(id: number): DemoTask | null {
  return demoTasks.find((item) => item.id === id) ?? null
}

export function createEchoPayload(body: unknown) {
  const payload = body && typeof body === 'object' ? body : {}

  return {
    receivedAt: new Date().toISOString(),
    keys: Object.keys(payload),
    payload,
  }
}
