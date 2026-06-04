import { AppError } from '../utils/appError.js'

const allowedStatus = ['todo', 'doing', 'done']
const allowedPriority = ['low', 'medium', 'high']

function normalizeText(value, maxLength) {
  if (typeof value !== 'string') {
    return ''
  }

  return value.trim().slice(0, maxLength)
}

export function validateTutorialTaskPayload(body) {
  const title = normalizeText(body?.title, 60)
  const assignee = normalizeText(body?.assignee, 30)
  const description = normalizeText(body?.description, 300)
  const status = typeof body?.status === 'string' ? body.status : 'todo'
  const priority = typeof body?.priority === 'string' ? body.priority : 'medium'

  if (!title) {
    return {
      valid: false,
      error: new AppError('任务标题不能为空。', 400),
    }
  }

  if (!allowedStatus.includes(status)) {
    return {
      valid: false,
      error: new AppError('任务状态只能是 todo、doing、done。', 400),
    }
  }

  if (!allowedPriority.includes(priority)) {
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
      status,
      priority,
    },
  }
}
