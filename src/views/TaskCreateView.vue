<script setup lang="ts">
import { computed } from 'vue'
import { useRouter } from 'vue-router'
import EntityForm from '@/components/EntityForm.vue'
import type { FormModel } from '@/components/formSchemas'
import { useTaskForm } from '@/features/task/composables/useTaskForm'
import { createTaskFormFields } from '@/features/task/formSchema'
import type { DialogMode } from '@/features/task/types'

const router = useRouter()
const mode = computed<DialogMode>(() => 'create')
const taskFields = createTaskFormFields()

const {
  formData,
  dialogTitle,
  submitButtonText,
  submitting,
  handleSubmit,
} = useTaskForm({
  mode,
  close: () => router.push('/'),
})

function handleEntitySubmit(model: FormModel) {
  Object.assign(formData, model)
  void handleSubmit()
}
</script>

<template>
  <section class="create-page">
    <div class="page-head">
      <p class="eyebrow">Task Create</p>
      <h2>{{ dialogTitle }}</h2>
      <p class="intro">
        This page now uses the same schema-driven task form building blocks as the dialog flow, so
        future field changes stay in one place.
      </p>
    </div>

    <EntityForm
      v-model="formData"
      class="task-form"
      :fields="taskFields"
      :initial-value="formData"
      :loading="submitting"
      :columns="2"
      :submit-text="submitButtonText"
      cancel-text="Back to Board"
      @submit="handleEntitySubmit"
      @cancel="router.push('/')"
    />
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
</style>
