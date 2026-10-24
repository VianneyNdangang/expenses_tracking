<script setup lang="ts">
interface Props {
  modelValue: boolean
  witness: any | null
}

const props = withDefaults(defineProps<Props>(), {
  witness: null
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
  if (!props.witness) return
  archiveLoading.value = true
  archiveError.value = ''
  try {
    await $fetch(`/api/witnesses/${props.witness.id}/archive`, { method: 'PATCH' })
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
    :title="witness?.isArchived ? 'Restaurer le témoin' : 'Archiver le témoin'"
    :description="witness?.isArchived
      ? 'Le témoin redeviendra actif et pourra à nouveau contresigner les futures lettres.'
      : 'Le témoin sera archivé et ne figurera plus parmi les témoins actifs.'"
    :icon="witness?.isArchived ? 'i-lucide-rotate-ccw' : 'i-lucide-archive'"
    :confirm-label="witness?.isArchived ? 'Restaurer le témoin' : 'Archiver le témoin'"
    :confirm-color="witness?.isArchived ? 'primary' : 'error'"
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
          <span class="text-slate-500">Témoin :</span>
          <span class="font-bold text-slate-900 dark:text-white whitespace-nowrap">
            {{ witness?.civility }} {{ witness?.fullName }}
          </span>
        </div>
        <div class="flex justify-between items-center">
          <span class="text-slate-500">CNI :</span>
          <span class="font-mono text-slate-700 dark:text-slate-300">
            {{ witness?.cniMasked }}
          </span>
        </div>
      </div>

      <p class="text-slate-600 dark:text-slate-400 leading-relaxed">
        <template v-if="witness?.isArchived">
          Êtes-vous sûr de vouloir réactiver le témoin <strong class="text-slate-900 dark:text-white whitespace-nowrap">« {{ witness?.civility }} {{ witness?.fullName }} »</strong> ?
        </template>
        <template v-else>
          Êtes-vous sûr de vouloir archiver le témoin <strong class="text-slate-900 dark:text-white whitespace-nowrap">« {{ witness?.civility }} {{ witness?.fullName }} »</strong> ?
          L'intégrité des lettres signées par le passé restera scrupuleusement conservée.
        </template>
      </p>
    </div>
  </AppModal>
</template>
