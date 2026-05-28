<script setup lang="ts">
import { ref } from 'vue'
import { ElInput, ElSelect, ElMessage } from 'element-plus'
// import { storeToRefs } from 'pinia'
import type { StudyTask, StudyCategory, StudyStatus, PriorityLevel } from '@/types/study'
import { useCounterStore } from '@/stores/counter'
import { useRouter } from 'vue-router'

const router = useRouter()

const careerPlanStore = useCounterStore()
const { addTask } = careerPlanStore

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

const formRef = ref<HTMLFormElement | null>(null)
const basicFormData = ref<StudyTask>({
  id: null,
  title: '',
  summary: '',
  category: 'TypeScript',
  status: 'todo',
  priority: 'high',
  estimateHours: 0,
})

const createTask = (): void => {
  formRef.value?.validate((valid: boolean) => {
    if (valid) {
      addTask(basicFormData.value)
      ElMessage.success('创建任务成功')
      router.push('/')
    }
  })
}

</script>

<template>
  <div>
    <h1>创建任务</h1>
    <el-form ref="formRef" :model="basicFormData">
      <el-form-item label="任务名称" prop="title" required>
        <el-input v-model="basicFormData.title" clearable />
      </el-form-item>
      <el-form-item label="任务描述" prop="summary" required>
        <el-input v-model="basicFormData.summary" clearable />
      </el-form-item>
      <el-form-item label="任务分类" prop="category" required>
        <el-select v-model="basicFormData.category" clearable >
          <el-option v-for="item in categoryOptions" :key="item.value" :label="item.label" :value="item.value" />
        </el-select>
      </el-form-item>
      <el-form-item label="任务状态" prop="status" required>
        <el-select v-model="basicFormData.status" clearable >
          <el-option v-for="item in statusOptions" :key="item.value" :label="item.label" :value="item.value" />
          </el-select>
      </el-form-item>
      <el-form-item label="任务优先级" prop="priority" required>
        <el-select v-model="basicFormData.priority" clearable >
          <el-option v-for="item in priorityOptions" :key="item.value" :label="item.label" :value="item.value" />
        </el-select>
      </el-form-item>
      <el-form-item label="任务工时" prop="estimateHours" required>
        <el-input v-model="basicFormData.estimateHours" clearable />
      </el-form-item>
    </el-form>
    <el-button type="primary" @click="createTask">创建任务</el-button>
  </div>
</template>
