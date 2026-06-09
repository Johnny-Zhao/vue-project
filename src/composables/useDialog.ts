import { computed, ref } from 'vue'

export type DialogMode = 'create' | 'edit'

interface UseDialogOptions {
  createTitle?: string
  editTitle?: string
}

export function useDialog<TPayload = unknown>(options: UseDialogOptions = {}) {
  const visible = ref(false)
  const mode = ref<DialogMode>('create')
  const payload = ref<TPayload | null>(null)

  const title = computed(() => {
    if (mode.value === 'edit') {
      return options.editTitle ?? '编辑'
    }

    return options.createTitle ?? '新建'
  })

  function openCreate(nextPayload: TPayload | null = null) {
    mode.value = 'create'
    payload.value = nextPayload
    visible.value = true
  }

  function openEdit(nextPayload: TPayload) {
    mode.value = 'edit'
    payload.value = nextPayload
    visible.value = true
  }

  function close() {
    visible.value = false
    payload.value = null
  }

  return {
    visible,
    mode,
    payload,
    title,
    openCreate,
    openEdit,
    close,
  }
}
