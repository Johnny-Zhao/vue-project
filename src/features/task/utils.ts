import type { SortDirection } from './types'

type SortableValue = string | number

function normalizeSortValue(value: unknown): SortableValue {
  if (typeof value === 'number') {
    return value
  }

  return String(value)
}

export function sortByField<T, K extends keyof T>(
  list: T[],
  field: K,
  direction: SortDirection = 'asc',
): T[] {
  const directionFactor = direction === 'asc' ? 1 : -1

  return [...list].sort((leftItem, rightItem) => {
    const leftValue = normalizeSortValue(leftItem[field])
    const rightValue = normalizeSortValue(rightItem[field])

    if (typeof leftValue === 'number' && typeof rightValue === 'number') {
      return (leftValue - rightValue) * directionFactor
    }

    return String(leftValue).localeCompare(String(rightValue), 'zh-CN') * directionFactor
  })
}
