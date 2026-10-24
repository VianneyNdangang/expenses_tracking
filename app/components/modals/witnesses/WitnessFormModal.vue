<script setup lang="ts">
import { PersonSchema, validateForm } from '~~/shared/schemas'

interface Props {
  modelValue: boolean
  witnessId?: string | null
}

const props = withDefaults(defineProps<Props>(), {
  witnessId: null
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

const isEditing = computed(() => Boolean(props.witnessId))

const form = reactive({
  civility: 'M.' as 'M.' | 'Mme' | 'Mlle',
  fullName: '',
  cni: '',
  phone: ''
})

const formErrors = ref<Record<string, string>>({})
const modalLoading = ref(false)
const modalError = ref('')

const resetForm = () => {
  form.civility = 'M.'
  form.fullName = ''
  form.cni = ''
  form.phone = ''
  formErrors.value = {}
  modalError.value = ''
}

watch(() => props.modelValue, async (val) => {
  if (val) {
    resetForm()
    if (props.witnessId) {
      modalLoading.value = true
      try {
        const response = await useApi().get<any>(`/api/witnesses/${props.witnessId}`)
        const details = response.data
        form.civility = details.civility || 'M.'
        form.fullName = details.fullName || ''
        form.cni = details.cni || ''
        form.phone = details.phone || ''
      } catch (err: any) {
        requestToast.error(err.data?.statusMessage || err.message || 'Erreur lors du chargement des détails')
      } finally {
        modalLoading.value = false
      }
    }
  }
})

const submitForm = async () => {
  formErrors.value = {}
  modalError.value = ''

  const validation = validateForm(PersonSchema, {
    civility: form.civility,
    fullName: form.fullName,
    cni: form.cni,
    phone: form.phone
  })

  if (!validation.success) {
    formErrors.value = validation.errors
    modalError.value = validation.firstError
    return
  }

  modalLoading.value = true
  try {
    if (isEditing.value && props.witnessId) {
      await useApi().put(`/api/witnesses/${props.witnessId}`, validation.data)
    } else {
      await useApi().post('/api/witnesses', validation.data)
    }
    isOpen.value = false
    requestToast.success(isEditing.value ? 'Témoin mis à jour.' : 'Témoin enregistré.')
    emit('saved')
  } catch (err: any) {
    requestToast.error(err.data?.statusMessage || err.message || 'Erreur lors de l’enregistrement')
  } finally {
    modalLoading.value = false
  }
}
</script>

<template>
  <AppModal
    v-model="isOpen"
    :title="isEditing ? 'Modifier le témoin' : 'Enregistrer un nouveau témoin'"
    description="Les informations de CNI et téléphone sont chiffrées avec AES-256-GCM"
    :icon="isEditing ? 'i-lucide-user-pen' : 'i-lucide-user-plus'"
    :confirm-label="isEditing ? 'Mettre à jour' : 'Enregistrer'"
    :confirm-loading="modalLoading"
    @confirm="submitForm"
  >
    <div v-if="modalError" class="p-3 rounded-lg bg-red-50 text-red-700 text-xs">
      {{ modalError }}
    </div>

    <div class="space-y-3">
      <!-- Civilité -->
      <div>
        <label class="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
          Civilité <span class="text-red-500">*</span>
        </label>
        <div class="flex gap-4">
          <label class="flex items-center gap-1.5 text-xs text-slate-700 dark:text-slate-300 cursor-pointer">
            <input v-model="form.civility" type="radio" value="M." class="text-emerald-600 focus:ring-emerald-500" />
            <span>Monsieur (M.)</span>
          </label>
          <label class="flex items-center gap-1.5 text-xs text-slate-700 dark:text-slate-300 cursor-pointer">
            <input v-model="form.civility" type="radio" value="Mme" class="text-emerald-600 focus:ring-emerald-500" />
            <span>Madame (Mme)</span>
          </label>
          <label class="flex items-center gap-1.5 text-xs text-slate-700 dark:text-slate-300 cursor-pointer">
            <input v-model="form.civility" type="radio" value="Mlle" class="text-emerald-600 focus:ring-emerald-500" />
            <span>Mademoiselle (Mlle)</span>
          </label>
        </div>
      </div>

      <AppInput
        v-model="form.fullName"
        label="Nom complet et prénom"
        placeholder="Ex: Tchuente Paulin"
        :error="formErrors.fullName"
        required
      />

      <AppInput
        v-model="form.cni"
        label="Numéro de CNI"
        placeholder="Ex: 3049581726"
        :error="formErrors.cni"
        required
        help="Numéro chiffré avant enregistrement en base"
      />

      <AppInput
        v-model="form.phone"
        type="tel"
        label="Numéro de téléphone"
        placeholder="Ex: +237 670 11 22 33"
        :error="formErrors.phone"
        required
      />
    </div>
  </AppModal>
</template>
