import { computed, ref, watch, type Ref } from 'vue'

interface UsePaginationOptions {
  initialPage?: number
  initialPageSize?: number
}

export function usePagination<T>(source: Ref<T[]>, options: UsePaginationOptions = {}) {
  const currentPage = ref(options.initialPage ?? 1)
  const pageSize = ref(options.initialPageSize ?? 5)

  const total = computed(() => source.value.length)

  const pagedItems = computed(() => {
    const startIndex = (currentPage.value - 1) * pageSize.value
    const endIndex = startIndex + pageSize.value
    return source.value.slice(startIndex, endIndex)
  })

  function handleCurrentChange(page: number) {
    currentPage.value = page
  }

  function handleSizeChange(size: number) {
    pageSize.value = size
    currentPage.value = 1
  }

  function resetPage() {
    currentPage.value = 1
  }

  watch(total, (nextTotal) => {
    const maxPage = Math.max(1, Math.ceil(nextTotal / pageSize.value))
    if (currentPage.value > maxPage) {
      currentPage.value = maxPage
    }
  })

  return {
    currentPage,
    pageSize,
    total,
    pagedItems,
    handleCurrentChange,
    handleSizeChange,
    resetPage,
  }
}
