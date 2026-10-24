<script setup lang="ts">
import type { DataTableColumn } from '../components/AppDataTable.vue'
import AuditDetailModal from '~/components/modals/audit/AuditDetailModal.vue'

useHead({
  title: 'Journal d’Audit'
})

const page = ref(1)
const entityFilter = ref('')
const actionFilter = ref('')

const { data: auditData, pending, refresh } = await useFetch('/api/audit', {
  query: {
    page,
    entity: entityFilter,
    action: actionFilter
  },
  watch: [page, entityFilter, actionFilter]
})

const columns: DataTableColumn[] = [
  { key: 'createdAt', label: 'Horodatage', sortable: true },
  { key: 'username', label: 'Auteur', class: 'whitespace-nowrap' },
  { key: 'action', label: 'Action' },
  { key: 'entity', label: 'Entité' },
  { key: 'ip', label: 'Adresse IP' },
  { key: 'actions', label: 'Détails', align: 'right' }
]

const isDetailModalOpen = ref(false)
const selectedLog = ref<any>(null)

const showDetails = (log: any) => {
  selectedLog.value = log
  isDetailModalOpen.value = true
}

const getActionColor = (action: string) => {
  if (action.includes('CREATE') || action.includes('SUCCESS') || action.includes('APPROVE') || action.includes('PAY')) {
    return 'success' as const
  }
  if (action.includes('CANCEL') || action.includes('FAILED') || action.includes('REVOKE') || action.includes('REFUSE')) {
    return 'error' as const
  }
  return 'info' as const
}
</script>

<template>
  <div class="space-y-6">
    <!-- En-tête -->
    <div class="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
      <div>
        <h1 class="text-2xl font-bold tracking-tight text-slate-900 dark:text-white">
          Journal d'Audit Non Modifiable
        </h1>
        <p class="text-xs sm:text-sm text-slate-500 mt-0.5">
          Traçabilité intégrale de toutes les actions, connexions, modifications et validations
        </p>
      </div>

      <AppButton
        variant="outline"
        size="xs"
        icon="i-lucide-refresh-cw"
        label="Actualiser"
        @click="() => refresh()"
      />
    </div>

    <!-- Tableau dynamique AppDataTable -->
    <AppDataTable
      :columns="columns"
      :data="auditData?.logs || []"
      :loading="pending"
      search-placeholder="Rechercher une action, utilisateur, IP..."
      empty-title="Aucun événement d'audit"
      empty-description="Les événements apparaîtront automatiquement au fur et à mesure des opérations."
    >
      <!-- Filtres -->
      <template #filters>
        <div class="w-48 shrink-0">
          <select
            v-model="entityFilter"
            class="w-full px-3 py-1.5 text-xs rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-800 dark:text-slate-200"
          >
            <option value="">Toutes les entités</option>
            <option value="Commitment">Engagements</option>
            <option value="Payment">Paiements</option>
            <option value="Justification">Justifications</option>
            <option value="Item">Articles</option>
            <option value="Worker">Employés</option>
            <option value="User">Utilisateurs / Connexions</option>
            <option value="Settings">Paramètres</option>
          </select>
        </div>
      </template>

      <!-- Colonne Horodatage -->
      <template #createdAt="{ row }">
        <span class="font-mono text-slate-600 dark:text-slate-300 whitespace-nowrap">
          {{ new Date(row.createdAt).toLocaleString('fr-FR') }}
        </span>
      </template>

      <!-- Colonne Auteur -->
      <template #username="{ row }">
        <span class="font-bold text-slate-900 dark:text-white whitespace-nowrap">
          {{ row.username }}
        </span>
      </template>

      <!-- Colonne Action -->
      <template #action="{ row }">
        <AppBadge
          :label="row.action"
          :color="getActionColor(row.action)"
          variant="subtle"
          size="xs"
        />
      </template>

      <!-- Colonne Entité -->
      <template #entity="{ row }">
        <span class="font-medium text-slate-700 dark:text-slate-300">
          {{ row.entity }}
        </span>
      </template>

      <!-- Colonne IP -->
      <template #ip="{ row }">
        <span class="font-mono text-slate-500 text-xs">
          {{ row.ip }}
        </span>
      </template>

      <!-- Colonne Actions -->
      <template #actions="{ row }">
        <AppButton
          variant="ghost"
          size="xs"
          label="Inspecter"
          icon="i-lucide-search"
          @click="showDetails(row)"
        />
      </template>
    </AppDataTable>

    <!-- Modale Détail Événement d'audit -->
    <AuditDetailModal
      v-model="isDetailModalOpen"
      :log="selectedLog"
    />
  </div>
</template>
