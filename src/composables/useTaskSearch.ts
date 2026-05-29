import { computed, ref, type Ref } from 'vue'

export function useTaskSearch<T>(
  source: Ref<T[]>, // 因为调用的时候传的是一个计算属性，所以其实是一个Ref对象
  matcher: (item: T, keyword: string) => boolean,
) {
  const keyword = ref('')

  const normalizedKeyword = computed(() => keyword.value.trim())

  const searchedItems = computed(() => {
    if (!normalizedKeyword.value) {
      return source.value
    }

    return source.value.filter((item) => matcher(item, normalizedKeyword.value))
  })

  function clearKeyword() {
    keyword.value = ''
  }

  return {
    keyword,
    normalizedKeyword,
    searchedItems,
    clearKeyword,
  }
}
