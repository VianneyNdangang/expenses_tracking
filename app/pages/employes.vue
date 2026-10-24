<script setup lang="ts">
import type { DataTableColumn } from '../components/AppDataTable.vue'
import WorkerFormModal from '~/components/modals/workers/WorkerFormModal.vue'
import WorkerArchiveModal from '~/components/modals/workers/WorkerArchiveModal.vue'

useHead({
  title: 'Gestion des Employés'
})

const includeArchived = ref(false)

const { data: workers, pending, refresh } = await useFetch('/api/workers', {
  query: { includeArchived }
})

const columns: DataTableColumn[] = [
  { key: 'fullName', label: 'Employé', sortable: true, class: 'whitespace-nowrap' },
  { key: 'cniMasked', label: 'CNI (Chiffrée AES-256)' },
  { key: 'phoneMasked', label: 'Téléphone' },
  { key: 'status', label: 'Statut', align: 'center' },
  { key: 'actions', label: 'Actions', align: 'right' }
]

// Modale Ajout / Modification
const isFormModalOpen = ref(false)
const selectedWorkerId = ref<string | null>(null)

const openAddModal = () => {
  selectedWorkerId.value = null
  isFormModalOpen.value = true
}

const openEditModal = (worker: any) => {
  selectedWorkerId.value = worker.id
  isFormModalOpen.value = true
}

// Modale de confirmation d'archivage / restauration
const isArchiveModalOpen = ref(false)
const selectedWorkerForArchive = ref<any>(null)

const openArchiveModal = (worker: any) => {
  selectedWorkerForArchive.value = worker
  isArchiveModalOpen.value = true
}
</script>

<template>
  <div class="space-y-6">
    <!-- En-tête -->
    <div class="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
      <div>
        <h1 class="text-2xl font-bold tracking-tight text-slate-900 dark:text-white">
          Gestion des Employés
        </h1>
        <p class="text-xs sm:text-sm text-slate-500 mt-0.5">
          Données d'identité chiffrées en base (AES-256-GCM) pour les engagements et décharges
        </p>
      </div>

      <AppButton
        variant="primary"
        size="xs"
        icon="i-lucide-user-plus"
        label="Nouvel employé"
        @click="openAddModal"
      />
    </div>

    <!-- Tableau dynamique AppDataTable -->
    <AppDataTable
      :columns="columns"
      :data="workers || []"
      :loading="pending"
      search-placeholder="Rechercher par nom, CNI ou téléphone..."
      empty-title="Aucun employé enregistré"
      empty-description="Enregistrez vos employés et ouvriers pour émettre des demandes d'engagement."
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
          <span>Afficher les employés archivés</span>
        </label>
      </template>

      <!-- Colonne Employé -->
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
          {{ row.phoneMasked }}
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
            :title="row.isArchived ? 'Restaurer l’employé' : 'Archiver l’employé'"
            @click="openArchiveModal(row)"
          />
        </div>
      </template>
    </AppDataTable>

    <!-- Modale Ajout / Modification Employé -->
    <WorkerFormModal
      v-model="isFormModalOpen"
      :worker-id="selectedWorkerId"
      @saved="refresh"
    />

    <!-- Modale Confirmation Archivage / Restauration Employé -->
    <WorkerArchiveModal
      v-model="isArchiveModalOpen"
      :worker="selectedWorkerForArchive"
      @archived="refresh"
    />
  </div>
</template>
