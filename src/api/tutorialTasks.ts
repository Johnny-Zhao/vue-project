import { requestApi } from '@/api/request'
import type {
  TutorialGuide,
  TutorialTask,
  TutorialTaskPageResult,
  TutorialTaskPayload,
  TutorialTaskQuery,
} from '@/types/tutorialTask'

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL ?? '/api'

export function fetchTutorialGuideApi() {
  return requestApi<TutorialGuide>({
    url: '/tutorial/guide',
    method: 'GET',
    baseURL: API_BASE_URL,
    auth: false,
  })
}

export function fetchTutorialTasksApi(params?: TutorialTaskQuery) {
  return requestApi<TutorialTaskPageResult>({
    url: '/tutorial/tasks',
    method: 'GET',
    params: params
      ? {
          status: params.status,
          keyword: params.keyword,
          page: params.page,
          pageSize: params.pageSize,
        }
      : undefined,
    baseURL: API_BASE_URL,
    auth: false,
  })
}

export function fetchTutorialTaskDetailApi(id: number) {
  return requestApi<TutorialTask>({
    url: `/tutorial/tasks/${id}`,
    method: 'GET',
    baseURL: API_BASE_URL,
    auth: false,
  })
}

export function createTutorialTaskApi(payload: TutorialTaskPayload) {
  return requestApi<TutorialTask, TutorialTaskPayload>({
    url: '/tutorial/tasks',
    method: 'POST',
    data: payload,
    baseURL: API_BASE_URL,
    auth: false,
  })
}

export function updateTutorialTaskApi(id: number, payload: TutorialTaskPayload) {
  return requestApi<TutorialTask, TutorialTaskPayload>({
    url: `/tutorial/tasks/${id}`,
    method: 'PUT',
    data: payload,
    baseURL: API_BASE_URL,
    auth: false,
  })
}

export function deleteTutorialTaskApi(id: number) {
  return requestApi<{ id: number; deleted: boolean }>({
    url: `/tutorial/tasks/${id}`,
    method: 'DELETE',
    baseURL: API_BASE_URL,
    auth: false,
  })
}
