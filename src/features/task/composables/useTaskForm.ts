import { computed, nextTick, reactive, ref, watch, type Ref } from 'vue'
import { ElMessage } from 'element-plus'
import type { FormInstance, FormRules } from 'element-plus'
import { taskCategoryOptions, taskPriorityOptions, taskStatusOptions } from '../constants'
import { useTaskStore } from '../store'
import type { CreateTaskForm, DialogMode } from '../types'

interface UseTaskFormOptions {
  show?: Ref<boolean>
  mode: Ref<DialogMode>
  taskId?: Ref<number | null>
  close?: () => void | Promise<void>
  onSubmitted?: () => void | Promise<void>
}

export function createDefaultTaskFormData(): CreateTaskForm {
  return {
    title: '',
    summary: '',
    category: 'TypeScript',
    status: 'todo',
    priority: 'high',
    estimateHours: 1,
  }
}

export const taskFormRules: FormRules<CreateTaskForm> = {
  title: [
    { required: true, message: '请输入任务名称', trigger: 'blur' },
    { min: 2, max: 30, message: '任务名称保持在 2 到 30 个字符之间', trigger: 'blur' },
  ],
  summary: [
    { required: true, message: '请输入任务描述', trigger: 'blur' },
    { min: 5, max: 120, message: '任务描述保持在 5 到 120 个字符之间', trigger: 'blur' },
  ],
  category: [{ required: true, message: '请选择任务分类', trigger: 'change' }],
  status: [{ required: true, message: '请选择任务状态', trigger: 'change' }],
  priority: [{ required: true, message: '请选择任务优先级', trigger: 'change' }],
  estimateHours: [
    { required: true, message: '请输入预估工时', trigger: 'change' },
    { type: 'number', min: 1, message: '预估工时至少为 1 小时', trigger: 'change' },
  ],
}

export function useTaskForm({ show, mode, taskId, close, onSubmitted }: UseTaskFormOptions) {
  const taskStore = useTaskStore()
  const formRef = ref<FormInstance | null>(null)
  const submitting = ref(false)
  const formData = reactive<CreateTaskForm>(createDefaultTaskFormData())

  const dialogTitle = computed(() => (mode.value === 'edit' ? '编辑学习任务' : '新增学习任务'))
  const submitButtonText = computed(() => (mode.value === 'edit' ? '保存修改' : '创建任务'))

  function resetForm() {
    Object.assign(formData, createDefaultTaskFormData())
  }

  function fillForm(targetTaskId: number) {
    const targetTask = taskStore.tasks.find((task) => task.id === targetTaskId)
    if (!targetTask) {
      resetForm()
      return
    }

    Object.assign(formData, {
      title: targetTask.title,
      summary: targetTask.summary,
      category: targetTask.category,
      status: targetTask.status,
      priority: targetTask.priority,
      estimateHours: targetTask.estimateHours,
    })
  }

  async function clearValidation() {
    await nextTick()
    formRef.value?.clearValidate()
  }

  async function handleSubmit() {
    const isValid = await formRef.value?.validate().catch(() => false)
    if (!isValid || submitting.value) {
      return
    }

    submitting.value = true

    try {
      if (mode.value === 'edit' && taskId?.value !== null && taskId?.value !== undefined) {
        await taskStore.updateTask(taskId.value, { ...formData })
        ElMessage.success('任务修改成功')
      } else {
        await taskStore.addTask({ ...formData })
        ElMessage.success('创建任务成功')
      }

      if (onSubmitted) {
        await onSubmitted()
      }

      if (close) {
        await close()
      } else if (show) {
        show.value = false
      }
    } finally {
      submitting.value = false
    }
  }

  if (show && taskId) {
    watch(
      [show, mode, taskId],
      async ([visible, currentMode, currentTaskId]) => {
        if (!visible) {
          return
        }

        if (currentMode === 'edit' && currentTaskId !== null) {
          fillForm(currentTaskId)
        } else {
          resetForm()
        }

        await clearValidation()
      },
      { immediate: true },
    )
  } else {
    watch(
      mode,
      async () => {
        resetForm()
        await clearValidation()
      },
      { immediate: true },
    )
  }

  return {
    categoryOptions: taskCategoryOptions,
    statusOptions: taskStatusOptions,
    priorityOptions: taskPriorityOptions,
    formRef,
    formData,
    dialogTitle,
    submitButtonText,
    formRules: taskFormRules,
    submitting,
    handleSubmit,
    resetForm,
  }
}
