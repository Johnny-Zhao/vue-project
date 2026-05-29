import { computed, onMounted, ref, watch } from 'vue'
import { ElMessage, ElMessageBox } from 'element-plus'
import { storeToRefs } from 'pinia'
import { useCounterStore } from '@/stores/counter'
import type { DialogMode, SortDirection, StudyStatus, StudyTask, TaskSortField } from '@/types/study'
import { sortByField } from '@/utils/task'
import { usePagination } from '@/composables/usePagination'
import { useTaskSearch } from '@/composables/useTaskSearch'

export function useTaskBoard() {
  const careerPlanStore = useCounterStore()

  const {
    activeFilter,
    completedCount,
    doingCount,
    filteredTasks,
    pendingCount,
    summaryCards,
    weeklyFocusHours,
    loading,
  } = storeToRefs(careerPlanStore)

  const { addWeeklyFocusHours, setActiveFilter, updateTaskStatus, deleteTask, loadTasks } =
    careerPlanStore

  const filterOptions: Array<{ label: string; value: StudyStatus | 'all' }> = [
    { label: '全部', value: 'all' },
    { label: '待开始', value: 'todo' },
    { label: '进行中', value: 'doing' },
    { label: '已完成', value: 'done' },
  ]

  const statusTextMap: Record<StudyStatus, string> = {
    todo: '待开始',
    doing: '进行中',
    done: '已完成',
  }

  const sortField = ref<TaskSortField>('estimateHours')
  const sortDirection = ref<SortDirection>('desc')

  const sortFieldOptions: Array<{ label: string; value: TaskSortField }> = [
    { label: '预估工时', value: 'estimateHours' },
    { label: '任务名称', value: 'title' },
    { label: '任务状态', value: 'status' },
    { label: '优先级', value: 'priority' },
  ]

  const sortDirectionOptions: Array<{ label: string; value: SortDirection }> = [
    { label: '降序', value: 'desc' },
    { label: '升序', value: 'asc' },
  ]

  const sortedTasks = computed(() =>
    sortByField(filteredTasks.value, sortField.value, sortDirection.value),
  )

  const {
    keyword,
    normalizedKeyword,
    searchedItems: searchedTasks,
    clearKeyword,
  } = useTaskSearch(sortedTasks, (task: StudyTask, searchText: string) => {
    const normalizedText = searchText.toLowerCase()
    return (
      task.title.toLowerCase().includes(normalizedText) ||
      task.summary.toLowerCase().includes(normalizedText) ||
      task.category.toLowerCase().includes(normalizedText)
    )
  })

  const {
    currentPage,
    pageSize,
    total,
    pagedItems,
    handleCurrentChange,
    handleSizeChange,
    resetPage,
  } = usePagination(searchedTasks, {
    initialPage: 1,
    initialPageSize: 5,
  })

  watch([activeFilter, sortField, sortDirection, normalizedKeyword], () => {
    resetPage()
  })

  const dialogVisible = ref(false)
  const dialogMode = ref<DialogMode>('create')
  const dialogTaskId = ref<number | null>(null)

  onMounted(() => {
    if (careerPlanStore.tasks.length === 0) {
      // loadTasks() 返回 Promise。
      // 这里我们只是触发一次加载，不需要在 mounted 里等待它完成，
      // 所以用 void 明确表示“这个返回值我就是故意不接”。
      // 这样也能避免未处理 Promise 的提醒。
      void loadTasks()
    }
  })

  async function markTask(taskId: number, status: StudyStatus) {
    await updateTaskStatus(taskId, status)
  }

  function handleDialogOpen() {
    dialogMode.value = 'create'
    dialogTaskId.value = null
    dialogVisible.value = true
  }

  function handleDialogEdit(taskId: number) {
    dialogMode.value = 'edit'
    dialogTaskId.value = taskId
    dialogVisible.value = true
  }

  async function handleTaskDelete(taskId: number) {
    try {
      await ElMessageBox.confirm(
        '删除后这条任务会立刻从当前列表里消失，确定继续吗？',
        '确认删除',
        {
          confirmButtonText: '删除',
          cancelButtonText: '取消',
          type: 'warning',
        },
      )
      await deleteTask(taskId)
      ElMessage.success('任务已删除')
    } catch {
      // 用户取消时不需要额外提示
    }
  }

  return {
    activeFilter,
    completedCount,
    doingCount,
    pendingCount,
    summaryCards,
    weeklyFocusHours,
    loading,
    filterOptions,
    statusTextMap,
    sortField,
    sortDirection,
    sortFieldOptions,
    sortDirectionOptions,
    sortedTasks,
    keyword,
    normalizedKeyword,
    searchedTasks,
    clearKeyword,
    currentPage,
    pageSize,
    total,
    pagedItems,
    handleCurrentChange,
    handleSizeChange,
    dialogVisible,
    dialogMode,
    dialogTaskId,
    addWeeklyFocusHours,
    setActiveFilter,
    markTask,
    handleDialogOpen,
    handleDialogEdit,
    handleTaskDelete,
  }
}
