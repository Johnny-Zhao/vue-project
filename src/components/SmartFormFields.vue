<script setup lang="ts">
import { computed } from 'vue'
import type { FormModel, FormFieldSchema } from './formSchemas'
import { evaluateFieldVisibility } from './formSchemas'

const model = defineModel<FormModel>({ required: true })

const props = withDefaults(
  defineProps<{
    fields: FormFieldSchema[]
    columns?: number
  }>(),
  {
    columns: 2,
  },
)

const emit = defineEmits<{
  fieldChange: [payload: { key: string; value: unknown; model: FormModel }]
}>()

const visibleFields = computed(() =>
  props.fields.filter((field) => evaluateFieldVisibility(field.visible, model.value, true)),
)

function getComponentName(field: FormFieldSchema) {
  switch (field.type) {
    case 'textarea':
      return 'el-input'
    case 'select':
      return 'el-select'
    case 'number':
      return 'el-input-number'
    case 'switch':
      return 'el-switch'
    case 'date':
    case 'daterange':
      return 'el-date-picker'
    case 'checkbox':
      return 'el-checkbox'
    default:
      return 'el-input'
  }
}

function getPlaceholder(field: FormFieldSchema) {
  if (field.placeholder) {
    return field.placeholder
  }

  switch (field.type) {
    case 'select':
      return `请选择${field.label}`
    case 'date':
    case 'daterange':
      return `请选择${field.label}`
    default:
      return `请输入${field.label}`
  }
}

function isFieldDisabled(field: FormFieldSchema) {
  return evaluateFieldVisibility(field.disabled, model.value, false)
}

function getFieldModel(field: FormFieldSchema) {
  return computed({
    get: () => model.value[field.key],
    set: (value: unknown) => {
      let nextModel: FormModel = {
        ...model.value,
        [field.key]: value,
      }

      const linkageResult = field.onChange?.(value, nextModel)
      if (linkageResult) {
        nextModel = {
          ...nextModel,
          ...linkageResult,
        }
      }

      model.value = nextModel
      emit('fieldChange', {
        key: field.key,
        value,
        model: nextModel,
      })
    },
  })
}

function getFieldSpan(field: FormFieldSchema) {
  return field.span ?? 1
}
</script>

<template>
  <div class="smart-form-grid" :style="{ '--smart-form-columns': String(columns) }">
    <div
      v-for="field in visibleFields"
      :key="field.key"
      class="smart-form-item"
      :style="{ '--smart-form-span': String(getFieldSpan(field)) }"
    >
      <el-form-item :label="field.label" :prop="field.key" :required="field.required">
        <component
          :is="getComponentName(field)"
          v-model="getFieldModel(field).value"
          class="smart-field-control"
          :type="field.type === 'textarea' ? 'textarea' : field.type === 'date' ? 'date' : field.type === 'daterange' ? 'daterange' : undefined"
          :rows="field.type === 'textarea' ? 4 : undefined"
          :placeholder="field.type === 'checkbox' ? undefined : getPlaceholder(field)"
          :disabled="isFieldDisabled(field)"
          v-bind="field.componentProps"
        >
          <template v-if="field.type === 'select'">
            <el-option
              v-for="option in field.options ?? []"
              :key="`${field.key}-${String(option.value)}`"
              :label="option.label"
              :value="option.value"
              :disabled="option.disabled"
            />
          </template>

          <template v-if="field.type === 'checkbox'">
            {{ field.label }}
          </template>
        </component>
      </el-form-item>
    </div>
  </div>
</template>

<style scoped>
.smart-form-grid {
  display: grid;
  grid-template-columns: repeat(var(--smart-form-columns), minmax(0, 1fr));
  gap: 1rem;
}

.smart-form-item {
  grid-column: span min(var(--smart-form-span), var(--smart-form-columns));
}

.smart-field-control {
  width: 100%;
}

@media (max-width: 900px) {
  .smart-form-grid {
    grid-template-columns: 1fr;
  }

  .smart-form-item {
    grid-column: span 1;
  }
}
</style>
