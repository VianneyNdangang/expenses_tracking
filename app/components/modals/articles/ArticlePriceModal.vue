<script setup lang="ts">
import { formatFCFA } from '~~/shared/currency'
import { NewPriceSchema, validateForm } from '~~/shared/schemas'

interface Props {
  modelValue: boolean
  item: any | null
}

const props = withDefaults(defineProps<Props>(), {
  item: null
})
const requestToast = useRequestToast()

const emit = defineEmits<{
  'update:modelValue': [value: boolean]
  saved: []
}>()

const isOpen = computed({
  get: () => props.modelValue,
  set: (val: boolean) => emit('update:modelValue', val)
})

const form = reactive({
  referencePrice: 0,
  tolerancePercent: 10,
  notes: ''
})

const formErrors = ref<Record<string, string>>({})
const modalLoading = ref(false)
const modalError = ref('')

watch(() => props.modelValue, (val) => {
  if (val && props.item) {
    form.referencePrice = props.item.referencePrice || 0
    form.tolerancePercent = props.item.tolerancePercent || 10
    form.notes = ''
    formErrors.value = {}
    modalError.value = ''
  }
})

const submitNewPrice = async () => {
  if (!props.item) return
  formErrors.value = {}
  modalError.value = ''

  const validation = validateForm(NewPriceSchema, {
    referencePrice: Number(form.referencePrice),
    tolerancePercent: Number(form.tolerancePercent),
    notes: form.notes
  })

  if (!validation.success) {
    formErrors.value = validation.errors
    modalError.value = validation.firstError
    return
  }

  modalLoading.value = true
  try {
    await useApi().post(`/api/items/${props.item.id}/price`, validation.data)
    isOpen.value = false
    requestToast.success('Le tarif de référence a été mis à jour.')
    emit('saved')
  } catch (err: any) {
    requestToast.error(err.data?.statusMessage || err.message || 'Erreur lors de la mise à jour')
  } finally {
    modalLoading.value = false
  }
}
</script>

<template>
  <AppModal
    v-model="isOpen"
    title="Mettre à jour le tarif de référence"
    :description="`Article : ${item?.name || ''} (actuel : ${formatFCFA(item?.referencePrice || 0)})`"
    icon="i-lucide-trending-up"
    confirm-label="Valider le nouveau tarif"
    :confirm-loading="modalLoading"
    @confirm="submitNewPrice"
  >
    <div v-if="modalError" class="p-3 rounded-lg bg-red-50 text-red-700 text-xs">
      {{ modalError }}
    </div>

    <div class="space-y-3">
      <p class="text-xs text-slate-500">
        L'ancien tarif sera archivé dans l'historique et le nouveau tarif prendra effet immédiatement pour tous les futurs engagements.
      </p>

      <AppInput
        v-model.number="form.referencePrice"
        type="number"
        label="Nouveau prix de référence (FCFA)"
        :error="formErrors.referencePrice"
        min="1"
        required
      />

      <AppInput
        v-model.number="form.tolerancePercent"
        type="number"
        label="Tolérance admise (%)"
        :error="formErrors.tolerancePercent"
        min="0"
        max="100"
      />

      <AppInput
        v-model="form.notes"
        label="Motif du changement de prix"
        placeholder="Ex: Hausse des prix usine, nouveau transporteur..."
      />
    </div>
  </AppModal>
</template>
