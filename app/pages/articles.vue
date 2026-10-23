<script setup lang="ts">
import { formatFCFA } from '~~/shared/currency'
import { CreateItemSchema, NewPriceSchema, validateForm } from '~~/shared/schemas'
import type { DataTableColumn } from '../components/AppDataTable.vue'

useHead({
  title: 'Articles & Prix de Référence'
})

const includeArchived = ref(false)

const { data: items, pending, refresh } = await useFetch('/api/items', {
  query: { includeArchived }
})

const columns: DataTableColumn[] = [
  { key: 'name', label: 'Article', sortable: true, class: 'whitespace-nowrap' },
  { key: 'unit', label: 'Unité', align: 'center', sortable: true },
  { key: 'referencePrice', label: 'Prix de Référence', align: 'right', sortable: true },
  { key: 'tolerancePercent', label: 'Tolérance', align: 'center' },
  { key: 'status', label: 'Statut', align: 'center' },
  { key: 'actions', label: 'Actions', align: 'right' }
]

// Modale Nouvel Article
const isNewItemModalOpen = ref(false)
const newItemForm = reactive({
  name: '',
  unit: 'Unité',
  referencePrice: 0,
  tolerancePercent: 10,
  notes: ''
})
const newItemErrors = ref<Record<string, string>>({})

// Modale Nouveau Prix
const isNewPriceModalOpen = ref(false)
const selectedItemForPrice = ref<any>(null)
const newPriceForm = reactive({
  referencePrice: 0,
  tolerancePercent: 10,
  notes: ''
})
const newPriceErrors = ref<Record<string, string>>({})

// Modale Historique Prix
const isPriceHistoryModalOpen = ref(false)
const priceHistory = ref<any[]>([])
const selectedItemForHistory = ref<any>(null)

const modalLoading = ref(false)
const modalError = ref('')

const openNewItemModal = () => {
  newItemForm.name = ''
  newItemForm.unit = 'Unité'
  newItemForm.referencePrice = 0
  newItemForm.tolerancePercent = 10
  newItemForm.notes = ''
  newItemErrors.value = {}
  modalError.value = ''
  isNewItemModalOpen.value = true
}

const submitNewItem = async () => {
  newItemErrors.value = {}
  modalError.value = ''

  const validation = validateForm(CreateItemSchema, {
    name: newItemForm.name,
    unit: newItemForm.unit,
    referencePrice: Number(newItemForm.referencePrice),
    tolerancePercent: Number(newItemForm.tolerancePercent),
    notes: newItemForm.notes
  })

  if (!validation.success) {
    newItemErrors.value = validation.errors
    modalError.value = validation.firstError
    return
  }

  modalLoading.value = true
  try {
    await $fetch('/api/items', {
      method: 'POST',
      body: validation.data
    })
    isNewItemModalOpen.value = false
    await refresh()
  } catch (err: any) {
    modalError.value = err.data?.statusMessage || err.message || 'Erreur lors de l’ajout'
  } finally {
    modalLoading.value = false
  }
}

const openNewPriceModal = (item: any) => {
  selectedItemForPrice.value = item
  newPriceForm.referencePrice = item.referencePrice || 0
  newPriceForm.tolerancePercent = item.tolerancePercent || 10
  newPriceForm.notes = ''
  newPriceErrors.value = {}
  modalError.value = ''
  isNewPriceModalOpen.value = true
}

const submitNewPrice = async () => {
  if (!selectedItemForPrice.value) return
  newPriceErrors.value = {}
  modalError.value = ''

  const validation = validateForm(NewPriceSchema, {
    referencePrice: Number(newPriceForm.referencePrice),
    tolerancePercent: Number(newPriceForm.tolerancePercent),
    notes: newPriceForm.notes
  })

  if (!validation.success) {
    newPriceErrors.value = validation.errors
    modalError.value = validation.firstError
    return
  }

  modalLoading.value = true
  try {
    await $fetch(`/api/items/${selectedItemForPrice.value.id}/price`, {
      method: 'POST',
      body: validation.data
    })
    isNewPriceModalOpen.value = false
    await refresh()
  } catch (err: any) {
    modalError.value = err.data?.statusMessage || err.message || 'Erreur lors de la mise à jour'
  } finally {
    modalLoading.value = false
  }
}

const viewPriceHistory = async (item: any) => {
  selectedItemForHistory.value = item
  isPriceHistoryModalOpen.value = true
  priceHistory.value = []
  try {
    const res = await $fetch<any[]>(`/api/items/${item.id}/prices`)
    priceHistory.value = res || []
  } catch (err: any) {
    console.error('Erreur historique prix', err)
  }
}

// Modale de confirmation d'archivage / restauration
const isArchiveModalOpen = ref(false)
const selectedItemForArchive = ref<any>(null)
const archiveLoading = ref(false)
const archiveError = ref('')

const openArchiveModal = (item: any) => {
  selectedItemForArchive.value = item
  archiveError.value = ''
  isArchiveModalOpen.value = true
}

const confirmArchive = async () => {
  if (!selectedItemForArchive.value) return
  archiveLoading.value = true
  archiveError.value = ''
  const willArchive = !selectedItemForArchive.value.isArchived

  try {
    await $fetch(`/api/items/${selectedItemForArchive.value.id}/archive`, {
      method: 'PATCH',
      body: { isArchived: willArchive }
    })
    isArchiveModalOpen.value = false
    selectedItemForArchive.value = null
    await refresh()
  } catch (err: any) {
    archiveError.value = err.data?.statusMessage || err.message || 'Erreur lors de l’opération'
  } finally {
    archiveLoading.value = false
  }
}
</script>

<template>
  <div class="space-y-6">
    <!-- En-tête -->
    <div class="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
      <div>
        <h1 class="text-2xl font-bold tracking-tight text-slate-900 dark:text-white">
          Articles & Tarifs de Référence
        </h1>
        <p class="text-xs sm:text-sm text-slate-500 mt-0.5">
          Barème servant de comparaison automatique aux demandes de dépenses
        </p>
      </div>

      <AppButton
        variant="primary"
        size="xs"
        icon="i-lucide-plus"
        label="Nouvel article"
        @click="openNewItemModal"
      />
    </div>

    <!-- Tableau dynamique AppDataTable -->
    <AppDataTable
      :columns="columns"
      :data="items || []"
      :loading="pending"
      search-placeholder="Rechercher un article ou une unité..."
      empty-title="Aucun article trouvé"
      empty-description="Créez vos articles et matériaux de référence pour activer le contrôle des prix."
    >
      <!-- Slot de filtre pour inclure les archivés -->
      <template #filters>
        <label class="flex items-center gap-2 text-xs text-slate-600 dark:text-slate-400 cursor-pointer select-none">
          <input
            v-model="includeArchived"
            type="checkbox"
            class="rounded border-slate-300 text-emerald-600 focus:ring-emerald-500 cursor-pointer"
            @change="refresh"
          />
          <span>Afficher les articles archivés</span>
        </label>
      </template>

      <!-- Colonne Désignation Article -->
      <template #name="{ row }">
        <div :class="{ 'opacity-60': row.isArchived }" class="whitespace-nowrap">
          <span class="font-bold text-slate-900 dark:text-white block whitespace-nowrap">
            {{ row.name }}
          </span>
          <span v-if="row.notes" class="text-[11px] text-slate-500 block truncate max-w-xs">
            {{ row.notes }}
          </span>
        </div>
      </template>

      <!-- Colonne Unité -->
      <template #unit="{ row }">
        <span class="font-medium text-slate-700 dark:text-slate-300">
          {{ row.unit }}
        </span>
      </template>

      <!-- Colonne Prix Référence -->
      <template #referencePrice="{ row }">
        <span class="font-extrabold text-slate-900 dark:text-white whitespace-nowrap">
          {{ formatFCFA(row.referencePrice) }}
        </span>
      </template>

      <!-- Colonne Tolérance -->
      <template #tolerancePercent="{ row }">
        <AppBadge
          :label="`±${row.tolerancePercent}%`"
          color="neutral"
          variant="subtle"
          size="xs"
        />
      </template>

      <!-- Colonne Statut -->
      <template #status="{ row }">
        <AppBadge
          :status="row.isArchived ? 'Archivé' : 'Actif'"
          size="xs"
        />
      </template>

      <!-- Colonne Actions -->
      <template #actions="{ row }">
        <div class="flex items-center justify-end gap-1.5">
          <AppButton
            variant="ghost"
            size="xs"
            label="Tarif"
            icon="i-lucide-pencil"
            @click="openNewPriceModal(row)"
          />

          <AppButton
            variant="ghost"
            size="xs"
            label="Historique"
            icon="i-lucide-history"
            @click="viewPriceHistory(row)"
          />

          <AppButton
            :variant="row.isArchived ? 'outline' : 'danger-outline'"
            size="xs"
            :icon="row.isArchived ? 'i-lucide-rotate-ccw' : 'i-lucide-archive'"
            :title="row.isArchived ? 'Restaurer l’article' : 'Archiver l’article'"
            @click="openArchiveModal(row)"
          />
        </div>
      </template>
    </AppDataTable>

    <!-- Modale Création Nouvel Article (AppModal) -->
    <AppModal
      v-model="isNewItemModalOpen"
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
          v-model="newItemForm.name"
          label="Désignation de l'article"
          placeholder="Ex: Ciment CPJ 35 (Sac 50kg)"
          :error="newItemErrors.name"
          required
        />

        <div class="grid grid-cols-2 gap-3">
          <AppInput
            v-model="newItemForm.unit"
            label="Unité de mesure"
            placeholder="Ex: Sac, Barre, Litre, Camion"
            :error="newItemErrors.unit"
            required
          />

          <AppInput
            v-model.number="newItemForm.tolerancePercent"
            type="number"
            label="Tolérance admise (%)"
            min="0"
            max="100"
            :error="newItemErrors.tolerancePercent"
            help="Écart toléré avant alerte"
          />
        </div>

        <AppInput
          v-model.number="newItemForm.referencePrice"
          type="number"
          label="Prix de référence initial (FCFA)"
          placeholder="Ex: 5000"
          :error="newItemErrors.referencePrice"
          min="1"
          required
        />

        <AppInput
          v-model="newItemForm.notes"
          label="Remarques éventuelles"
          placeholder="Fournisseur recommandé, spécifications qualité..."
        />
      </div>
    </AppModal>

    <!-- Modale Nouveau Prix (AppModal) -->
    <AppModal
      v-model="isNewPriceModalOpen"
      title="Mettre à jour le tarif de référence"
      :description="`Article : ${selectedItemForPrice?.name} (actuel : ${formatFCFA(selectedItemForPrice?.referencePrice)})`"
      icon="i-lucide-trending-up"
      confirm-label="Valider le nouveau tarif"
      :confirm-loading="modalLoading"
      @confirm="submitNewPrice"
    >
      <div v-if="modalError" class="p-3 rounded-lg bg-red-50 text-red-700 text-xs">
        {{ modalError }}
      </div>

      <div class="space-y-3">
        <p class="text-xs text-slate-500">
          L'ancien tarif sera archivé dans l'historique et le nouveau tarif prendra effet immédiatement pour tous les futurs engagements.
        </p>

        <AppInput
          v-model.number="newPriceForm.referencePrice"
          type="number"
          label="Nouveau prix de référence (FCFA)"
          :error="newPriceErrors.referencePrice"
          min="1"
          required
        />

        <AppInput
          v-model.number="newPriceForm.tolerancePercent"
          type="number"
          label="Tolérance admise (%)"
          :error="newPriceErrors.tolerancePercent"
          min="0"
          max="100"
        />

        <AppInput
          v-model="newPriceForm.notes"
          label="Motif du changement de prix"
          placeholder="Ex: Hausse des prix usine, nouveau transporteur..."
        />
      </div>
    </AppModal>

    <!-- Modale Historique des Prix (AppModal) -->
    <AppModal
      v-model="isPriceHistoryModalOpen"
      :title="`Historique des prix — ${selectedItemForHistory?.name}`"
      icon="i-lucide-history"
      hide-confirm
      cancel-label="Fermer"
    >
      <div v-if="priceHistory.length > 0" class="overflow-x-auto">
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
        Chargement de l'historique...
      </div>
    </AppModal>

    <!-- Modale de Confirmation d'Archivage / Restauration (AppModal) -->
    <AppModal
      v-model="isArchiveModalOpen"
      :title="selectedItemForArchive?.isArchived ? 'Restaurer l\'article' : 'Archiver l\'article'"
      :description="selectedItemForArchive?.isArchived
        ? 'L\'article sera réactivé et redeviendra disponible pour les nouvelles demandes d\'achat.'
        : 'L\'article sera archivé et ne sera plus proposé lors des nouvelles demandes d\'achat.'"
      :icon="selectedItemForArchive?.isArchived ? 'i-lucide-rotate-ccw' : 'i-lucide-archive'"
      :confirm-label="selectedItemForArchive?.isArchived ? 'Restaurer l\'article' : 'Archiver l\'article'"
      :confirm-color="selectedItemForArchive?.isArchived ? 'primary' : 'error'"
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
              {{ selectedItemForArchive?.name }}
            </span>
          </div>
          <div class="flex justify-between items-center">
            <span class="text-slate-500">Unité :</span>
            <span class="font-medium text-slate-800 dark:text-slate-200">
              {{ selectedItemForArchive?.unit }}
            </span>
          </div>
          <div class="flex justify-between items-center">
            <span class="text-slate-500">Prix de référence actuel :</span>
            <span class="font-bold text-emerald-600 dark:text-emerald-400">
              {{ formatFCFA(selectedItemForArchive?.referencePrice || 0) }}
            </span>
          </div>
        </div>

        <p class="text-slate-600 dark:text-slate-400 leading-relaxed">
          <template v-if="selectedItemForArchive?.isArchived">
            Êtes-vous sûr de vouloir réactiver l'article <strong class="text-slate-900 dark:text-white whitespace-nowrap">« {{ selectedItemForArchive?.name }} »</strong> ?
          </template>
          <template v-else>
            Êtes-vous sûr de vouloir archiver l'article <strong class="text-slate-900 dark:text-white whitespace-nowrap">« {{ selectedItemForArchive?.name }} »</strong> ?
            Les engagements passés utilisant cet article conserveront leur historique intact.
          </template>
        </p>
      </div>
    </AppModal>
  </div>
</template>
