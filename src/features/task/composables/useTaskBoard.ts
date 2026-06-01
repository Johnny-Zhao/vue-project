import { computed, onMounted, ref, watch } from 'vue'
import { ElMessage, ElMessageBox } from 'element-plus'
import { storeToRefs } from 'pinia'
import { usePagination } from '@/composables/usePagination'
import { useTaskSearch } from '@/composables/useTaskSearch'
import { taskFilterOptions, taskStatusTextMap } from '../constants'
import { useTaskStore } from '../store'
import type { DialogMode, SortDirection, StudyStatus, StudyTask, TaskSortField } from '../types'
import { sortByField } from '../utils'

export function useTaskBoard() {
  const taskStore = useTaskStore()

  const {
    activeFilter,
    completedCount,
    doingCount,
    filteredTasks,
    pendingCount,
    summaryCards,
    weeklyFocusHours,
    loading,
  } = storeToRefs(taskStore)

  const { addWeeklyFocusHours, setActiveFilter, updateTaskStatus, deleteTask, loadTasks } = taskStore

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
    if (taskStore.tasks.length === 0) {
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
      // Ignore canceled confirmations.
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
    filterOptions: taskFilterOptions,
    statusTextMap: taskStatusTextMap,
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
