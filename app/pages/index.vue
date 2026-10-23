<script setup lang="ts">
import type { DataTableColumn } from '../components/AppDataTable.vue'

useHead({
  title: 'Tableau de bord'
})

const { data: dashboard, pending, refresh } = await useFetch('/api/dashboard')

const currentDateFormatted = new Date().toLocaleDateString('fr-FR', {
  weekday: 'long',
  year: 'numeric',
  month: 'long',
  day: 'numeric'
})

const recentColumns: DataTableColumn[] = [
  { key: 'letterNumber', label: 'Lettre N°', sortable: true },
  { key: 'date', label: 'Date', sortable: true },
  { key: 'workerName', label: 'Employé', sortable: true, class: 'whitespace-nowrap' },
  { key: 'purpose', label: 'Motif' },
  { key: 'formattedAmount', label: 'Montant', align: 'right', sortable: true },
  { key: 'status', label: 'Statut', align: 'center', sortable: true },
  { key: 'actions', label: 'Action', align: 'right' }
]
</script>

<template>
  <div class="space-y-6">
    <!-- En-tête de page -->
    <div class="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
      <div>
        <h1 class="text-2xl font-bold tracking-tight text-slate-900 dark:text-white">
          Tableau de bord
        </h1>
        <p class="text-xs sm:text-sm text-slate-500 capitalize mt-0.5">
          {{ currentDateFormatted }}
        </p>
      </div>

      <div class="flex items-center gap-2.5">
        <AppButton
          variant="outline"
          size="xs"
          icon="i-lucide-refresh-cw"
          :loading="pending"
          label="Actualiser"
          @click="() => refresh()"
        />

        <AppButton
          href="/api/exports/commitments?format=excel"
          target="_blank"
          variant="outline"
          size="xs"
          icon="i-lucide-download"
          label="Export Excel"
        />

        <AppButton
          to="/engagements/nouveau"
          variant="primary"
          size="xs"
          icon="i-lucide-plus"
          label="Nouvelle demande"
        />
      </div>
    </div>

    <!-- Alertes de retards de justification -->
    <AppCard
      v-if="dashboard?.alerts && dashboard.alerts.length > 0"
      variant="warning"
      icon="i-lucide-alert-triangle"
      :title="`${dashboard.alerts.length} dépense(s) en retard de justification (> ${dashboard.settings.justificationDelayDays} jours)`"
    >
      <div class="space-y-2">
        <div
          v-for="alert in dashboard.alerts"
          :key="alert.commitmentId"
          class="flex flex-col sm:flex-row sm:items-center justify-between text-xs py-1.5 px-2.5 rounded bg-white/80 dark:bg-slate-900/60 border border-amber-200 dark:border-amber-900/60 gap-1.5"
        >
          <div>
            <span class="font-bold text-slate-900 dark:text-white">{{ alert.letterNumber }}</span> —
            <span class="text-slate-700 dark:text-slate-300">{{ alert.workerName }}</span> :
            <span class="font-semibold text-slate-900 dark:text-white">{{ alert.formattedAmountPaid }}</span>
            <span class="text-amber-700 dark:text-amber-400 font-medium ml-1.5">({{ alert.daysLate }} jour(s) de retard)</span>
          </div>
          <NuxtLink
            :to="`/engagements/${alert.commitmentId}`"
            class="font-medium text-emerald-700 dark:text-emerald-400 hover:underline shrink-0"
          >
            Voir l'engagement →
          </NuxtLink>
        </div>
      </div>
    </AppCard>

    <!-- Cartes KPI financières principales (AppStatCard) -->
    <div class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
      <!-- 1. Total Engagé -->
      <AppStatCard
        title="TOTAL ENGAGÉ ACCORDÉ"
        :value="dashboard?.kpis?.formattedTotalCommitted || '0 FCFA'"
        subtitle="Validé par la direction"
        icon="i-lucide-check-circle-2"
        color="info"
      />

      <!-- 2. Total Décaissé / Payé -->
      <AppStatCard
        title="TOTAL DÉCAISSÉ (PAYÉ)"
        :value="dashboard?.kpis?.formattedTotalPaid || '0 FCFA'"
        subtitle="Fonds effectivement remis"
        icon="i-lucide-banknote"
        color="primary"
      />

      <!-- 3. Reliquats à Justifier (En cours) -->
      <AppStatCard
        title="FONDS À JUSTIFIER"
        :value="dashboard?.kpis?.formattedTotalPendingJustification || '0 FCFA'"
        subtitle="Reçus et factures en attente"
        icon="i-lucide-clock"
        color="warning"
      />

      <!-- 4. Reliquats Restitués en Caisse -->
      <AppStatCard
        title="RELIQUATS RÉCUPÉRÉS"
        :value="dashboard?.kpis?.formattedTotalBalanceRestitue || '0 FCFA'"
        subtitle="Non dépensé et restitué au patron"
        icon="i-lucide-arrow-down-left"
        color="success"
      />
    </div>

    <!-- Répartition par statut -->
    <AppCard title="Statut global des dossiers">
      <div class="grid grid-cols-2 sm:grid-cols-5 gap-3">
        <NuxtLink
          to="/engagements?status=Demandé"
          class="p-3 rounded-lg bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700 hover:border-amber-400 transition-colors"
        >
          <div class="text-xs text-slate-500 font-medium">Demandés</div>
          <div class="text-lg font-bold text-amber-600 mt-1">
            {{ dashboard?.statusCounts?.Demandé || 0 }}
          </div>
        </NuxtLink>

        <NuxtLink
          to="/engagements?status=Accepté"
          class="p-3 rounded-lg bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700 hover:border-blue-400 transition-colors"
        >
          <div class="text-xs text-slate-500 font-medium">Acceptés (À payer)</div>
          <div class="text-lg font-bold text-blue-600 mt-1">
            {{ dashboard?.statusCounts?.Accepté || 0 }}
          </div>
        </NuxtLink>

        <NuxtLink
          to="/engagements?status=Payé"
          class="p-3 rounded-lg bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700 hover:border-purple-400 transition-colors"
        >
          <div class="text-xs text-slate-500 font-medium">Payés (En cours)</div>
          <div class="text-lg font-bold text-purple-600 mt-1">
            {{ dashboard?.statusCounts?.Payé || 0 }}
          </div>
        </NuxtLink>

        <NuxtLink
          to="/engagements?status=Justifié"
          class="p-3 rounded-lg bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700 hover:border-emerald-400 transition-colors"
        >
          <div class="text-xs text-slate-500 font-medium">Justifiés (Clôturés)</div>
          <div class="text-lg font-bold text-emerald-600 mt-1">
            {{ dashboard?.statusCounts?.Justifié || 0 }}
          </div>
        </NuxtLink>

        <NuxtLink
          to="/engagements?status=Refusé"
          class="p-3 rounded-lg bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700 hover:border-rose-400 transition-colors"
        >
          <div class="text-xs text-slate-500 font-medium">Refusés</div>
          <div class="text-lg font-bold text-rose-600 mt-1">
            {{ dashboard?.statusCounts?.Refusé || 0 }}
          </div>
        </NuxtLink>
      </div>
    </AppCard>

    <!-- Derniers engagements avec AppDataTable -->
    <div class="space-y-3">
      <div class="flex items-center justify-between">
        <h2 class="text-base font-semibold text-slate-900 dark:text-white">
          Derniers engagements enregistrés
        </h2>
        <NuxtLink
          to="/engagements"
          class="text-xs font-semibold text-emerald-600 hover:text-emerald-700 dark:text-emerald-400 flex items-center gap-1"
        >
          <span>Tous les engagements</span>
          <UIcon name="i-lucide-arrow-right" class="w-3.5 h-3.5" />
        </NuxtLink>
      </div>

      <AppDataTable
        :columns="recentColumns"
        :data="dashboard?.recentCommitments || []"
        :loading="pending"
        :searchable="false"
        :pagination="false"
        empty-title="Aucun engagement enregistré"
        empty-description="Les nouveaux engagements apparaîtront ici dès leur création."
      >
        <template #letterNumber="{ row }">
          <NuxtLink
            :to="`/engagements/${row.id}`"
            class="font-bold text-slate-900 dark:text-white hover:text-emerald-600 whitespace-nowrap"
          >
            {{ row.letterNumber }}
          </NuxtLink>
        </template>

        <template #date="{ row }">
          <span class="text-slate-500 whitespace-nowrap">
            {{ new Date(row.date).toLocaleDateString('fr-FR') }}
          </span>
        </template>

        <template #workerName="{ row }">
          <span class="font-medium text-slate-900 dark:text-white whitespace-nowrap">
            {{ row.workerName }}
          </span>
        </template>

        <template #purpose="{ row }">
          <span class="text-slate-600 dark:text-slate-300 max-w-xs truncate block">
            {{ row.purpose }}
          </span>
        </template>

        <template #formattedAmount="{ row }">
          <span class="font-bold text-slate-900 dark:text-white whitespace-nowrap">
            {{ row.formattedAmount }}
          </span>
        </template>

        <template #status="{ row }">
          <AppBadge :status="row.status" size="xs" />
        </template>

        <template #actions="{ row }">
          <AppButton
            :to="`/engagements/${row.id}`"
            variant="ghost"
            size="xs"
            label="Consulter"
            trailing-icon="i-lucide-chevron-right"
          />
        </template>
      </AppDataTable>
    </div>
  </div>
</template>
