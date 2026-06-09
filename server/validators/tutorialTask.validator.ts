import type { BodyValidationResult } from '../types/http.ts'
import type {
  TutorialTaskPayload,
  TutorialTaskPriority,
  TutorialTaskStatus,
} from '../types/tutorial.ts'
import { AppError } from '../utils/appError.ts'

const allowedStatus: TutorialTaskStatus[] = ['todo', 'doing', 'done']
const allowedPriority: TutorialTaskPriority[] = ['low', 'medium', 'high']

function normalizeText(value: unknown, maxLength: number) {
  if (typeof value !== 'string') {
    return ''
  }

  return value.trim().slice(0, maxLength)
}

export function validateTutorialTaskPayload(
  body: unknown,
): BodyValidationResult<TutorialTaskPayload> {
  const source = body && typeof body === 'object' ? (body as Record<string, unknown>) : {}
  const title = normalizeText(source.title, 60)
  const assignee = normalizeText(source.assignee, 30)
  const description = normalizeText(source.description, 300)
  const status = typeof source.status === 'string' ? source.status : 'todo'
  const priority = typeof source.priority === 'string' ? source.priority : 'medium'

  if (!title) {
    return {
      valid: false,
      error: new AppError('任务标题不能为空。', 400),
    }
  }

  if (!allowedStatus.includes(status as TutorialTaskStatus)) {
    return {
      valid: false,
      error: new AppError('任务状态只能是 todo、doing、done。', 400),
    }
  }

  if (!allowedPriority.includes(priority as TutorialTaskPriority)) {
    return {
      valid: false,
      error: new AppError('任务优先级只能是 low、medium、high。', 400),
    }
  }

  return {
    valid: true,
    data: {
      title,
      assignee,
      description,
      status: status as TutorialTaskStatus,
      priority: priority as TutorialTaskPriority,
    },
  }
}
