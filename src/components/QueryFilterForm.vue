<script setup lang="ts">
import { computed } from 'vue'
import SmartFormFields from './SmartFormFields.vue'
import type { FormModel, FormFieldSchema } from './formSchemas'
import { createModelFromFields } from './formSchemas'

const model = defineModel<FormModel>({ required: true })

const props = withDefaults(
  defineProps<{
    fields: FormFieldSchema[]
    loading?: boolean
    columns?: number
    submitText?: string
    resetText?: string
  }>(),
  {
    loading: false,
    columns: 3,
    submitText: '查询',
    resetText: '重置',
  },
)

const emit = defineEmits<{
  search: [model: FormModel]
  reset: [model: FormModel]
  fieldChange: [payload: { key: string; value: unknown; model: FormModel }]
}>()

// 透传表单模型，保持与父组件的双向绑定一致。
const normalizedModel = computed({
  get: () => model.value,
  set: (value: FormModel) => {
    model.value = value
  },
})

// 点击查询时抛出当前筛选条件。
function handleSearch() {
  emit('search', { ...model.value })
}

// 点击重置时恢复为字段默认值。
function handleReset() {
  const nextModel = createModelFromFields(props.fields)
  model.value = nextModel
  emit('reset', { ...nextModel })
}
</script>

<template>
  <section class="query-form-shell">
    <el-form :model="normalizedModel" label-position="left" label-width="72px" class="query-form">
      <SmartFormFields
        v-model="normalizedModel"
        :fields="fields"
        :columns="columns"
        inline
        @field-change="emit('fieldChange', $event)"
      />

      <div class="query-form-actions">
        <el-button size="small" @click="handleReset">{{ resetText }}</el-button>
        <el-button size="small" type="primary" :loading="loading" @click="handleSearch">
          {{ submitText }}
        </el-button>
      </div>
    </el-form>
  </section>
</template>

<style scoped lang="less">
.query-form-shell {
  padding: 0.7rem 0.85rem;
  border: 1px solid #d8e2f0;
  border-radius: 0;
  background: #ffffff;
}

.query-form {
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
  gap: 0.75rem 1rem;
  flex-wrap: wrap;

  :deep(.el-form-item) {
    margin-bottom: 0;
  }

  :deep(.el-form-item__label) {
    height: 28px;
    padding-right: 0.45rem;
    color: #334155;
    font-size: 0.8rem;
    line-height: 28px;
  }

  :deep(.el-input__wrapper),
  :deep(.el-textarea__wrapper),
  :deep(.el-select__wrapper),
  :deep(.el-date-editor.el-input__wrapper),
  :deep(.el-date-editor.el-range-editor) {
    min-height: 28px;
    border-radius: 0;
    box-shadow: 0 0 0 1px #d4dceb inset;
  }

  :deep(.el-input__inner),
  :deep(.el-select__placeholder),
  :deep(.el-range-input) {
    font-size: 0.8rem;
  }

  :deep(.el-input-number) {
    width: 100%;
  }

  :deep(.el-switch) {
    height: 28px;
  }
}

.query-form-actions {
  display: flex;
  align-items: center;
  justify-content: flex-end;
  gap: 0.45rem;
  margin-left: auto;

  :deep(.el-button) {
    min-height: 28px;
    padding: 6px 12px;
    border-radius: 0;
    font-size: 0.8rem;
  }
}

@media (max-width: 768px) {
  .query-form {
    flex-direction: column;
    align-items: stretch;
  }

  .query-form-actions {
    width: 100%;
    margin-left: 0;
    justify-content: flex-end;
  }
}
</style>
