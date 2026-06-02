<script setup lang="ts">
import { computed, ref } from 'vue'
import type { FormInstance, FormRules } from 'element-plus'
import SmartFormFields from './SmartFormFields.vue'
import type { FormModel, FormFieldSchema } from './formSchemas'
import { createModelFromFields } from './formSchemas'

const model = defineModel<FormModel>({ required: true })

const props = withDefaults(
  defineProps<{
    fields: FormFieldSchema[]
    initialValue?: FormModel
    loading?: boolean
    columns?: number
    submitText?: string
    cancelText?: string
    showActions?: boolean
  }>(),
  {
    loading: false,
    columns: 2,
    submitText: '保存',
    cancelText: '取消',
    showActions: true,
    initialValue: undefined,
  },
)

const emit = defineEmits<{
  submit: [model: FormModel]
  cancel: []
  fieldChange: [payload: { key: string; value: unknown; model: FormModel }]
}>()

const formRef = ref<FormInstance | null>(null)

const mergedRules = computed<FormRules>(() => {
  const rules: FormRules = {}

  for (const field of props.fields) {
    const currentRules = [...(field.rules ?? [])]

    if (field.required) {
      currentRules.unshift({
        required: true,
        message: field.placeholder ?? `请完善${field.label}`,
        trigger: field.type === 'select' || field.type === 'date' || field.type === 'daterange' ? 'change' : 'blur',
      })
    }

    if (currentRules.length > 0) {
      rules[field.key] = currentRules
    }
  }

  return rules
})

const normalizedModel = computed({
  get: () => model.value,
  set: (value: FormModel) => {
    model.value = value
  },
})

async function validate() {
  return formRef.value?.validate().catch(() => false)
}

function reset() {
  normalizedModel.value = createModelFromFields(props.fields, props.initialValue ?? {})
  formRef.value?.clearValidate()
}

function clearValidate() {
  formRef.value?.clearValidate()
}

async function handleSubmit() {
  const isValid = await validate()
  if (!isValid) {
    return
  }

  emit('submit', { ...normalizedModel.value })
}

defineExpose({
  validate,
  reset,
  clearValidate,
})
</script>

<template>
  <el-form ref="formRef" :model="normalizedModel" :rules="mergedRules" label-position="top" class="entity-form">
    <SmartFormFields
      v-model="normalizedModel"
      :fields="fields"
      :columns="columns"
      @field-change="emit('fieldChange', $event)"
    />

    <div v-if="showActions" class="entity-form-actions">
      <el-button @click="emit('cancel')">{{ cancelText }}</el-button>
      <el-button type="primary" :loading="loading" @click="handleSubmit">
        {{ submitText }}
      </el-button>
    </div>
  </el-form>
</template>

<style scoped>
.entity-form {
  display: flex;
  flex-direction: column;
  gap: 1rem;
}

.entity-form-actions {
  display: flex;
  justify-content: flex-end;
  gap: 0.75rem;
}

@media (max-width: 768px) {
  .entity-form-actions {
    justify-content: stretch;
  }
}
</style>
