import { computed, ref } from 'vue'
import { defineStore } from 'pinia'
import type { StudyStatus, StudyTask, SummaryCard } from '@/types/study'

const initialTasks: StudyTask[] = [
  {
    id: 1,
    title: '补齐 TypeScript 基础',
    summary: '先吃透 interface、联合类型、泛型、工具类型，再去看框架写法。',
    category: 'TypeScript',
    status: 'doing',
    priority: 'high',
    estimateHours: 8,
  },
  {
    id: 2,
    title: '用 Vue 真实写一遍状态管理',
    summary: '把 Pinia、筛选、统计、按钮交互都串起来，理解状态是怎么流动的。',
    category: 'Vue',
    status: 'todo',
    priority: 'medium',
    estimateHours: 5,
  },
  {
    id: 3,
    title: '补 React + TS 的组件思维',
    summary: '等 TS 基础稳一点后，再切去看 props、hooks、表单和列表场景。',
    category: 'React',
    status: 'todo',
    priority: 'medium',
    estimateHours: 6,
  },
  {
    id: 4,
    title: '补一点 Node 工具能力',
    summary: '先会写简单脚本、接口代理、文件处理，不用一上来学很深。',
    category: 'Node',
    status: 'todo',
    priority: 'medium',
    estimateHours: 4,
  },
  {
    id: 5,
    title: '做一个 AI 接入小功能',
    summary: '例如输入需求后生成结构化分析，让项目更像真实求职作品。',
    category: 'AI',
    status: 'done',
    priority: 'high',
    estimateHours: 6,
  },
]

type TaskFilter = StudyStatus | 'all'

export const useCounterStore = defineStore('careerPlan', () => {
  // ref 更适合放“会变化的状态”
  const tasks = ref<StudyTask[]>(initialTasks)
  const activeFilter = ref<TaskFilter>('all')
  const weeklyFocusHours = ref(10)

  // computed 适合放“根据已有状态推导出来的数据”
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
      hint: '完成会直接反映在首页和关于页',
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

  function updateTaskStatus(taskId: number, status: StudyStatus) {
    const targetTask = tasks.value.find((task) => task.id === taskId)
    if (!targetTask) {
      return
    }

    targetTask.status = status
  }

  function addWeeklyFocusHours(hours: number) {
    weeklyFocusHours.value = Math.max(0, weeklyFocusHours.value + hours)
  }

  const addTask = (taskItem: StudyTask) => {
    tasks.value.push(taskItem)
  }

  return {
    tasks,
    activeFilter,
    weeklyFocusHours,
    completedCount,
    doingCount,
    pendingCount,
    completionRate,
    filteredTasks,
    summaryCards,
    setActiveFilter,
    updateTaskStatus,
    addWeeklyFocusHours,
    addTask,
  }
})
