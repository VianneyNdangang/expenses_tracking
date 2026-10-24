<script setup lang="ts">
interface Props {
  modelValue: boolean
  commitmentId: string
}

const props = defineProps<Props>()

const emit = defineEmits<{
  'update:modelValue': [value: boolean]
  uploaded: []
}>()

const isOpen = computed({
  get: () => props.modelValue,
  set: (val: boolean) => emit('update:modelValue', val)
})

const scanFile = ref<File | null>(null)
const actionLoading = ref(false)
const actionError = ref('')

watch(() => props.modelValue, (val) => {
  if (val) {
    scanFile.value = null
    actionError.value = ''
  }
})

const onFileSelected = (e: any) => {
  const file = e.target.files?.[0]
  if (file) {
    scanFile.value = file
  }
}

const submitScan = async () => {
  if (!scanFile.value) return
  actionLoading.value = true
  actionError.value = ''

  try {
    const reader = new FileReader()
    reader.onload = async (e) => {
      const base64 = e.target?.result as string
      try {
        await $fetch(`/api/commitments/${props.commitmentId}/upload-scan`, {
          method: 'POST',
          body: {
            filename: scanFile.value!.name,
            base64
          }
        })
        isOpen.value = false
        scanFile.value = null
        emit('uploaded')
      } catch (uploadErr: any) {
        actionError.value = uploadErr.data?.statusMessage || uploadErr.message || 'Erreur lors du téléversement du scan'
      } finally {
        actionLoading.value = false
      }
    }
    reader.readAsDataURL(scanFile.value)
  } catch (err: any) {
    actionError.value = err.data?.statusMessage || err.message || 'Erreur lors de la lecture du fichier'
    actionLoading.value = false
  }
}
</script>

<template>
  <AppModal
    v-model="isOpen"
    title="Joindre le scan de la lettre signée"
    description="Sélectionnez le document PDF ou l'image contresignée par l'employé, le patron et les témoins."
    icon="i-lucide-upload"
    confirm-label="Enregistrer le scan"
    :confirm-disabled="!scanFile"
    :confirm-loading="actionLoading"
    @confirm="submitScan"
  >
    <div v-if="actionError" class="p-3 rounded-lg bg-red-50 text-red-700 text-xs">
      {{ actionError }}
    </div>

    <div>
      <input
        type="file"
        accept="application/pdf,image/*"
        class="w-full text-xs"
        @change="onFileSelected"
      />
    </div>
  </AppModal>
</template>
