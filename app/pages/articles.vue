<script setup lang="ts">
import { formatFCFA } from '~~/shared/currency'
import type { DataTableColumn } from '../components/AppDataTable.vue'
import ArticleFormModal from '~/components/modals/articles/ArticleFormModal.vue'
import ArticlePriceModal from '~/components/modals/articles/ArticlePriceModal.vue'
import ArticleHistoryModal from '~/components/modals/articles/ArticleHistoryModal.vue'
import ArticleArchiveModal from '~/components/modals/articles/ArticleArchiveModal.vue'

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
const openNewItemModal = () => {
  isNewItemModalOpen.value = true
}

// Modale Nouveau Prix
const isNewPriceModalOpen = ref(false)
const selectedItemForPrice = ref<any>(null)
const openNewPriceModal = (item: any) => {
  selectedItemForPrice.value = item
  isNewPriceModalOpen.value = true
}

// Modale Historique Prix
const isPriceHistoryModalOpen = ref(false)
const selectedItemForHistory = ref<any>(null)
const viewPriceHistory = (item: any) => {
  selectedItemForHistory.value = item
  isPriceHistoryModalOpen.value = true
}

// Modale Confirmation Archivage / Restauration
const isArchiveModalOpen = ref(false)
const selectedItemForArchive = ref<any>(null)
const openArchiveModal = (item: any) => {
  selectedItemForArchive.value = item
  isArchiveModalOpen.value = true
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

    <!-- Modale Création Nouvel Article -->
    <ArticleFormModal
      v-model="isNewItemModalOpen"
      @saved="refresh"
    />

    <!-- Modale Nouveau Prix -->
    <ArticlePriceModal
      v-model="isNewPriceModalOpen"
      :item="selectedItemForPrice"
      @saved="refresh"
    />

    <!-- Modale Historique des Prix -->
    <ArticleHistoryModal
      v-model="isPriceHistoryModalOpen"
      :item="selectedItemForHistory"
    />

    <!-- Modale Confirmation Archivage / Restauration -->
    <ArticleArchiveModal
      v-model="isArchiveModalOpen"
      :item="selectedItemForArchive"
      @archived="refresh"
    />
  </div>
</template>
