<script setup lang="ts">
import type { DataTableColumn } from '../components/AppDataTable.vue'
import { PersonSchema, validateForm } from '~~/shared/schemas'

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

const isModalOpen = ref(false)
const isEditing = ref(false)
const currentWitnessId = ref<string | null>(null)

const form = reactive({
  civility: 'M.' as 'M.' | 'Mme' | 'Mlle',
  fullName: '',
  cni: '',
  phone: ''
})

const formErrors = ref<Record<string, string>>({})
const modalLoading = ref(false)
const modalError = ref('')

const openAddModal = () => {
  isEditing.value = false
  currentWitnessId.value = null
  form.civility = 'M.'
  form.fullName = ''
  form.cni = ''
  form.phone = ''
  formErrors.value = {}
  modalError.value = ''
  isModalOpen.value = true
}

const openEditModal = async (witness: any) => {
  isEditing.value = true
  currentWitnessId.value = witness.id
  formErrors.value = {}
  modalLoading.value = true
  modalError.value = ''
  isModalOpen.value = true

  try {
    const details = await $fetch<any>(`/api/witnesses/${witness.id}`)
    form.civility = details.civility
    form.fullName = details.fullName
    form.cni = details.cni
    form.phone = details.phone
  } catch (err: any) {
    modalError.value = err.data?.statusMessage || err.message || 'Erreur lors du chargement'
  } finally {
    modalLoading.value = false
  }
}

const submitForm = async () => {
  formErrors.value = {}
  modalError.value = ''

  const validation = validateForm(PersonSchema, {
    civility: form.civility,
    fullName: form.fullName,
    cni: form.cni,
    phone: form.phone
  })

  if (!validation.success) {
    formErrors.value = validation.errors
    modalError.value = validation.firstError
    return
  }

  modalLoading.value = true
  try {
    if (isEditing.value && currentWitnessId.value) {
      await $fetch(`/api/witnesses/${currentWitnessId.value}`, {
        method: 'PUT',
        body: validation.data
      })
    } else {
      await $fetch('/api/witnesses', {
        method: 'POST',
        body: validation.data
      })
    }
    isModalOpen.value = false
    await refresh()
  } catch (err: any) {
    modalError.value = err.data?.statusMessage || err.message || 'Erreur lors de l’enregistrement'
  } finally {
    modalLoading.value = false
  }
}

// Modale de confirmation d'archivage / restauration
const isArchiveModalOpen = ref(false)
const selectedWitnessForArchive = ref<any>(null)
const archiveLoading = ref(false)
const archiveError = ref('')

const openArchiveModal = (witness: any) => {
  selectedWitnessForArchive.value = witness
  archiveError.value = ''
  isArchiveModalOpen.value = true
}

const confirmArchive = async () => {
  if (!selectedWitnessForArchive.value) return
  archiveLoading.value = true
  archiveError.value = ''
  try {
    await $fetch(`/api/witnesses/${selectedWitnessForArchive.value.id}/archive`, { method: 'PATCH' })
    isArchiveModalOpen.value = false
    selectedWitnessForArchive.value = null
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

    <!-- Modale Ajout / Modification Témoin (AppModal) -->
    <AppModal
      v-model="isModalOpen"
      :title="isEditing ? 'Modifier le témoin' : 'Enregistrer un nouveau témoin'"
      description="Les informations de CNI et téléphone sont chiffrées avec AES-256-GCM"
      :icon="isEditing ? 'i-lucide-user-pen' : 'i-lucide-user-plus'"
      :confirm-label="isEditing ? 'Mettre à jour' : 'Enregistrer'"
      :confirm-loading="modalLoading"
      @confirm="submitForm"
    >
      <div v-if="modalError" class="p-3 rounded-lg bg-red-50 text-red-700 text-xs">
        {{ modalError }}
      </div>

      <div class="space-y-3">
        <!-- Civilité -->
        <div>
          <label class="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
            Civilité <span class="text-red-500">*</span>
          </label>
          <div class="flex gap-4">
            <label class="flex items-center gap-1.5 text-xs text-slate-700 dark:text-slate-300 cursor-pointer">
              <input v-model="form.civility" type="radio" value="M." class="text-emerald-600 focus:ring-emerald-500" />
              <span>Monsieur (M.)</span>
            </label>
            <label class="flex items-center gap-1.5 text-xs text-slate-700 dark:text-slate-300 cursor-pointer">
              <input v-model="form.civility" type="radio" value="Mme" class="text-emerald-600 focus:ring-emerald-500" />
              <span>Madame (Mme)</span>
            </label>
            <label class="flex items-center gap-1.5 text-xs text-slate-700 dark:text-slate-300 cursor-pointer">
              <input v-model="form.civility" type="radio" value="Mlle" class="text-emerald-600 focus:ring-emerald-500" />
              <span>Mademoiselle (Mlle)</span>
            </label>
          </div>
        </div>

        <AppInput
          v-model="form.fullName"
          label="Nom complet et prénom"
          placeholder="Ex: Tchuente Paulin"
          :error="formErrors.fullName"
          required
        />

        <AppInput
          v-model="form.cni"
          label="Numéro de CNI"
          placeholder="Ex: 3049581726"
          :error="formErrors.cni"
          required
          help="Numéro chiffré avant enregistrement en base"
        />

        <AppInput
          v-model="form.phone"
          type="tel"
          label="Numéro de téléphone"
          placeholder="Ex: +237 670 11 22 33"
          :error="formErrors.phone"
          required
        />
      </div>
    </AppModal>

    <!-- Modale de Confirmation d'Archivage / Restauration Témoin (AppModal) -->
    <AppModal
      v-model="isArchiveModalOpen"
      :title="selectedWitnessForArchive?.isArchived ? 'Restaurer le témoin' : 'Archiver le témoin'"
      :description="selectedWitnessForArchive?.isArchived
        ? 'Le témoin redeviendra actif et pourra à nouveau contresigner les futures lettres.'
        : 'Le témoin sera archivé et ne figurera plus parmi les témoins actifs.'"
      :icon="selectedWitnessForArchive?.isArchived ? 'i-lucide-rotate-ccw' : 'i-lucide-archive'"
      :confirm-label="selectedWitnessForArchive?.isArchived ? 'Restaurer le témoin' : 'Archiver le témoin'"
      :confirm-color="selectedWitnessForArchive?.isArchived ? 'primary' : 'error'"
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
              {{ selectedWitnessForArchive?.civility }} {{ selectedWitnessForArchive?.fullName }}
            </span>
          </div>
          <div class="flex justify-between items-center">
            <span class="text-slate-500">CNI :</span>
            <span class="font-mono text-slate-700 dark:text-slate-300">
              {{ selectedWitnessForArchive?.cniMasked }}
            </span>
          </div>
        </div>

        <p class="text-slate-600 dark:text-slate-400 leading-relaxed">
          <template v-if="selectedWitnessForArchive?.isArchived">
            Êtes-vous sûr de vouloir réactiver le témoin <strong class="text-slate-900 dark:text-white whitespace-nowrap">« {{ selectedWitnessForArchive?.civility }} {{ selectedWitnessForArchive?.fullName }} »</strong> ?
          </template>
          <template v-else>
            Êtes-vous sûr de vouloir archiver le témoin <strong class="text-slate-900 dark:text-white whitespace-nowrap">« {{ selectedWitnessForArchive?.civility }} {{ selectedWitnessForArchive?.fullName }} »</strong> ?
            L'intégrité des lettres signées par le passé restera scrupuleusement conservée.
          </template>
        </p>
      </div>
    </AppModal>
  </div>
</template>
