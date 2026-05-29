import { mockRequest } from '@/api/request'
import type { CreateTaskForm, StudyTask } from '@/types/study'
import type { ListResponse } from '@/types/request'

const initialMockTasks: StudyTask[] = [
  {
    id: 1,
    title: '补齐 TypeScript 基础',
    summary: '先吃透 interface、联合类型、泛型和工具类型，再往框架写法里落。',
    category: 'TypeScript',
    status: 'doing',
    priority: 'high',
    estimateHours: 8,
  },
  {
    id: 2,
    title: '用 Vue3 抽一遍 composables',
    summary: '把筛选、排序、分页、表单逻辑拆开，理解组合式复用。',
    category: 'Vue',
    status: 'todo',
    priority: 'medium',
    estimateHours: 5,
  },
  {
    id: 3,
    title: '补 React + TS 组件思维',
    summary: '把 props、hooks、表单和列表场景过一遍，建立框架迁移感觉。',
    category: 'React',
    status: 'todo',
    priority: 'medium',
    estimateHours: 6,
  },
  {
    id: 4,
    title: '补一点 Node 工具能力',
    summary: '先会写简单脚本、代理和文件处理，不需要一上来学很深。',
    category: 'Node',
    status: 'todo',
    priority: 'medium',
    estimateHours: 4,
  },
  {
    id: 5,
    title: '做一个 AI 接入小功能',
    summary: '比如输入需求后生成结构化分析，让项目更像真实求职作品。',
    category: 'AI',
    status: 'done',
    priority: 'high',
    estimateHours: 6,
  },
]

const mockTaskDatabase: StudyTask[] = [...initialMockTasks]

export async function fetchTaskListApi() {
  const payload: ListResponse<StudyTask> = {
    list: [...mockTaskDatabase],
    total: mockTaskDatabase.length,
  }

  return mockRequest(payload)
}

export async function createTaskApi(payload: CreateTaskForm) {
  const currentMaxId = mockTaskDatabase.reduce((maxId, task) => Math.max(maxId, task.id), 0)
  const nextTask: StudyTask = {
    id: currentMaxId + 1,
    ...payload,
  }

  mockTaskDatabase.push(nextTask)
  return mockRequest(nextTask, { message: 'task created' })
}

export async function updateTaskApi(taskId: number, payload: CreateTaskForm) {
  const targetIndex = mockTaskDatabase.findIndex((task) => task.id === taskId)
  if (targetIndex === -1) {
    throw new Error(`Task ${taskId} not found`)
  }

  const currentTask = mockTaskDatabase[targetIndex]
  if (!currentTask) {
    throw new Error(`Task ${taskId} not found`)
  }

  mockTaskDatabase[targetIndex] = {
    ...currentTask,
    ...payload,
  }

  return mockRequest(mockTaskDatabase[targetIndex], { message: 'task updated' })
}

export async function deleteTaskApi(taskId: number) {
  const targetIndex = mockTaskDatabase.findIndex((task) => task.id === taskId)
  if (targetIndex === -1) {
    throw new Error(`Task ${taskId} not found`)
  }

  mockTaskDatabase.splice(targetIndex, 1)
  return mockRequest({ id: taskId }, { message: 'task deleted' })
}
