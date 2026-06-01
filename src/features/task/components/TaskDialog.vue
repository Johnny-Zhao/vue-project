<script setup lang="ts">
import { toRef } from 'vue'
import { useTaskForm } from '../composables/useTaskForm'
import type { DialogMode } from '../types'
import TaskFormFields from './TaskFormFields.vue'

const show = defineModel<boolean>('show', { default: false })

const props = defineProps<{
  mode: DialogMode
  taskId: number | null
}>()

function handleClose() {
  show.value = false
}

const {
  categoryOptions,
  statusOptions,
  priorityOptions,
  formRef,
  formData,
  dialogTitle,
  submitButtonText,
  formRules,
  submitting,
  handleSubmit,
} = useTaskForm({
  show,
  mode: toRef(props, 'mode'),
  taskId: toRef(props, 'taskId'),
  close: handleClose,
})
</script>

<template>
  <el-dialog v-model="show" :title="dialogTitle" width="640px" @close="handleClose">
    <section class="create-page">
      <div class="page-head">
        <p class="eyebrow">Task Dialog</p>
        <h2>{{ dialogTitle }}</h2>
        <p class="intro">这里保留展示层，表单状态、校验和提交都收敛在任务模块内部。</p>
      </div>

      <el-form ref="formRef" :model="formData" :rules="formRules" label-position="top" class="task-form">
        <TaskFormFields
          v-model="formData"
          :category-options="categoryOptions"
          :status-options="statusOptions"
          :priority-options="priorityOptions"
        />

        <div class="actions">
          <el-button @click="handleClose">取消</el-button>
          <el-button type="primary" :loading="submitting" @click="handleSubmit">
            {{ submitButtonText }}
          </el-button>
        </div>
      </el-form>
    </section>
  </el-dialog>
</template>

<style scoped>
.create-page {
  display: flex;
  flex-direction: column;
  gap: 1.25rem;
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
  font-size: 1.6rem;
  font-weight: 700;
}

.intro {
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
</style>
