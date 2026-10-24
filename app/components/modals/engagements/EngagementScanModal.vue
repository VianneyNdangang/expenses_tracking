<script setup lang="ts">
interface Props {
  modelValue: boolean
  commitmentId: string
}

const props = defineProps<Props>()
const requestToast = useRequestToast()

const getErrorMessage = (error: unknown) => {
  if (error && typeof error === 'object' && 'data' in error) {
    const data = error.data
    if (data && typeof data === 'object' && 'statusMessage' in data && typeof data.statusMessage === 'string') {
      return data.statusMessage
    }
  }
  if (error instanceof Error && error.message) return error.message
  return 'Erreur lors de la lecture ou de l’enregistrement du fichier.'
}

const emit = defineEmits<{
  'update:modelValue': [value: boolean]
  'uploaded': []
}>()

const isOpen = computed({
  get: () => props.modelValue,
  set: (val: boolean) => emit('update:modelValue', val)
})

const scanFile = ref<File | null>(null)
const actionLoading = ref(false)

watch(() => props.modelValue, (val) => {
  if (val) {
    scanFile.value = null
  }
})

const onFileSelected = (event: Event) => {
  const target = event.target
  if (!(target instanceof HTMLInputElement)) return
  const file = target.files?.[0]
  scanFile.value = file || null
}

const submitScan = async () => {
  const file = scanFile.value
  if (!file) return
  if (file.size > 20 * 1024 * 1024) {
    requestToast.error('Le fichier doit peser moins de 20 Mo.')
    return
  }

  actionLoading.value = true

  try {
    const base64 = await new Promise<string>((resolve, reject) => {
      const reader = new FileReader()
      reader.onload = () => {
        if (typeof reader.result === 'string') resolve(reader.result)
        else reject(new Error('Impossible de lire le fichier sélectionné.'))
      }
      reader.onerror = () => reject(reader.error || new Error('Impossible de lire le fichier sélectionné.'))
      reader.readAsDataURL(file)
    })

    await useApi().post(`/api/commitments/${props.commitmentId}/upload-scan`, {
      filename: file.name,
      base64
    })
    isOpen.value = false
    scanFile.value = null
    requestToast.success('Scan signé ajouté à l’engagement.')
    emit('uploaded')
  } catch (error: unknown) {
    requestToast.error(getErrorMessage(error))
  } finally {
    actionLoading.value = false
  }
}
</script>

<template>
  <AppModal
    v-model="isOpen"
    title="Joindre le scan de la lettre signée"
    description="Sélectionnez le PDF, JPG, PNG ou WEBP de la lettre signée par l'employé, le patron et les témoins (20 Mo maximum)."
    icon="i-lucide-upload"
    confirm-label="Enregistrer le scan"
    :confirm-disabled="!scanFile"
    :confirm-loading="actionLoading"
    @confirm="submitScan"
  >
    <div>
      <input
        type="file"
        accept="application/pdf,image/jpeg,image/png,image/webp"
        class="w-full text-xs"
        @change="onFileSelected"
      >
    </div>
  </AppModal>
</template>
