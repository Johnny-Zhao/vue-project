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

// 合并字段校验规则，并为必填字段补齐默认校验提示。
const mergedRules = computed<FormRules>(() => {
  const rules: FormRules = {}

  for (const field of props.fields) {
    const currentRules = [...(field.rules ?? [])]

    if (field.required) {
      currentRules.unshift({
        required: true,
        message: field.placeholder ?? `请完善${field.label}`,
        trigger:
          field.type === 'select' || field.type === 'date' || field.type === 'daterange'
            ? 'change'
            : 'blur',
      })
    }

    if (currentRules.length > 0) {
      rules[field.key] = currentRules
    }
  }

  return rules
})

// 透传表单模型，保持与父组件的双向绑定一致。
const normalizedModel = computed({
  get: () => model.value,
  set: (value: FormModel) => {
    model.value = value
  },
})

// 执行表单校验并返回校验结果。
async function validate() {
  return formRef.value?.validate().catch(() => false)
}

// 重置表单值并清理校验状态。
function reset() {
  normalizedModel.value = createModelFromFields(props.fields, props.initialValue ?? {})
  formRef.value?.clearValidate()
}

// 对外暴露清理校验方法。
function clearValidate() {
  formRef.value?.clearValidate()
}

// 提交前统一执行校验，通过后再抛出最终表单值。
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
  <el-form
    ref="formRef"
    :model="normalizedModel"
    :rules="mergedRules"
    label-position="top"
    class="entity-form"
  >
    <SmartFormFields
      v-model="normalizedModel"
      :fields="fields"
      :columns="columns"
      @field-change="emit('fieldChange', $event)"
    />

    <div v-if="showActions" class="entity-form-actions">
      <el-button size="small" @click="emit('cancel')">{{ cancelText }}</el-button>
      <el-button size="small" type="primary" :loading="loading" @click="handleSubmit">
        {{ submitText }}
      </el-button>
    </div>
  </el-form>
</template>

<style scoped lang="less">
.entity-form {
  display: flex;
  flex-direction: column;
  gap: 0.85rem;

  :deep(.el-form-item) {
    margin-bottom: 0;
  }

  :deep(.el-form-item__label) {
    padding-bottom: 0.32rem;
    color: #334155;
    font-size: 0.82rem;
    line-height: 1.4;
  }

  :deep(.el-input__wrapper),
  :deep(.el-textarea__wrapper),
  :deep(.el-select__wrapper),
  :deep(.el-date-editor.el-input__wrapper),
  :deep(.el-date-editor.el-range-editor) {
    min-height: 32px;
    border-radius: 0;
    box-shadow: 0 0 0 1px #d4dceb inset;
  }

  :deep(.el-input__inner),
  :deep(.el-select__placeholder),
  :deep(.el-range-input),
  :deep(.el-textarea__inner) {
    font-size: 0.82rem;
  }

  :deep(.el-input-number) {
    width: 100%;
  }

  :deep(.el-switch) {
    height: 32px;
  }
}

.entity-form-actions {
  display: flex;
  justify-content: flex-end;
  gap: 0.45rem;
  padding-top: 0.2rem;

  :deep(.el-button) {
    min-height: 30px;
    padding: 6px 14px;
    border-radius: 0;
    font-size: 0.8rem;
  }
}

@media (max-width: 768px) {
  .entity-form-actions {
    justify-content: stretch;
  }
}
</style>
