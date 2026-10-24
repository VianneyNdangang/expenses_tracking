<script setup lang="ts">
import { formatFCFA } from '~~/shared/currency'

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
  if (!props.item) return
  archiveLoading.value = true
  archiveError.value = ''
  const willArchive = !props.item.isArchived

  try {
    await useApi().patch(`/api/items/${props.item.id}/archive`, { isArchived: willArchive })
    isOpen.value = false
    requestToast.success(willArchive ? 'Article archivé.' : 'Article restauré.')
    emit('archived')
  } catch (err: any) {
    requestToast.error(err.data?.statusMessage || err.message || 'Erreur lors de l’opération')
  } finally {
    archiveLoading.value = false
  }
}
</script>

<template>
  <AppModal
    v-model="isOpen"
    :title="item?.isArchived ? 'Restaurer l\'article' : 'Archiver l\'article'"
    :description="item?.isArchived
      ? 'L\'article sera réactivé et redeviendra disponible pour les nouvelles demandes d\'achat.'
      : 'L\'article sera archivé et ne sera plus proposé lors des nouvelles demandes d\'achat.'"
    :icon="item?.isArchived ? 'i-lucide-rotate-ccw' : 'i-lucide-archive'"
    :confirm-label="item?.isArchived ? 'Restaurer l\'article' : 'Archiver l\'article'"
    :confirm-color="item?.isArchived ? 'primary' : 'error'"
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
          <span class="text-slate-500">Désignation de l'article :</span>
          <span class="font-bold text-slate-900 dark:text-white whitespace-nowrap">
            {{ item?.name }}
          </span>
        </div>
        <div class="flex justify-between items-center">
          <span class="text-slate-500">Unité :</span>
          <span class="font-medium text-slate-800 dark:text-slate-200">
            {{ item?.unit }}
          </span>
        </div>
        <div class="flex justify-between items-center">
          <span class="text-slate-500">Prix de référence actuel :</span>
          <span class="font-bold text-emerald-600 dark:text-emerald-400">
            {{ formatFCFA(item?.referencePrice || 0) }}
          </span>
        </div>
      </div>

      <p class="text-slate-600 dark:text-slate-400 leading-relaxed">
        <template v-if="item?.isArchived">
          Êtes-vous sûr de vouloir réactiver l'article <strong class="text-slate-900 dark:text-white whitespace-nowrap">« {{ item?.name }} »</strong> ?
        </template>
        <template v-else>
          Êtes-vous sûr de vouloir archiver l'article <strong class="text-slate-900 dark:text-white whitespace-nowrap">« {{ item?.name }} »</strong> ?
          Les engagements passés utilisant cet article conserveront leur historique intact.
        </template>
      </p>
    </div>
  </AppModal>
</template>
