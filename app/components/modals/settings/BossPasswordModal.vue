<script setup lang="ts">
interface Props {
  modelValue: boolean
  content: string
}

const props = defineProps<Props>()
const requestToast = useRequestToast()

const emit = defineEmits<{
  'update:modelValue': [value: boolean]
  confirmed: [message: string]
}>()

const isOpen = computed({
  get: () => props.modelValue,
  set: (val: boolean) => emit('update:modelValue', val)
})

const patronPasswordConfirm = ref('')
const passwordConfirmError = ref('')
const createVersionLoading = ref(false)

watch(() => props.modelValue, (val) => {
  if (val) {
    patronPasswordConfirm.value = ''
    passwordConfirmError.value = ''
  }
})

const submitCreateVersion = async () => {
  passwordConfirmError.value = ''
  if (!patronPasswordConfirm.value) {
    passwordConfirmError.value = 'Veuillez saisir votre mot de passe pour confirmer'
    return
  }

  createVersionLoading.value = true
  try {
    const response = await useApi().post<{ success: boolean; message?: string; template: any }>('/api/template', {
        content: props.content,
        password: patronPasswordConfirm.value
    })
    const res = response.data

    isOpen.value = false
    patronPasswordConfirm.value = ''
    emit('confirmed', res.message || 'Nouvelle version du modèle créée et activée avec succès')
  } catch (err: any) {
    requestToast.error(err.data?.statusMessage || err.message || 'Mot de passe incorrect')
  } finally {
    createVersionLoading.value = false
  }
}
</script>

<template>
  <AppModal
    v-model="isOpen"
    title="Confirmation patron requise"
    description="La création d’une nouvelle version de modèle de lettre est une action sensible qui s’appliquera aux engagements futurs."
    icon="i-lucide-lock"
    confirm-label="Valider & Créer la Version"
    :confirm-loading="createVersionLoading"
    @confirm="submitCreateVersion"
    @cancel="isOpen = false"
  >
    <div class="space-y-4 py-2">
      <p class="text-xs text-slate-600 dark:text-slate-300">
        Pour certifier cette nouvelle version juridique, veuillez confirmer votre identité en saisissant le <strong>mot de passe du patron</strong> :
      </p>

      <div>
        <AppInput
          v-model="patronPasswordConfirm"
          type="password"
          label="Mot de passe du patron"
          placeholder="Entrez votre mot de passe..."
          :error="passwordConfirmError"
          required
          @keyup.enter="submitCreateVersion"
        />
      </div>

      <div class="p-2.5 rounded-lg bg-amber-50 dark:bg-amber-950/30 border border-amber-200 dark:border-amber-800/50 text-[11px] text-amber-800 dark:text-amber-300 flex items-center gap-2">
        <UIcon name="i-lucide-info" class="w-4 h-4 shrink-0 text-amber-600" />
        <span>La nouvelle version créée sera immédiatement activée comme modèle par défaut.</span>
      </div>
    </div>
  </AppModal>
</template>
