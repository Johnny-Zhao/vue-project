<script setup lang="ts">
import { computed } from 'vue'
import { useRouter } from 'vue-router'
import TaskFormFields from '@/features/task/components/TaskFormFields.vue'
import { useTaskForm } from '@/features/task/composables/useTaskForm'
import type { DialogMode } from '@/features/task/types'

const router = useRouter()
const mode = computed<DialogMode>(() => 'create')

const {
  categoryOptions,
  statusOptions,
  priorityOptions,
  formRef,
  formData,
  formRules,
  submitting,
  handleSubmit,
} = useTaskForm({
  mode,
  close: () => router.push('/'),
})
</script>

<template>
  <section class="create-page">
    <div class="page-head">
      <p class="eyebrow">Task Create</p>
      <h2>新增学习任务</h2>
      <p class="intro">创建页和弹窗现在复用同一套表单定义，后续加字段只需要改一处。</p>
    </div>

    <el-form ref="formRef" :model="formData" :rules="formRules" label-position="top" class="task-form">
      <TaskFormFields
        v-model="formData"
        :category-options="categoryOptions"
        :status-options="statusOptions"
        :priority-options="priorityOptions"
      />

      <div class="actions">
        <el-button @click="router.push('/')">返回列表</el-button>
        <el-button type="primary" :loading="submitting" @click="handleSubmit">创建任务</el-button>
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

.actions {
  display: flex;
  justify-content: flex-end;
  gap: 0.75rem;
}

@media (max-width: 768px) {
  .actions {
    justify-content: stretch;
  }
}
</style>
