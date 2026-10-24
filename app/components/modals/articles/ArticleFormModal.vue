<script setup lang="ts">
import { CreateItemSchema, validateForm } from '~~/shared/schemas'

interface Props {
  modelValue: boolean
}

const props = defineProps<Props>()

const emit = defineEmits<{
  'update:modelValue': [value: boolean]
  saved: []
}>()

const isOpen = computed({
  get: () => props.modelValue,
  set: (val: boolean) => emit('update:modelValue', val)
})

const form = reactive({
  name: '',
  unit: 'Unité',
  referencePrice: 0,
  tolerancePercent: 10,
  notes: ''
})

const formErrors = ref<Record<string, string>>({})
const modalLoading = ref(false)
const modalError = ref('')

const resetForm = () => {
  form.name = ''
  form.unit = 'Unité'
  form.referencePrice = 0
  form.tolerancePercent = 10
  form.notes = ''
  formErrors.value = {}
  modalError.value = ''
}

watch(() => props.modelValue, (val) => {
  if (val) {
    resetForm()
  }
})

const submitNewItem = async () => {
  formErrors.value = {}
  modalError.value = ''

  const validation = validateForm(CreateItemSchema, {
    name: form.name,
    unit: form.unit,
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
    await $fetch('/api/items', {
      method: 'POST',
      body: validation.data
    })
    isOpen.value = false
    emit('saved')
  } catch (err: any) {
    modalError.value = err.data?.statusMessage || err.message || 'Erreur lors de l’ajout'
  } finally {
    modalLoading.value = false
  }
}
</script>

<template>
  <AppModal
    v-model="isOpen"
    title="Créer un nouvel article de référence"
    description="Ce barème servira à évaluer automatiquement les demandes d'achat"
    icon="i-lucide-package-plus"
    confirm-label="Enregistrer l'article"
    :confirm-loading="modalLoading"
    @confirm="submitNewItem"
  >
    <div v-if="modalError" class="p-3 rounded-lg bg-red-50 text-red-700 text-xs">
      {{ modalError }}
    </div>

    <div class="space-y-3">
      <AppInput
        v-model="form.name"
        label="Désignation de l'article"
        placeholder="Ex: Ciment CPJ 35 (Sac 50kg)"
        :error="formErrors.name"
        required
      />

      <div class="grid grid-cols-2 gap-3">
        <AppInput
          v-model="form.unit"
          label="Unité de mesure"
          placeholder="Ex: Sac, Barre, Litre, Camion"
          :error="formErrors.unit"
          required
        />

        <AppInput
          v-model.number="form.tolerancePercent"
          type="number"
          label="Tolérance admise (%)"
          min="0"
          max="100"
          :error="formErrors.tolerancePercent"
          help="Écart toléré avant alerte"
        />
      </div>

      <AppInput
        v-model.number="form.referencePrice"
        type="number"
        label="Prix de référence initial (FCFA)"
        placeholder="Ex: 5000"
        :error="formErrors.referencePrice"
        min="1"
        required
      />

      <AppInput
        v-model="form.notes"
        label="Remarques éventuelles"
        placeholder="Fournisseur recommandé, spécifications qualité..."
      />
    </div>
  </AppModal>
</template>
