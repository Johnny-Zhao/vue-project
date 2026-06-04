import { demoTasks, expressOverview, expressStructure } from '../data/demo.data.js'

export function getServerHealth() {
  return {
    status: 'ok',
    service: 'express-demo-server',
    now: new Date().toISOString(),
  }
}

export function getExpressOverview() {
  return expressOverview
}

export function getExpressStructure() {
  return expressStructure
}

export function listDemoTasks() {
  return demoTasks
}

export function getDemoTaskById(id) {
  return demoTasks.find((item) => item.id === id) ?? null
}

export function createEchoPayload(body) {
  return {
    receivedAt: new Date().toISOString(),
    keys: Object.keys(body ?? {}),
    payload: body ?? {},
  }
}
