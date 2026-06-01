import type { PriorityLevel, StudyCategory, StudyStatus } from './types'

export const taskCategoryOptions: Array<{ label: string; value: StudyCategory }> = [
  { label: 'TypeScript', value: 'TypeScript' },
  { label: 'Vue', value: 'Vue' },
  { label: 'React', value: 'React' },
  { label: 'Node', value: 'Node' },
  { label: 'AI', value: 'AI' },
]

export const taskStatusOptions: Array<{ label: string; value: StudyStatus }> = [
  { label: '待开始', value: 'todo' },
  { label: '进行中', value: 'doing' },
  { label: '已完成', value: 'done' },
]

export const taskPriorityOptions: Array<{ label: string; value: PriorityLevel }> = [
  { label: '高', value: 'high' },
  { label: '中', value: 'medium' },
  { label: '低', value: 'low' },
]

export const taskFilterOptions: Array<{ label: string; value: StudyStatus | 'all' }> = [
  { label: '全部', value: 'all' },
  { label: '待开始', value: 'todo' },
  { label: '进行中', value: 'doing' },
  { label: '已完成', value: 'done' },
]

export const taskStatusTextMap: Record<StudyStatus, string> = {
  todo: '待开始',
  doing: '进行中',
  done: '已完成',
}
