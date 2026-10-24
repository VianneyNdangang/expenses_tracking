<script setup lang="ts">
import { formatFCFA } from '~~/shared/currency'

interface Props {
  modelValue: boolean
  item: any | null
}

const props = withDefaults(defineProps<Props>(), {
  item: null
})

const emit = defineEmits<{
  'update:modelValue': [value: boolean]
}>()

const isOpen = computed({
  get: () => props.modelValue,
  set: (val: boolean) => emit('update:modelValue', val)
})

const priceHistory = ref<any[]>([])
const loading = ref(false)

watch(() => props.modelValue, async (val) => {
  if (val && props.item) {
    loading.value = true
    priceHistory.value = []
    try {
      const res = await $fetch<any[]>(`/api/items/${props.item.id}/prices`)
      priceHistory.value = res || []
    } catch (err: any) {
      console.error('Erreur historique prix', err)
    } finally {
      loading.value = false
    }
  }
})
</script>

<template>
  <AppModal
    v-model="isOpen"
    :title="`Historique des prix — ${item?.name || ''}`"
    icon="i-lucide-history"
    hide-confirm
    cancel-label="Fermer"
  >
    <div v-if="loading" class="py-6 text-center text-slate-500 text-xs">
      Chargement de l'historique...
    </div>

    <div v-else-if="priceHistory.length > 0" class="overflow-x-auto">
      <table class="w-full text-left text-xs">
        <thead class="border-b border-slate-200 dark:border-slate-800 text-slate-500 font-semibold uppercase">
          <tr>
            <th class="py-2 px-3">Date Début</th>
            <th class="py-2 px-3">Date Fin</th>
            <th class="py-2 px-3 text-right">Prix (FCFA)</th>
            <th class="py-2 px-3 text-center">Tolérance</th>
            <th class="py-2 px-3">Motif</th>
          </tr>
        </thead>
        <tbody class="divide-y divide-slate-100 dark:divide-slate-800">
          <tr v-for="p in priceHistory" :key="p.id">
            <td class="py-2.5 px-3 text-slate-700 dark:text-slate-300">
              {{ new Date(p.startDate).toLocaleDateString('fr-FR') }}
            </td>
            <td class="py-2.5 px-3">
              <AppBadge
                v-if="!p.endDate"
                label="Tarif Actif"
                color="success"
                size="xs"
              />
              <span v-else class="text-slate-500">
                {{ new Date(p.endDate).toLocaleDateString('fr-FR') }}
              </span>
            </td>
            <td class="py-2.5 px-3 text-right font-bold text-slate-900 dark:text-white">
              {{ formatFCFA(p.referencePrice) }}
            </td>
            <td class="py-2.5 px-3 text-center">
              ±{{ p.tolerancePercent }}%
            </td>
            <td class="py-2.5 px-3 text-slate-500 truncate max-w-xs">
              {{ p.notes || '-' }}
            </td>
          </tr>
        </tbody>
      </table>
    </div>

    <div v-else class="py-6 text-center text-slate-500 text-xs">
      Aucun historique de prix trouvé.
    </div>
  </AppModal>
</template>
