<script setup lang="ts">
import { toRef } from 'vue'
import type { DialogMode } from '@/types/study'
import { useTaskForm } from '@/composables/useTaskForm'

const show = defineModel<boolean>('show', { default: false })

const props = defineProps<{
  mode: DialogMode
  taskId: number | null
}>()

const {
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
} = useTaskForm({
  show,
  mode: toRef(props, 'mode'),
  taskId: toRef(props, 'taskId'),
})
</script>

<template>
  <el-dialog v-model="show" :title="dialogTitle" width="640px" @close="handleClose">
    <section class="create-page">
      <div class="page-head">
        <p class="eyebrow">Task Dialog</p>
        <h2>{{ dialogTitle }}</h2>
        <p class="intro">
          这里的表单逻辑已经被抽到 `useTaskForm()` 里了，组件本身只保留模板和少量接线代码。
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
            placeholder="写清楚这个任务为什么重要，方便自己后续复盘"
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
          <el-button @click="handleClose">取消</el-button>
          <el-button type="primary" @click="handleSubmit">{{ submitButtonText }}</el-button>
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
}
</style>
