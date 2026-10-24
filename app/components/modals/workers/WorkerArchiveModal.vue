<script setup lang="ts">
interface Props {
  modelValue: boolean
  worker: any | null
}

const props = withDefaults(defineProps<Props>(), {
  worker: null
})

const emit = defineEmits<{
  'update:modelValue': [value: boolean]
  archived: []
}>()

const isOpen = computed({
  get: () => props.modelValue,
  set: (val: boolean) => emit('update:modelValue', val)
})

const archiveLoading = ref(false)
const archiveError = ref('')

watch(() => props.modelValue, (val) => {
  if (val) {
    archiveError.value = ''
  }
})

const confirmArchive = async () => {
  if (!props.worker) return
  archiveLoading.value = true
  archiveError.value = ''
  try {
    await $fetch(`/api/workers/${props.worker.id}/archive`, { method: 'PATCH' })
    isOpen.value = false
    emit('archived')
  } catch (err: any) {
    archiveError.value = err.data?.statusMessage || err.message || 'Erreur lors de l’opération'
  } finally {
    archiveLoading.value = false
  }
}
</script>

<template>
  <AppModal
    v-model="isOpen"
    :title="worker?.isArchived ? 'Restaurer l\'employé' : 'Archiver l\'employé'"
    :description="worker?.isArchived
      ? 'L\'employé redeviendra actif et pourra à nouveau être sélectionné sur les engagements.'
      : 'L\'employé sera archivé et ne figurera plus dans la liste des employés actifs.'"
    :icon="worker?.isArchived ? 'i-lucide-rotate-ccw' : 'i-lucide-archive'"
    :confirm-label="worker?.isArchived ? 'Restaurer l\'employé' : 'Archiver l\'employé'"
    :confirm-color="worker?.isArchived ? 'primary' : 'error'"
    :confirm-loading="archiveLoading"
    cancel-label="Annuler"
    @confirm="confirmArchive"
  >
    <div v-if="archiveError" class="p-3 rounded-lg bg-red-50 text-red-700 text-xs">
      {{ archiveError }}
    </div>

    <div class="space-y-3 text-xs">
      <div class="p-3 rounded-lg bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700 space-y-1.5">
        <div class="flex justify-between items-center">
          <span class="text-slate-500">Employé :</span>
          <span class="font-bold text-slate-900 dark:text-white whitespace-nowrap">
            {{ worker?.civility }} {{ worker?.fullName }}
          </span>
        </div>
        <div class="flex justify-between items-center">
          <span class="text-slate-500">CNI :</span>
          <span class="font-mono text-slate-700 dark:text-slate-300">
            {{ worker?.cniMasked }}
          </span>
        </div>
      </div>

      <p class="text-slate-600 dark:text-slate-400 leading-relaxed">
        <template v-if="worker?.isArchived">
          Êtes-vous sûr de vouloir réactiver l'employé <strong class="text-slate-900 dark:text-white whitespace-nowrap">« {{ worker?.civility }} {{ worker?.fullName }} »</strong> ?
        </template>
        <template v-else>
          Êtes-vous sûr de vouloir archiver l'employé <strong class="text-slate-900 dark:text-white whitespace-nowrap">« {{ worker?.civility }} {{ worker?.fullName }} »</strong> ?
          Ses engagements passés seront rigoureusement conservés.
        </template>
      </p>
    </div>
  </AppModal>
</template>
