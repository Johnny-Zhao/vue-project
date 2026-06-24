<script setup lang="ts">
import { computed } from 'vue'
import type { FormModel, FormFieldSchema } from './formSchemas'
import { evaluateFieldVisibility } from './formSchemas'

const model = defineModel<FormModel>({ required: true })

const props = withDefaults(
  defineProps<{
    fields: FormFieldSchema[]
    columns?: number
    inline?: boolean
  }>(),
  {
    columns: 2,
    inline: false,
  },
)

const emit = defineEmits<{
  fieldChange: [payload: { key: string; value: unknown; model: FormModel }]
}>()

// 过滤出当前可见字段，兼容动态显隐规则。
const visibleFields = computed(() =>
  props.fields.filter((field) => evaluateFieldVisibility(field.visible, model.value, true)),
)

// 根据字段类型解析对应控件名称。
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

// 为字段补齐默认占位文案。
function getPlaceholder(field: FormFieldSchema) {
  if (field.placeholder) {
    return field.placeholder
  }

  switch (field.type) {
    case 'select':
    case 'date':
    case 'daterange':
      return `请选择${field.label}`
    default:
      return `请输入${field.label}`
  }
}

// 统一解析字段禁用态。
function isFieldDisabled(field: FormFieldSchema) {
  return evaluateFieldVisibility(field.disabled, model.value, false)
}

// 为每个字段建立双向绑定，并在变更时触发联动。
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

// 解析字段跨列数，兼容默认值。
function getFieldSpan(field: FormFieldSchema) {
  return field.span ?? 1
}
</script>

<template>
  <div
    class="smart-form-grid"
    :class="{ 'smart-form-grid--inline': inline }"
    :style="{ '--smart-form-columns': String(columns) }"
  >
    <div
      v-for="field in visibleFields"
      :key="field.key"
      class="smart-form-item"
      :class="{ 'smart-form-item--inline': inline }"
      :style="{ '--smart-form-span': String(getFieldSpan(field)) }"
    >
      <el-form-item :label="field.label" :prop="field.key" :required="field.required">
        <component
          :is="getComponentName(field)"
          v-model="getFieldModel(field).value"
          class="smart-field-control"
          :type="
            field.type === 'textarea'
              ? 'textarea'
              : field.type === 'date'
                ? 'date'
                : field.type === 'daterange'
                  ? 'daterange'
                  : undefined
          "
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

<style scoped lang="less">
.smart-form-grid {
  display: grid;
  grid-template-columns: repeat(var(--smart-form-columns), minmax(0, 1fr));
  gap: 1rem;

  .smart-form-item {
    grid-column: span min(var(--smart-form-span), var(--smart-form-columns));
  }
}

.smart-field-control {
  width: 100%;
}

.smart-form-grid--inline {
  display: flex;
  flex-wrap: wrap;
  align-items: flex-start;
  gap: 0.45rem 0.75rem;

  .smart-form-item--inline {
    flex: 0 0 auto;
    min-width: 220px;
    max-width: 320px;
  }
}

@media (max-width: 900px) {
  .smart-form-grid {
    grid-template-columns: 1fr;

    .smart-form-item {
      grid-column: span 1;
    }
  }

  .smart-form-grid--inline {
    .smart-form-item--inline {
      min-width: 100%;
      max-width: none;
      flex-basis: 100%;
    }
  }
}
</style>
