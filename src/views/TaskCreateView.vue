<script setup lang="ts">
import { reactive, ref, onMounted } from 'vue'
import { ElMessage } from 'element-plus'
import type { FormInstance, FormRules } from 'element-plus'
import type { CreateTaskForm, PriorityLevel, StudyCategory, StudyStatus } from '@/types/study'
import { useCounterStore } from '@/stores/counter'
import { useRouter } from 'vue-router'

const router = useRouter()
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

onMounted(() => {
  console.log(router)
})

// 这里用 CreateTaskForm，而不是 StudyTask。
// 因为“创建表单”还没有真正生成 id，id 应该由 store 统一创建。
const formData = reactive<CreateTaskForm>({
  title: '',
  summary: '',
  category: 'TypeScript',
  status: 'todo',
  priority: 'high',
  estimateHours: 1,
})

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

async function createTask() {
  const isValid = await formRef.value?.validate().catch(() => false)
  if (!isValid) {
    return
  }

  careerPlanStore.addTask({ ...formData })
  ElMessage.success('创建任务成功')
  router.push('/')
}
</script>

<template>
  <section class="create-page">
    <div class="page-head">
      <p class="eyebrow">Task Create</p>
      <h2>新增学习任务</h2>
      <p class="intro">
        这个页面演示了一个很典型的前端业务流：表单录入、类型约束、校验、提交到 Pinia、成功后跳回列表页。
      </p>
    </div>

    <el-form ref="formRef" :model="formData" :rules="formRules" label-position="top" class="task-form">
      <el-form-item label="任务名称" prop="title">
        <el-input v-model="formData.title" placeholder="例如：补齐 TS 联合类型和泛型" clearable />
      </el-form-item>

      <el-form-item label="任务描述" prop="summary">
        <el-input
          v-model="formData.summary"
          type="textarea"
          :rows="4"
          maxlength="120"
          show-word-limit
          placeholder="写清楚这个任务为什么重要，帮助自己以后复盘"
        />
      </el-form-item>

      <div class="form-grid">
        <el-form-item label="任务分类" prop="category">
          <el-select v-model="formData.category" placeholder="请选择任务分类">
            <el-option
              v-for="item in categoryOptions"
              :key="item.value"
              :label="item.label"
              :value="item.value"
            />
          </el-select>
        </el-form-item>

        <el-form-item label="任务状态" prop="status">
          <el-select v-model="formData.status" placeholder="请选择任务状态">
            <el-option
              v-for="item in statusOptions"
              :key="item.value"
              :label="item.label"
              :value="item.value"
            />
          </el-select>
        </el-form-item>
      </div>

      <div class="form-grid">
        <el-form-item label="任务优先级" prop="priority">
          <el-select v-model="formData.priority" placeholder="请选择任务优先级">
            <el-option
              v-for="item in priorityOptions"
              :key="item.value"
              :label="item.label"
              :value="item.value"
            />
          </el-select>
        </el-form-item>

        <el-form-item label="预估工时" prop="estimateHours">
          <el-input-number v-model="formData.estimateHours" :min="1" :max="100" />
        </el-form-item>
      </div>

      <div class="actions">
        <el-button @click="router.push('/')">返回列表</el-button>
        <el-button type="primary" @click="createTask">创建任务</el-button>
      </div>
    </el-form>
  </section>
</template>

<style scoped>
.create-page {
  display: flex;
  flex-direction: column;
  gap: 1.25rem;
  padding: 1.5rem;
  border-radius: 28px;
  border: 1px solid rgba(29, 59, 54, 0.1);
  background: rgba(255, 255, 255, 0.82);
  box-shadow: 0 18px 40px rgba(19, 35, 33, 0.08);
}

.eyebrow {
  color: #7a5d2d;
  letter-spacing: 0.08em;
  text-transform: uppercase;
  font-size: 0.76rem;
  font-weight: 700;
}

.page-head h2 {
  margin-top: 0.4rem;
  color: #173937;
  font-size: 1.8rem;
  font-weight: 700;
}

.intro {
  max-width: 44rem;
  margin-top: 0.75rem;
  color: #556260;
}

.task-form {
  margin-top: 0.25rem;
}

.form-grid {
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: 1rem;
}

.actions {
  display: flex;
  justify-content: flex-end;
  gap: 0.75rem;
}

@media (max-width: 768px) {
  .form-grid {
    grid-template-columns: 1fr;
  }

  .actions {
    justify-content: stretch;
  }
}
</style>
