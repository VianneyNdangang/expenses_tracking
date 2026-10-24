<script setup lang="ts">
import { CancelCommitmentSchema, validateForm } from '~~/shared/schemas'

interface Props {
  modelValue: boolean
  commitmentId: string
}

const props = defineProps<Props>()

const emit = defineEmits<{
  'update:modelValue': [value: boolean]
  cancelled: []
}>()

const isOpen = computed({
  get: () => props.modelValue,
  set: (val: boolean) => emit('update:modelValue', val)
})

const cancelForm = reactive({
  reason: ''
})

const cancelErrors = ref<Record<string, string>>({})
const actionLoading = ref(false)
const actionError = ref('')

watch(() => props.modelValue, (val) => {
  if (val) {
    cancelForm.reason = ''
    cancelErrors.value = {}
    actionError.value = ''
  }
})

const submitCancel = async () => {
  cancelErrors.value = {}
  actionError.value = ''

  const validation = validateForm(CancelCommitmentSchema, {
    reason: cancelForm.reason
  })

  if (!validation.success) {
    cancelErrors.value = validation.errors
    actionError.value = validation.firstError
    return
  }

  actionLoading.value = true
  try {
    await $fetch(`/api/commitments/${props.commitmentId}/cancel`, {
      method: 'POST',
      body: validation.data
    })
    isOpen.value = false
    emit('cancelled')
  } catch (err: any) {
    actionError.value = err.data?.statusMessage || err.message || 'Erreur lors de l’annulation'
  } finally {
    actionLoading.value = false
  }
}
</script>

<template>
  <AppModal
    v-model="isOpen"
    title="Annuler cet engagement"
    description="Cette action est irréversible et sera intégralement tracée dans le journal d'audit."
    icon="i-lucide-alert-octagon"
    confirm-label="Confirmer l'annulation"
    confirm-color="error"
    :confirm-disabled="!cancelForm.reason"
    :confirm-loading="actionLoading"
    @confirm="submitCancel"
  >
    <div v-if="actionError" class="p-3 rounded-lg bg-red-50 text-red-700 text-xs">
      {{ actionError }}
    </div>

    <div class="space-y-3">
      <AppInput
        v-model="cancelForm.reason"
        type="textarea"
        label="Motif obligatoire de l'annulation"
        placeholder="Précisez la raison de l'annulation..."
        :error="cancelErrors.reason"
        required
        :rows="3"
      />
    </div>
  </AppModal>
</template>
