import { ref } from 'vue'

// 一个通用请求 hooks。
// TData 表示成功后拿到的数据类型。
// TArgs 表示这个请求函数接收的参数列表类型。
export function useRequest<TData, TArgs extends unknown[]>(
  requestFn: (...args: TArgs) => Promise<TData>,
) {
  const loading = ref(false)
  const error = ref('')
  const data = ref<TData | null>(null)

  async function run(...args: TArgs) {
    loading.value = true
    error.value = ''

    try {
      const result = await requestFn(...args)
      data.value = result
      return result
    } catch (requestError) {
      error.value = requestError instanceof Error ? requestError.message : 'Request failed'
      throw requestError
    } finally {
      loading.value = false
    }
  }

  function setData(nextData: TData | null) {
    data.value = nextData
  }

  function clearError() {
    error.value = ''
  }

  return {
    loading,
    error,
    data,
    run,
    setData,
    clearError,
  }
}
