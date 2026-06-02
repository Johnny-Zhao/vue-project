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

const normalizedModel = computed({
  get: () => model.value,
  set: (value: FormModel) => {
    model.value = value
  },
})

function handleSearch() {
  emit('search', { ...model.value })
}

function handleReset() {
  const nextModel = createModelFromFields(props.fields)
  model.value = nextModel
  emit('reset', { ...nextModel })
}
</script>

<template>
  <section class="query-form-shell">
    <el-form :model="normalizedModel" label-position="top" class="query-form">
      <SmartFormFields
        v-model="normalizedModel"
        :fields="fields"
        :columns="columns"
        @field-change="emit('fieldChange', $event)"
      />

      <div class="query-form-actions">
        <el-button @click="handleReset">{{ resetText }}</el-button>
        <el-button type="primary" :loading="loading" @click="handleSearch">
          {{ submitText }}
        </el-button>
      </div>
    </el-form>
  </section>
</template>

<style scoped>
.query-form-shell {
  padding: 1.25rem;
  border-radius: 24px;
  border: 1px solid rgba(29, 59, 54, 0.08);
  background: rgba(255, 255, 255, 0.76);
}

.query-form-actions {
  display: flex;
  justify-content: flex-end;
  gap: 0.75rem;
}

@media (max-width: 768px) {
  .query-form-actions {
    justify-content: stretch;
  }
}
</style>
