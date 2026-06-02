import {
  createApiFailureResponse,
  createApiSuccessResponse,
  mockApiRequest,
} from '@/api/request'
import type { ListResponse } from '@/types/request'
import type { CreateTaskForm, StudyTask } from './types'

const initialMockTasks: StudyTask[] = [
  {
    id: 1,
    title: 'Learn TypeScript basics',
    summary: 'Review interfaces, unions, generics, and utility types.',
    category: 'TypeScript',
    status: 'doing',
    priority: 'high',
    estimateHours: 8,
  },
  {
    id: 2,
    title: 'Refactor page logic into composables',
    summary: 'Split search, sorting, paging, and form logic into reusable hooks.',
    category: 'Vue',
    status: 'todo',
    priority: 'medium',
    estimateHours: 5,
  },
  {
    id: 3,
    title: 'Compare React and Vue component patterns',
    summary: 'Practice props, hooks, forms, and list rendering in both ecosystems.',
    category: 'React',
    status: 'todo',
    priority: 'medium',
    estimateHours: 6,
  },
]

const mockTaskDatabase: StudyTask[] = [...initialMockTasks]

export async function fetchTaskListApi() {
  return mockApiRequest<ListResponse<StudyTask>>(
    () =>
      createApiSuccessResponse({
        list: [...mockTaskDatabase],
        total: mockTaskDatabase.length,
      }),
    {
      dedupeKey: 'task:list',
    },
  )
}

export async function createTaskApi(payload: CreateTaskForm) {
  return mockApiRequest<StudyTask>(
    () => {
      const currentMaxId = mockTaskDatabase.reduce((maxId, task) => Math.max(maxId, task.id), 0)
      const nextTask: StudyTask = {
        id: currentMaxId + 1,
        ...payload,
      }

      mockTaskDatabase.push(nextTask)
      return createApiSuccessResponse(nextTask, 'Task created.')
    },
    {
      dedupeKey: 'task:create',
    },
  )
}

export async function updateTaskApi(taskId: number, payload: CreateTaskForm) {
  return mockApiRequest<StudyTask>(
    () => {
      const targetIndex = mockTaskDatabase.findIndex((task) => task.id === taskId)
      if (targetIndex === -1) {
        return createApiFailureResponse(404, `Task ${taskId} not found.`)
      }

      const currentTask = mockTaskDatabase[targetIndex]
      if (!currentTask) {
        return createApiFailureResponse(404, `Task ${taskId} not found.`)
      }

      mockTaskDatabase[targetIndex] = {
        ...currentTask,
        ...payload,
      }

      return createApiSuccessResponse(mockTaskDatabase[targetIndex], 'Task updated.')
    },
    {
      dedupeKey: `task:update:${taskId}`,
    },
  )
}

export async function deleteTaskApi(taskId: number) {
  return mockApiRequest<{ id: number }>(
    () => {
      const targetIndex = mockTaskDatabase.findIndex((task) => task.id === taskId)
      if (targetIndex === -1) {
        return createApiFailureResponse(404, `Task ${taskId} not found.`)
      }

      mockTaskDatabase.splice(targetIndex, 1)
      return createApiSuccessResponse({ id: taskId }, 'Task deleted.')
    },
    {
      dedupeKey: `task:delete:${taskId}`,
    },
  )
}
