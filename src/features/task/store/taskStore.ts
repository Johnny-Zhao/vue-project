import { computed, ref } from 'vue'
import { defineStore } from 'pinia'
import { createTaskApi, deleteTaskApi, fetchTaskListApi, updateTaskApi } from '../api'
import type { CreateTaskForm, StudyStatus, StudyTask, SummaryCard } from '../types'

type TaskFilter = StudyStatus | 'all'

export const useTaskStore = defineStore('careerPlan', () => {
  const tasks = ref<StudyTask[]>([])
  const activeFilter = ref<TaskFilter>('all')
  const weeklyFocusHours = ref(10)
  const loading = ref(false)

  const completedCount = computed(() => tasks.value.filter((task) => task.status === 'done').length)
  const doingCount = computed(() => tasks.value.filter((task) => task.status === 'doing').length)
  const totalCount = computed(() => tasks.value.length)
  const pendingCount = computed(() => totalCount.value - completedCount.value)
  const completionRate = computed(() => {
    if (totalCount.value === 0) {
      return 0
    }

    return Math.round((completedCount.value / totalCount.value) * 100)
  })

  const filteredTasks = computed(() => {
    if (activeFilter.value === 'all') {
      return tasks.value
    }

    return tasks.value.filter((task) => task.status === activeFilter.value)
  })

  const totalPlannedHours = computed(() =>
    tasks.value.reduce((sum, task) => sum + task.estimateHours, 0),
  )

  const summaryCards = computed<SummaryCard[]>(() => [
    {
      label: '当前任务',
      value: String(totalCount.value),
      hint: '这周想推进的学习主题',
    },
    {
      label: '已完成',
      value: String(completedCount.value),
      hint: '完成数会直接反映在首页和统计卡片里',
    },
    {
      label: '完成率',
      value: `${completionRate.value}%`,
      hint: '这是一个典型的 computed 派生数据',
    },
    {
      label: '计划工时',
      value: `${totalPlannedHours.value}h`,
      hint: '帮助你把“我要学”变成可执行计划',
    },
  ])

  function setActiveFilter(filter: TaskFilter) {
    activeFilter.value = filter
  }

  function addWeeklyFocusHours(hours: number) {
    weeklyFocusHours.value = Math.max(0, weeklyFocusHours.value + hours)
  }

  async function loadTasks() {
    loading.value = true
    try {
      const response = await fetchTaskListApi()
      tasks.value = response.list
    } finally {
      loading.value = false
    }
  }

  async function addTask(taskItem: CreateTaskForm) {
    const response = await createTaskApi(taskItem)
    tasks.value.push(response)
  }

  async function updateTask(taskId: number, taskItem: CreateTaskForm) {
    const response = await updateTaskApi(taskId, taskItem)
    const targetTask = tasks.value.find((task) => task.id === taskId)
    if (!targetTask) {
      return
    }

    Object.assign(targetTask, response)
  }

  async function updateTaskStatus(taskId: number, status: StudyStatus) {
    const targetTask = tasks.value.find((task) => task.id === taskId)
    if (!targetTask) {
      return
    }

    await updateTask(taskId, {
      title: targetTask.title,
      summary: targetTask.summary,
      category: targetTask.category,
      status,
      priority: targetTask.priority,
      estimateHours: targetTask.estimateHours,
    })
  }

  async function deleteTask(taskId: number) {
    await deleteTaskApi(taskId)
    const targetIndex = tasks.value.findIndex((task) => task.id === taskId)
    if (targetIndex === -1) {
      return
    }

    tasks.value.splice(targetIndex, 1)
  }

  return {
    tasks,
    activeFilter,
    weeklyFocusHours,
    loading,
    completedCount,
    doingCount,
    pendingCount,
    completionRate,
    filteredTasks,
    summaryCards,
    setActiveFilter,
    addWeeklyFocusHours,
    loadTasks,
    addTask,
    updateTask,
    updateTaskStatus,
    deleteTask,
  }
})
