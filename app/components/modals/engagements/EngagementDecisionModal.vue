<script setup lang="ts">
import { ApproveCommitmentSchema, validateForm } from '~~/shared/schemas'

interface Props {
  modelValue: boolean
  commitmentId: string
  decisionType: 'approve' | 'refuse'
  amountRequested?: number
  formattedAmountRequested?: string
}

const props = withDefaults(defineProps<Props>(), {
  amountRequested: 0,
  formattedAmountRequested: '0 FCFA'
})
const requestToast = useRequestToast()

const emit = defineEmits<{
  'update:modelValue': [value: boolean]
  decided: []
}>()

const isOpen = computed({
  get: () => props.modelValue,
  set: (val: boolean) => emit('update:modelValue', val)
})

const form = reactive({
  amountApproved: 0,
  refusalReason: ''
})

const formErrors = ref<Record<string, string>>({})
const actionLoading = ref(false)
const actionError = ref('')

watch(() => props.modelValue, (val) => {
  if (val) {
    formErrors.value = {}
    actionError.value = ''
    if (props.decisionType === 'approve') {
      form.amountApproved = props.amountRequested
    } else {
      form.refusalReason = ''
    }
  }
})

const submitDecision = async () => {
  formErrors.value = {}
  actionError.value = ''

  const payload = {
    approved: props.decisionType === 'approve',
    amountApproved: Math.round(Number(form.amountApproved)),
    refusalReason: form.refusalReason
  }

  const validation = validateForm(ApproveCommitmentSchema, payload)
  if (!validation.success) {
    formErrors.value = validation.errors
    actionError.value = validation.firstError
    return
  }

  actionLoading.value = true
  try {
    await useApi().post(`/api/commitments/${props.commitmentId}/decision`, validation.data)
    isOpen.value = false
    requestToast.success(props.decisionType === 'approve' ? 'Engagement accepté.' : 'Engagement refusé.')
    emit('decided')
  } catch (err: any) {
    requestToast.error(err.data?.statusMessage || err.message || 'Erreur lors de la prise de décision')
  } finally {
    actionLoading.value = false
  }
}
</script>

<template>
  <AppModal
    v-model="isOpen"
    :title="decisionType === 'approve' ? 'Accepter l’engagement' : 'Refuser l’engagement'"
    :description="decisionType === 'approve' ? 'Validez le montant demandé ou accordez un montant partiel.' : 'Précisez le motif du refus qui sera conservé au dossier.'"
    :icon="decisionType === 'approve' ? 'i-lucide-check-circle' : 'i-lucide-x-circle'"
    :confirm-label="decisionType === 'approve' ? 'Confirmer l’acceptation' : 'Confirmer le refus'"
    :confirm-color="decisionType === 'approve' ? 'primary' : 'error'"
    :confirm-loading="actionLoading"
    @confirm="submitDecision"
  >
    <div v-if="actionError" class="p-3 rounded-lg bg-red-50 text-red-700 text-xs">
      {{ actionError }}
    </div>

    <div v-if="decisionType === 'approve'" class="space-y-3">
      <p class="text-xs text-slate-600 dark:text-slate-400">
        Le montant total demandé est de <strong>{{ formattedAmountRequested }}</strong>.
      </p>

      <AppInput
        v-model.number="form.amountApproved"
        type="number"
        label="Montant accordé (FCFA)"
        min="1"
        :error="formErrors.amountApproved"
        required
      />
    </div>

    <div v-else class="space-y-3">
      <AppInput
        v-model="form.refusalReason"
        type="textarea"
        label="Motif du refus"
        placeholder="Ex : Écart de prix suspect sur le ciment, devis non justifié..."
        :error="formErrors.refusalReason"
        required
        :rows="3"
      />
    </div>
  </AppModal>
</template>
