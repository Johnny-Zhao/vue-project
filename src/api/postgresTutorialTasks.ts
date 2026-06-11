import { requestApi } from '@/api/request'
import type {
  TutorialGuide,
  TutorialTask,
  TutorialTaskPageResult,
  TutorialTaskPayload,
  TutorialTaskQuery,
} from '@/types/tutorialTask'

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL ?? '/api'
const PG_TUTORIAL_BASE_URL = `${API_BASE_URL}/pg`

export function fetchPostgresTutorialGuideApi() {
  return requestApi<TutorialGuide>({
    url: '/tutorial/guide',
    method: 'GET',
    baseURL: PG_TUTORIAL_BASE_URL,
    auth: false,
  })
}

export function fetchPostgresTutorialTasksApi(params?: TutorialTaskQuery) {
  return requestApi<TutorialTaskPageResult>({
    url: '/tutorial/tasks',
    method: 'GET',
    params,
    baseURL: PG_TUTORIAL_BASE_URL,
    auth: false,
  })
}

export function fetchPostgresTutorialTaskDetailApi(id: number) {
  return requestApi<TutorialTask>({
    url: `/tutorial/tasks/${id}`,
    method: 'GET',
    baseURL: PG_TUTORIAL_BASE_URL,
    auth: false,
  })
}

export function createPostgresTutorialTaskApi(payload: TutorialTaskPayload) {
  return requestApi<TutorialTask, TutorialTaskPayload>({
    url: '/tutorial/tasks',
    method: 'POST',
    data: payload,
    baseURL: PG_TUTORIAL_BASE_URL,
    auth: false,
  })
}

export function updatePostgresTutorialTaskApi(id: number, payload: TutorialTaskPayload) {
  return requestApi<TutorialTask, TutorialTaskPayload>({
    url: `/tutorial/tasks/${id}`,
    method: 'PUT',
    data: payload,
    baseURL: PG_TUTORIAL_BASE_URL,
    auth: false,
  })
}

export function deletePostgresTutorialTaskApi(id: number) {
  return requestApi<{ id: number; deleted: boolean }>({
    url: `/tutorial/tasks/${id}`,
    method: 'DELETE',
    baseURL: PG_TUTORIAL_BASE_URL,
    auth: false,
  })
}
