<script setup lang="ts">
import { formatFCFA } from '~~/shared/currency'
import type { DataTableColumn } from '~/components/AppDataTable.vue'
import type { ApiGetResponse } from '~/composables/useApi'

useHead({
  title: 'Liste des Engagements'
})

const route = useRoute()
const router = useRouter()
const { downloadingId, downloadCommitmentPdf } = usePdfDownload()
const { download: downloadApiFile } = useApiFile()
const requestToast = useRequestToast()

// Filtres réactifs
const filters = reactive({
  search: '',
  type: (route.query.type as string) || 'all',
  status: (route.query.status as string) || 'all',
  workerId: (route.query.workerId as string) || '',
  startDate: '',
  endDate: ''
})

// Synchronise filters.status si l'URL change (ex: navigation depuis le Dashboard)
watch(
  () => route.query.status,
  (newStatus) => {
    if (newStatus !== undefined) {
      filters.status = (newStatus as string) || 'all'
    }
  }
)

const { data: workers } = await useApiData<ApiGetResponse<'/api/workers'>>('/api/workers', { key: 'engagement-workers' })
const typeOptions = [
  { label: 'Toutes natures', value: 'all' },
  { label: 'Matériel', value: 'MATERIEL' },
  { label: 'Prêt d’argent', value: 'PRET' },
  { label: 'Salaire', value: 'SALAIRE' },
  { label: 'Autre dépense', value: 'AUTRE' }
]
const statusOptions = [
  { label: 'Tous les statuts', value: 'all' },
  { label: 'Demandé', value: 'Demandé' },
  { label: 'Accepté', value: 'Accepté' },
  { label: 'Payé', value: 'Payé' },
  { label: 'Justifié', value: 'Justifié' },
  { label: 'Refusé', value: 'Refusé' },
  { label: 'Annulé', value: 'Annulé' }
]
const workerOptions = computed(() => [
  { label: 'Tous les employés', value: '' },
  ...(workers.value || []).map(worker => ({
    label: `${worker.civility} ${worker.fullName}`,
    value: worker.id
  }))
])

const { data: commitments, pending } = await useApiData<ApiGetResponse<'/api/commitments'>>('/api/commitments', {
  key: 'commitments',
  params: () => ({ ...filters }),
  watch: [() => ({ ...filters })]
})

const columns: DataTableColumn[] = [
  { key: 'letterNumber', label: 'N° Lettre', sortable: true },
  { key: 'type', label: 'Nature', align: 'center', sortable: true },
  { key: 'date', label: 'Date', sortable: true },
  { key: 'workerName', label: 'Employé', sortable: true, class: 'whitespace-nowrap' },
  { key: 'purpose', label: 'Motif' },
  { key: 'priceAlerts', label: 'Contrôle Prix', align: 'center' },
  { key: 'amount', label: 'Montant', align: 'right', sortable: true },
  { key: 'status', label: 'Statut', align: 'center', sortable: true },
  { key: 'actions', label: 'Action', align: 'right' }
]

const resetFilters = () => {
  filters.search = ''
  filters.type = 'all'
  filters.status = 'all'
  filters.workerId = ''
  filters.startDate = ''
  filters.endDate = ''
  if (route.query.status) {
    router.replace({ query: {} })
  }
}

// Lien d'export dynamique tenant compte des filtres actifs
const exportUrl = (format: 'excel' | 'csv') => {
  const params = new URLSearchParams()
  params.set('format', format)
  if (filters.search) params.set('search', filters.search)
  if (filters.type && filters.type !== 'all') params.set('type', filters.type)
  if (filters.status && filters.status !== 'all') params.set('status', filters.status)
  if (filters.workerId) params.set('workerId', filters.workerId)
  if (filters.startDate) params.set('startDate', filters.startDate)
  if (filters.endDate) params.set('endDate', filters.endDate)
  return `/api/exports/commitments?${params.toString()}`
}

const downloadExport = async (format: 'excel' | 'csv') => {
  try {
    await downloadApiFile(
      exportUrl(format),
      `engagements.${format === 'excel' ? 'xlsx' : 'csv'}`
    )
  } catch (error: unknown) {
    const message = error && typeof error === 'object' && 'data' in error
      && error.data && typeof error.data === 'object' && 'statusMessage' in error.data
      && typeof error.data.statusMessage === 'string'
      ? error.data.statusMessage
      : error instanceof Error ? error.message : 'Impossible de télécharger l’export.'
    requestToast.error(message)
  }
}
</script>

<template>
  <div class="space-y-6">
    <!-- En-tête -->
    <div class="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
      <div>
        <h1 class="text-2xl font-bold tracking-tight text-slate-900 dark:text-white">
          Engagements & Dépenses
        </h1>
        <p class="text-xs sm:text-sm text-slate-500 mt-0.5">
          Historique, contrôle des prix et suivi des justifications
        </p>
      </div>

      <div class="flex items-center gap-2">
        <AppButton
          variant="outline"
          size="xs"
          icon="i-lucide-file-spreadsheet"
          label="Excel"
          @click="downloadExport('excel')"
        />

        <AppButton
          variant="outline"
          size="xs"
          icon="i-lucide-download"
          label="CSV"
          @click="downloadExport('csv')"
        />

        <AppButton
          to="/engagements/nouveau"
          variant="primary"
          size="xs"
          icon="i-lucide-plus"
          label="Nouvel engagement"
        />
      </div>
    </div>

    <!-- Filtres rapides -->
    <AppCard
      title="Filtres de recherche avancés"
      icon="i-lucide-filter"
      collapsible
    >
      <div class="space-y-3">
        <div class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-3">
          <!-- Recherche motif / lettre -->
          <div class="sm:col-span-2 lg:col-span-2">
            <AppInput
              v-model="filters.search"
              type="search"
              label="Recherche (Motif, N° Lettre, Employé)"
              placeholder="Ex: ciment, fer, Kamga, ENG-..."
              clearable
            />
          </div>

          <!-- Filtre Nature / Type -->
          <AppSelect
            v-model="filters.type"
            label="Nature"
            :items="typeOptions"
          />

          <!-- Filtre Statut -->
          <AppSelect
            v-model="filters.status"
            label="Statut"
            :items="statusOptions"
          />

          <!-- Filtre Employé -->
          <AppSelect
            v-model="filters.workerId"
            label="Employé"
            :items="workerOptions"
          />
        </div>

        <!-- Période de dates et bouton réinitialiser -->
        <div class="grid grid-cols-1 sm:grid-cols-3 gap-3 pt-2 border-t border-slate-100 dark:border-slate-800">
          <AppDatePicker
            v-model="filters.startDate"
            label="Date de début"
            placeholder="Du..."
          />

          <AppDatePicker
            v-model="filters.endDate"
            label="Date de fin"
            placeholder="Au..."
          />

          <div class="flex items-end">
            <AppButton
              variant="outline"
              size="sm"
              block
              icon="i-lucide-rotate-ccw"
              label="Réinitialiser filtres"
              @click="resetFilters"
            />
          </div>
        </div>
      </div>
    </AppCard>

    <!-- Tableau dynamique Réutilisable AppDataTable -->
    <AppDataTable
      :columns="columns"
      :data="commitments || []"
      :loading="pending"
      :searchable="false"
      empty-title="Aucun engagement trouvé"
      empty-description="Modifiez vos critères de recherche ou enregistrez un nouvel engagement."
    >
      <!-- Colonne N° Lettre -->
      <template #letterNumber="{ row }">
        <NuxtLink
          :to="`/engagements/${row.id}`"
          class="font-bold text-slate-900 dark:text-white hover:text-emerald-600 dark:hover:text-emerald-400 whitespace-nowrap cursor-pointer"
        >
          {{ row.letterNumber }}
        </NuxtLink>
      </template>

      <!-- Colonne Nature / Type -->
      <template #type="{ row }">
        <span
          class="inline-flex items-center px-2 py-0.5 rounded text-[11px] font-semibold whitespace-nowrap"
          :class="[
            row.type === 'PRET'
              ? 'bg-amber-50 text-amber-700 dark:bg-amber-950/40 dark:text-amber-300 border border-amber-200 dark:border-amber-800'
              : row.type === 'SALAIRE'
                ? 'bg-purple-50 text-purple-700 dark:bg-purple-950/40 dark:text-purple-300 border border-purple-200 dark:border-purple-800'
                : row.type === 'AUTRE'
                  ? 'bg-blue-50 text-blue-700 dark:bg-blue-950/40 dark:text-blue-300 border border-blue-200 dark:border-blue-800'
                  : 'bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-300 border border-slate-200 dark:border-slate-700'
          ]"
        >
          {{ row.type === 'PRET' ? 'Prêt' : row.type === 'SALAIRE' ? 'Salaire' : row.type === 'AUTRE' ? 'Autre' : 'Matériel' }}
        </span>
      </template>

      <!-- Colonne Date -->
      <template #date="{ row }">
        <span class="text-slate-500 whitespace-nowrap">
          {{ new Date(row.date).toLocaleDateString('fr-FR') }}
        </span>
      </template>

      <!-- Colonne Employé -->
      <template #workerName="{ row }">
        <span class="font-medium text-slate-900 dark:text-white whitespace-nowrap">
          {{ row.workerName }}
        </span>
      </template>

      <!-- Colonne Motif -->
      <template #purpose="{ row }">
        <span class="text-slate-600 dark:text-slate-300 max-w-xs truncate block" :title="row.purpose">
          {{ row.purpose }}
        </span>
      </template>

      <!-- Colonne Alertes Prix -->
      <template #priceAlerts="{ row }">
        <AppBadge
          v-if="row.hasSuspectItems"
          status="Suspect"
          variant="subtle"
          size="xs"
        />
        <AppBadge
          v-else-if="row.hasToCheckItems"
          status="À vérifier"
          variant="subtle"
          size="xs"
        />
        <AppBadge
          v-else
          status="Conforme"
          variant="subtle"
          size="xs"
        />
      </template>

      <!-- Colonne Montant -->
      <template #amount="{ row }">
        <span class="font-bold text-slate-900 dark:text-white whitespace-nowrap">
          {{ formatFCFA(row.amountApproved > 0 ? row.amountApproved : row.amountRequested) }}
        </span>
      </template>

      <!-- Colonne Statut -->
      <template #status="{ row }">
        <AppBadge :status="row.status" size="xs" />
      </template>

      <!-- Colonne Actions -->
      <template #actions="{ row }">
        <div class="flex items-center justify-end gap-1">
          <AppButton
            v-if="['Accepté', 'Payé', 'Justifié'].includes(row.status)"
            variant="ghost"
            size="xs"
            icon="i-lucide-file-down"
            title="Télécharger la lettre en PDF"
            class="text-emerald-600 dark:text-emerald-400"
            :loading="downloadingId === row.id"
            @click="downloadCommitmentPdf(row.id, row.letterNumber)"
          />
          <AppButton
            :to="`/engagements/${row.id}`"
            variant="ghost"
            size="xs"
            trailing-icon="i-lucide-arrow-right"
            label="Détail"
          />
        </div>
      </template>
    </AppDataTable>
  </div>
</template>
