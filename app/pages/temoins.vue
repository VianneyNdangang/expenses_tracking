<script setup lang="ts">
import type { DataTableColumn } from '../components/AppDataTable.vue'
import WitnessFormModal from '~/components/modals/witnesses/WitnessFormModal.vue'
import WitnessArchiveModal from '~/components/modals/witnesses/WitnessArchiveModal.vue'

useHead({
  title: 'Gestion des Témoins'
})

const includeArchived = ref(false)

const { data: witnesses, pending, refresh } = await useFetch('/api/witnesses', {
  query: { includeArchived }
})

const columns: DataTableColumn[] = [
  { key: 'fullName', label: 'Témoin', sortable: true, class: 'whitespace-nowrap' },
  { key: 'cniMasked', label: 'CNI (Chiffrée AES-256)' },
  { key: 'phoneMasked', label: 'Téléphone' },
  { key: 'status', label: 'Statut', align: 'center' },
  { key: 'actions', label: 'Actions', align: 'right' }
]

// Modale Ajout / Modification
const isFormModalOpen = ref(false)
const selectedWitnessId = ref<string | null>(null)

const openAddModal = () => {
  selectedWitnessId.value = null
  isFormModalOpen.value = true
}

const openEditModal = (witness: any) => {
  selectedWitnessId.value = witness.id
  isFormModalOpen.value = true
}

// Modale de confirmation d'archivage / restauration
const isArchiveModalOpen = ref(false)
const selectedWitnessForArchive = ref<any>(null)

const openArchiveModal = (witness: any) => {
  selectedWitnessForArchive.value = witness
  isArchiveModalOpen.value = true
}
</script>

<template>
  <div class="space-y-6">
    <!-- En-tête -->
    <div class="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
      <div>
        <h1 class="text-2xl font-bold tracking-tight text-slate-900 dark:text-white">
          Gestion des Témoins
        </h1>
        <p class="text-xs sm:text-sm text-slate-500 mt-0.5">
          Témoins pouvant contresigner les lettres d'engagement aux côtés du patron et de l'employé
        </p>
      </div>

      <AppButton
        variant="primary"
        size="xs"
        icon="i-lucide-user-plus"
        label="Nouveau témoin"
        @click="openAddModal"
      />
    </div>

    <!-- Tableau dynamique AppDataTable -->
    <AppDataTable
      :columns="columns"
      :data="witnesses || []"
      :loading="pending"
      search-placeholder="Rechercher par nom, CNI ou téléphone..."
      empty-title="Aucun témoin enregistré"
      empty-description="Enregistrez des témoins pour contresigner les lettres d'engagement A4."
    >
      <!-- Filtre archivés -->
      <template #filters>
        <label class="flex items-center gap-2 text-xs text-slate-600 dark:text-slate-400 cursor-pointer select-none">
          <input
            v-model="includeArchived"
            type="checkbox"
            class="rounded border-slate-300 text-emerald-600 focus:ring-emerald-500 cursor-pointer"
            @change="refresh"
          />
          <span>Afficher les témoins archivés</span>
        </label>
      </template>

      <!-- Colonne Témoin -->
      <template #fullName="{ row }">
        <div class="font-bold text-slate-900 dark:text-white whitespace-nowrap" :class="{ 'opacity-60': row.isArchived }">
          {{ row.civility }} {{ row.fullName }}
        </div>
      </template>

      <!-- Colonne CNI -->
      <template #cniMasked="{ row }">
        <span class="font-mono text-xs text-slate-600 dark:text-slate-300">
          {{ row.cniMasked }}
        </span>
      </template>

      <!-- Colonne Téléphone -->
      <template #phoneMasked="{ row }">
        <span class="text-slate-600 dark:text-slate-300">
          {{ row.phoneMasked || '-' }}
        </span>
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
            label="Modifier"
            icon="i-lucide-pencil"
            @click="openEditModal(row)"
          />

          <AppButton
            :variant="row.isArchived ? 'outline' : 'danger-outline'"
            size="xs"
            :icon="row.isArchived ? 'i-lucide-rotate-ccw' : 'i-lucide-archive'"
            :title="row.isArchived ? 'Restaurer le témoin' : 'Archiver le témoin'"
            @click="openArchiveModal(row)"
          />
        </div>
      </template>
    </AppDataTable>

    <!-- Modale Ajout / Modification Témoin -->
    <WitnessFormModal
      v-model="isFormModalOpen"
      :witness-id="selectedWitnessId"
      @saved="refresh"
    />

    <!-- Modale Confirmation d'Archivage / Restauration Témoin -->
    <WitnessArchiveModal
      v-model="isArchiveModalOpen"
      :witness="selectedWitnessForArchive"
      @archived="refresh"
    />
  </div>
</template>
