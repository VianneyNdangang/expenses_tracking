<script setup lang="ts">
import { CreateItemSchema, CreateItemsSchema, validateForm } from '~~/shared/schemas'

function getErrorMessage(err: unknown, fallback: string): string {
  if (typeof err !== 'object' || err === null) {
    return fallback
  }

  if ('data' in err && typeof err.data === 'object' && err.data !== null
    && 'statusMessage' in err.data && typeof err.data.statusMessage === 'string') {
    return err.data.statusMessage
  }
  if ('message' in err && typeof err.message === 'string') {
    return err.message
  }

  return fallback
}

interface Props {
  modelValue: boolean
}

const props = defineProps<Props>()
const requestToast = useRequestToast()

const emit = defineEmits<{
  'update:modelValue': [value: boolean]
  'saved': []
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
const isBulkMode = ref(false)

interface ItemForm {
  name: string
  unit: string
  referencePrice: number | string
  tolerancePercent: number | string
  notes: string
}

const createEmptyItemForm = (): ItemForm => ({
  name: '',
  unit: 'Unité',
  referencePrice: 0,
  tolerancePercent: 10,
  notes: ''
})

const bulkForms = ref<ItemForm[]>([])
const bulkFormErrors = ref<Record<string, string>>({})

const resetForm = () => {
  form.name = ''
  form.unit = 'Unité'
  form.referencePrice = 0
  form.tolerancePercent = 10
  form.notes = ''
  formErrors.value = {}
  modalError.value = ''
  isBulkMode.value = false
  bulkForms.value = [createEmptyItemForm(), createEmptyItemForm()]
  bulkFormErrors.value = {}
}

watch(() => props.modelValue, (val) => {
  if (val) {
    resetForm()
  }
})

const switchToBulkMode = () => {
  isBulkMode.value = true
}

const addBulkForm = () => {
  if (bulkForms.value.length < 100) {
    bulkForms.value.push(createEmptyItemForm())
  }
}

const removeBulkForm = (index: number) => {
  if (bulkForms.value.length > 2) {
    bulkForms.value.splice(index, 1)
  }
}

const submitNewItem = async () => {
  formErrors.value = {}
  bulkFormErrors.value = {}
  modalError.value = ''

  if (isBulkMode.value) {
    const bulkValidation = CreateItemsSchema.safeParse(bulkForms.value.map(item => ({
      name: item.name,
      unit: item.unit,
      referencePrice: Number(item.referencePrice),
      tolerancePercent: Number(item.tolerancePercent),
      notes: item.notes
    })))

    if (!bulkValidation.success) {
      bulkValidation.error.errors.forEach((issue) => {
        const field = issue.path.join('.')
        bulkFormErrors.value[field] = issue.message
      })
      modalError.value = bulkValidation.error.errors[0]?.message || 'Vérifiez les articles saisis'
      return
    }

    modalLoading.value = true
    try {
      await useApi().post('/api/items', bulkValidation.data)
      isOpen.value = false
      requestToast.success(`${bulkValidation.data.length} articles ont été créés.`)
      emit('saved')
    } catch (err: unknown) {
      requestToast.error(getErrorMessage(err, 'Erreur lors de l’ajout des articles'))
    } finally {
      modalLoading.value = false
    }
    return
  }

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
    await useApi().post('/api/items', validation.data)
    isOpen.value = false
    requestToast.success('Article ajouté au catalogue.')
    emit('saved')
  } catch (err: unknown) {
    requestToast.error(getErrorMessage(err, 'Erreur lors de l’ajout'))
  } finally {
    modalLoading.value = false
  }
}
</script>

<template>
  <AppModal
    v-model="isOpen"
    :title="isBulkMode
      ? 'Créer plusieurs articles de référence'
      : 'Créer un nouvel article de référence'"
    :description="isBulkMode
      ? 'Ajoutez plusieurs articles et leurs prix de référence en une seule fois'
      : 'Ce barème servira à évaluer automatiquement les demandes d’achat'"
    icon="i-lucide-package-plus"
    :confirm-label="isBulkMode ? `Enregistrer les ${bulkForms.length} articles` : 'Enregistrer l’article'"
    :confirm-loading="modalLoading"
    @confirm="submitNewItem"
  >
    <div
      v-if="modalError"
      class="p-3 rounded-lg bg-red-50 text-red-700 text-xs"
    >
      {{ modalError }}
    </div>

    <div
      v-if="!isBulkMode"
      class="space-y-3"
    >
      <div class="flex justify-end">
        <AppButton
          variant="outline"
          size="xs"
          icon="i-lucide-copy-plus"
          label="Ajouter plusieurs articles"
          @click="switchToBulkMode"
        />
      </div>

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

    <div
      v-else
      class="space-y-4 max-h-[65vh] overflow-y-auto pr-1"
    >
      <div
        v-for="(item, index) in bulkForms"
        :key="index"
        class="rounded-lg border border-slate-200 dark:border-slate-700 p-3 space-y-3"
      >
        <div class="flex items-center justify-between">
          <h4 class="text-sm font-semibold text-slate-800 dark:text-slate-200">
            Article {{ index + 1 }}
          </h4>
          <AppButton
            v-if="bulkForms.length > 2"
            variant="ghost"
            size="xs"
            icon="i-lucide-trash-2"
            :aria-label="`Supprimer l’article ${index + 1}`"
            @click="removeBulkForm(index)"
          />
        </div>

        <AppInput
          v-model="item.name"
          label="Désignation"
          placeholder="Ex: Ciment CPJ 35 (Sac 50kg)"
          :error="bulkFormErrors[`${index}.name`]"
          required
        />

        <div class="grid grid-cols-2 gap-3">
          <AppInput
            v-model="item.unit"
            label="Unité de mesure"
            placeholder="Ex: Sac, Barre, Litre"
            :error="bulkFormErrors[`${index}.unit`]"
            required
          />
          <AppInput
            v-model.number="item.tolerancePercent"
            type="number"
            label="Tolérance (%)"
            min="0"
            max="100"
            :error="bulkFormErrors[`${index}.tolerancePercent`]"
          />
        </div>

        <AppInput
          v-model.number="item.referencePrice"
          type="number"
          label="Prix de référence initial (FCFA)"
          placeholder="Ex: 5000"
          :error="bulkFormErrors[`${index}.referencePrice`]"
          min="1"
          required
        />

        <AppInput
          v-model="item.notes"
          label="Remarques éventuelles"
          placeholder="Fournisseur recommandé, spécifications qualité..."
        />
      </div>

      <AppButton
        variant="outline"
        size="sm"
        icon="i-lucide-plus"
        label="Ajouter une ligne"
        :disabled="bulkForms.length >= 100"
        @click="addBulkForm"
      />
    </div>
  </AppModal>
</template>
