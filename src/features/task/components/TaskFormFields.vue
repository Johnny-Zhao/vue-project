<script setup lang="ts">
import { computed } from 'vue'
import type { CreateTaskForm } from '../types'

const formData = defineModel<CreateTaskForm>({ required: true })

defineProps<{
  categoryOptions: Array<{ label: string; value: CreateTaskForm['category'] }>
  statusOptions: Array<{ label: string; value: CreateTaskForm['status'] }>
  priorityOptions: Array<{ label: string; value: CreateTaskForm['priority'] }>
}>()

function createFieldModel<K extends keyof CreateTaskForm>(key: K) {
  return computed({
    get: () => formData.value[key],
    set: (value: CreateTaskForm[K]) => {
      formData.value = {
        ...formData.value,
        [key]: value,
      }
    },
  })
}

const title = createFieldModel('title')
const summary = createFieldModel('summary')
const category = createFieldModel('category')
const status = createFieldModel('status')
const priority = createFieldModel('priority')
const estimateHours = createFieldModel('estimateHours')
</script>

<template>
  <el-form-item label="任务名称" prop="title">
    <el-input v-model="title" placeholder="例如：补齐 TS 联合类型和泛型" clearable />
  </el-form-item>

  <el-form-item label="任务描述" prop="summary">
    <el-input
      v-model="summary"
      type="textarea"
      :rows="4"
      maxlength="120"
      show-word-limit
      placeholder="写清楚这个任务为什么重要，方便自己后续复盘"
    />
  </el-form-item>

  <div class="form-grid">
    <el-form-item label="任务分类" prop="category">
      <el-select v-model="category" placeholder="请选择任务分类">
        <el-option
          v-for="item in categoryOptions"
          :key="item.value"
          :label="item.label"
          :value="item.value"
        />
      </el-select>
    </el-form-item>

    <el-form-item label="任务状态" prop="status">
      <el-select v-model="status" placeholder="请选择任务状态">
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
      <el-select v-model="priority" placeholder="请选择任务优先级">
        <el-option
          v-for="item in priorityOptions"
          :key="item.value"
          :label="item.label"
          :value="item.value"
        />
      </el-select>
    </el-form-item>

    <el-form-item label="预估工时" prop="estimateHours">
      <el-input-number v-model="estimateHours" :min="1" :max="100" />
    </el-form-item>
  </div>
</template>

<style scoped>
.form-grid {
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: 1rem;
}

@media (max-width: 768px) {
  .form-grid {
    grid-template-columns: 1fr;
  }
}
</style>
