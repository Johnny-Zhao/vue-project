import { computed, nextTick, reactive, ref, watch, type Ref } from 'vue'
import { ElMessage } from 'element-plus'
import type { FormInstance, FormRules } from 'element-plus'
import type {
  CreateTaskForm,
  DialogMode,
  PriorityLevel,
  StudyCategory,
  StudyStatus,
} from '@/types/study'
import { useCounterStore } from '@/stores/counter'

interface UseTaskFormOptions {
  show: Ref<boolean>
  mode: Ref<DialogMode>
  taskId: Ref<number | null>
}

export function useTaskForm({ show, mode, taskId }: UseTaskFormOptions) {
  const careerPlanStore = useCounterStore()

  const categoryOptions: Array<{ label: string; value: StudyCategory }> = [
    { label: 'TypeScript', value: 'TypeScript' },
    { label: 'Vue', value: 'Vue' },
    { label: 'React', value: 'React' },
    { label: 'Node', value: 'Node' },
    { label: 'AI', value: 'AI' },
  ]

  const statusOptions: Array<{ label: string; value: StudyStatus }> = [
    { label: '待开始', value: 'todo' },
    { label: '进行中', value: 'doing' },
    { label: '已完成', value: 'done' },
  ]

  const priorityOptions: Array<{ label: string; value: PriorityLevel }> = [
    { label: '高', value: 'high' },
    { label: '中', value: 'medium' },
    { label: '低', value: 'low' },
  ]

  const formRef = ref<FormInstance | null>(null)

  function createDefaultFormData(): CreateTaskForm {
    return {
      title: '',
      summary: '',
      category: 'TypeScript',
      status: 'todo',
      priority: 'high',
      estimateHours: 1,
    }
  }

  const formData = reactive<CreateTaskForm>(createDefaultFormData())

  const dialogTitle = computed(() => (mode.value === 'edit' ? '编辑学习任务' : '新增学习任务'))
  const submitButtonText = computed(() => (mode.value === 'edit' ? '保存修改' : '创建任务'))

  const formRules: FormRules<CreateTaskForm> = {
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

  function resetForm() {
    Object.assign(formData, createDefaultFormData())
  }

  function fillForm(targetTaskId: number) {
    const targetTask = careerPlanStore.tasks.find((task) => task.id === targetTaskId)
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

  function handleClose() {
    show.value = false
  }

  async function handleSubmit() {
    const isValid = await formRef.value?.validate().catch(() => false)
    if (!isValid) {
      return
    }

    if (mode.value === 'edit' && taskId.value !== null) {
      careerPlanStore.updateTask(taskId.value, { ...formData })
      ElMessage.success('任务修改成功')
    } else {
      careerPlanStore.addTask({ ...formData })
      ElMessage.success('创建任务成功')
    }

    handleClose()
  }

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

      await nextTick()
      formRef.value?.clearValidate()
    },
    { immediate: true },
  )

  return {
    categoryOptions,
    statusOptions,
    priorityOptions,
    formRef,
    formData,
    dialogTitle,
    submitButtonText,
    formRules,
    handleClose,
    handleSubmit,
  }
}
