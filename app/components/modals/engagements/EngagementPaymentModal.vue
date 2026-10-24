<script setup lang="ts">
import { CreatePaymentSchema, validateForm } from '~~/shared/schemas'

interface Props {
  modelValue: boolean
  commitmentId: string
  defaultAmount?: number
}

const props = withDefaults(defineProps<Props>(), {
  defaultAmount: 0
})

const emit = defineEmits<{
  'update:modelValue': [value: boolean]
  paid: []
}>()

const isOpen = computed({
  get: () => props.modelValue,
  set: (val: boolean) => emit('update:modelValue', val)
})

const form = reactive({
  amount: 0,
  date: new Date().toISOString().split('T')[0],
  method: 'Espèces' as 'Espèces' | 'Virement' | 'Chèque' | 'Mobile Money' | 'Autre',
  reference: '',
  notes: ''
})

const formErrors = ref<Record<string, string>>({})
const actionLoading = ref(false)
const actionError = ref('')

watch(() => props.modelValue, (val) => {
  if (val) {
    form.amount = props.defaultAmount
    form.date = new Date().toISOString().split('T')[0]
    form.method = 'Espèces'
    form.reference = ''
    form.notes = ''
    formErrors.value = {}
    actionError.value = ''
  }
})

const submitPayment = async () => {
  formErrors.value = {}
  actionError.value = ''

  const payload = {
    commitmentId: props.commitmentId,
    amount: Math.round(Number(form.amount)),
    date: form.date,
    method: form.method,
    reference: form.reference,
    notes: form.notes
  }

  const validation = validateForm(CreatePaymentSchema, payload)
  if (!validation.success) {
    formErrors.value = validation.errors
    actionError.value = validation.firstError
    return
  }

  actionLoading.value = true
  try {
    await $fetch('/api/payments', {
      method: 'POST',
      body: validation.data
    })
    isOpen.value = false
    emit('paid')
  } catch (err: any) {
    actionError.value = err.data?.statusMessage || err.message || 'Erreur lors de l’enregistrement du paiement'
  } finally {
    actionLoading.value = false
  }
}
</script>

<template>
  <AppModal
    v-model="isOpen"
    title="Enregistrer le paiement (Décaissement)"
    description="Le statut passera à Payé et déclenchera le suivi du délai de justification."
    icon="i-lucide-banknote"
    confirm-label="Valider le Paiement"
    :confirm-loading="actionLoading"
    @confirm="submitPayment"
  >
    <div v-if="actionError" class="p-3 rounded-lg bg-red-50 text-red-700 text-xs">
      {{ actionError }}
    </div>

    <div class="space-y-3">
      <AppInput
        v-model.number="form.amount"
        type="number"
        label="Montant payé (FCFA)"
        min="1"
        :error="formErrors.amount"
        required
      />

      <div class="grid grid-cols-2 gap-3">
        <div>
          <label class="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
            Mode de paiement
          </label>
          <select
            v-model="form.method"
            class="w-full px-3 py-2 text-xs rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-800 dark:text-slate-200"
          >
            <option value="Espèces">Espèces</option>
            <option value="Virement">Virement bancaire</option>
            <option value="Chèque">Chèque</option>
            <option value="Mobile Money">Mobile Money (Orange/MTN)</option>
            <option value="Autre">Autre</option>
          </select>
        </div>

        <AppDatePicker
          v-model="form.date"
          label="Date de paiement"
          :error="formErrors.date"
          required
        />
      </div>

      <AppInput
        v-model="form.reference"
        label="Référence / N° de reçu (facultatif)"
        placeholder="Ex: RECU-089 ou ID Transaction OM"
        :error="formErrors.reference"
      />
    </div>
  </AppModal>
</template>
