<script setup lang="ts">
import { formatFCFA } from '~~/shared/currency'
import { CreateJustificationSchema, validateForm } from '~~/shared/schemas'

interface Props {
  modelValue: boolean
  commitmentId: string
  paidAmount?: number
}

const props = withDefaults(defineProps<Props>(), {
  paidAmount: 0
})
const requestToast = useRequestToast()

const emit = defineEmits<{
  'update:modelValue': [value: boolean]
  justified: []
}>()

const isOpen = computed({
  get: () => props.modelValue,
  set: (val: boolean) => emit('update:modelValue', val)
})

const form = reactive({
  amountSpent: 0,
  date: new Date().toISOString().split('T')[0],
  notes: ''
})

const formErrors = ref<Record<string, string>>({})
const actionLoading = ref(false)
const actionError = ref('')

watch(() => props.modelValue, (val) => {
  if (val) {
    form.amountSpent = props.paidAmount
    form.date = new Date().toISOString().split('T')[0]
    form.notes = ''
    formErrors.value = {}
    actionError.value = ''
  }
})

const liveBalance = computed(() => {
  return props.paidAmount - (form.amountSpent || 0)
})

const submitJustification = async () => {
  formErrors.value = {}
  actionError.value = ''

  const payload = {
    commitmentId: props.commitmentId,
    amountSpent: Math.round(Number(form.amountSpent)),
    date: form.date,
    notes: form.notes
  }

  const validation = validateForm(CreateJustificationSchema, payload)
  if (!validation.success) {
    formErrors.value = validation.errors
    actionError.value = validation.firstError
    return
  }

  actionLoading.value = true
  try {
    await useApi().post('/api/justifications', validation.data)
    isOpen.value = false
    requestToast.success('Justification enregistrée.')
    emit('justified')
  } catch (err: any) {
    requestToast.error(err.data?.statusMessage || err.message || 'Erreur lors de l’enregistrement de la justification')
  } finally {
    actionLoading.value = false
  }
}
</script>

<template>
  <AppModal
    v-model="isOpen"
    title="Enregistrer la justification des dépenses"
    description="Saisissez le montant effectivement dépensé sur factures pour calculer le reliquat."
    icon="i-lucide-receipt"
    confirm-label="Clôturer la Justification"
    :confirm-loading="actionLoading"
    @confirm="submitJustification"
  >
    <div v-if="actionError" class="p-3 rounded-lg bg-red-50 text-red-700 text-xs">
      {{ actionError }}
    </div>

    <div class="space-y-3">
      <AppInput
        v-model.number="form.amountSpent"
        type="number"
        label="Montant réellement dépensé (FCFA)"
        min="0"
        :error="formErrors.amountSpent"
        required
      />

      <!-- Calcul en direct du reliquat -->
      <div
        class="p-3 rounded-lg border text-xs"
        :class="[
          liveBalance > 0
            ? 'bg-emerald-50 text-emerald-800 border-emerald-200'
            : liveBalance === 0
              ? 'bg-slate-50 text-slate-800 border-slate-200'
              : 'bg-red-50 text-red-800 border-red-200'
        ]"
      >
        <div class="font-medium">
          {{ liveBalance > 0 ? 'Reliquat à restituer par l’employé :' : liveBalance === 0 ? 'Dépense exacte (aucun reliquat) :' : 'Dépassement de budget à la charge de l’employé :' }}
        </div>
        <div class="text-base font-bold mt-0.5">
          {{ formatFCFA(liveBalance) }}
        </div>
      </div>

      <AppDatePicker
        v-model="form.date"
        label="Date du bilan"
        :error="formErrors.date"
        required
      />

      <AppInput
        v-model="form.notes"
        type="textarea"
        label="Notes & Références factures"
        placeholder="Ex : Factures n°12 et 14 conformes, reliquat de 5 000 versé en caisse..."
        :error="formErrors.notes"
        :rows="2"
      />
    </div>
  </AppModal>
</template>
