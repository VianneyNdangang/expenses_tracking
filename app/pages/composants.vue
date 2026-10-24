<script setup lang="ts">
import type { DataTableColumn } from '~/components/AppDataTable.vue'

useHead({ title: 'Bibliothèque de composants' })

const toast = useRequestToast()
const search = ref('')
const amount = ref<number | null>(12500)
const selectedStatus = ref('Payé')
const selectedDate = ref('')
const isModalOpen = ref(false)

const statusOptions = [
  { label: 'Demandé', value: 'Demandé' },
  { label: 'Accepté', value: 'Accepté' },
  { label: 'Payé', value: 'Payé' },
  { label: 'Justifié', value: 'Justifié' }
]

const sampleColumns: DataTableColumn[] = [
  { key: 'reference', label: 'Référence', sortable: true },
  { key: 'status', label: 'Statut' },
  { key: 'amount', label: 'Montant', align: 'right' }
]

const sampleRows = [
  { reference: 'ENG-2026-001', status: 'Payé', amount: '12 500 FCFA' },
  { reference: 'ENG-2026-002', status: 'Justifié', amount: '8 000 FCFA' }
]

const shellComponents = [
  {
    name: 'AppHeader',
    description: 'En-tête fixe : navigation mobile, rôle connecté, thème et création rapide.'
  },
  {
    name: 'AppSidebar',
    description: 'Navigation latérale et tiroir mobile, filtrés selon les permissions du rôle.'
  }
]
</script>

<template>
  <div class="mx-auto max-w-7xl space-y-6">
    <header class="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
      <div>
        <div class="mb-2 flex items-center gap-2 text-xs font-semibold uppercase tracking-wide text-primary">
          <UIcon
            name="i-lucide-panels-top-left"
            class="size-4"
          />
          Espace technicien
        </div>
        <h1 class="text-2xl font-bold tracking-tight text-slate-900 dark:text-white">
          Bibliothèque de composants
        </h1>
        <p class="mt-1 max-w-2xl text-sm text-slate-500 dark:text-slate-400">
          Aperçu interactif des composants partagés de l’application et de leurs principaux usages.
        </p>
      </div>
      <AppBadge
        label="Nuxt UI"
        color="primary"
        icon="i-lucide-box"
      />
    </header>

    <section
      aria-labelledby="form-components-title"
      class="space-y-3"
    >
      <div>
        <h2
          id="form-components-title"
          class="text-lg font-bold text-slate-900 dark:text-white"
        >
          Saisie et actions
        </h2>
        <p class="text-xs text-slate-500">
          Champs cohérents, sélection, dates et boutons avec aide contextuelle.
        </p>
      </div>

      <div class="grid gap-4 lg:grid-cols-2">
        <AppCard
          title="AppInput"
          description="Texte, recherche, mot de passe, nombre et zone de texte."
        >
          <div class="grid gap-3 sm:grid-cols-2">
            <AppInput
              v-model="search"
              label="Recherche"
              placeholder="Rechercher..."
              type="search"
            />
            <AppInput
              v-model="amount"
              label="Montant"
              type="number"
              min="0"
              step="500"
            />
          </div>
        </AppCard>

        <AppCard
          title="AppSelect et AppDatePicker"
          description="Sélection et calendrier au format français."
        >
          <div class="grid gap-3 sm:grid-cols-2">
            <AppSelect
              v-model="selectedStatus"
              label="Statut"
              :items="statusOptions"
            />
            <AppDatePicker
              v-model="selectedDate"
              label="Date"
              placeholder="Choisir une date"
            />
          </div>
        </AppCard>

        <AppCard
          title="AppButton"
          description="Variantes partagées ; title et aria-label sont présentés avec UTooltip."
        >
          <div class="flex flex-wrap items-center gap-2">
            <AppButton
              label="Principal"
              icon="i-lucide-check"
            />
            <AppButton
              label="Contour"
              variant="outline"
              icon="i-lucide-pencil"
            />
            <AppButton
              label="Danger"
              variant="danger-outline"
              icon="i-lucide-trash-2"
            />
            <AppButton
              icon="i-lucide-circle-help"
              aria-label="Aide sur les boutons"
            />
          </div>
        </AppCard>

        <AppCard
          title="AppBadge"
          description="Badges de statut et de catégorie."
        >
          <div class="flex flex-wrap items-center gap-2">
            <AppBadge status="Demandé" />
            <AppBadge status="Accepté" />
            <AppBadge status="Payé" />
            <AppBadge status="Justifié" />
            <AppBadge
              label="Archivé"
              color="neutral"
              dot
            />
          </div>
        </AppCard>
      </div>
    </section>

    <section
      aria-labelledby="layout-components-title"
      class="space-y-3"
    >
      <div>
        <h2
          id="layout-components-title"
          class="text-lg font-bold text-slate-900 dark:text-white"
        >
          Présentation et données
        </h2>
        <p class="text-xs text-slate-500">
          Cartes, indicateurs, tableaux, fenêtres de dialogue et identité visuelle.
        </p>
      </div>

      <div class="grid gap-4 lg:grid-cols-2">
        <AppCard
          title="AppCard"
          description="Conteneur avec en-tête, icône, badge, actions et contenu personnalisables."
          variant="subtle"
          collapsible
        >
          <p class="text-sm text-slate-600 dark:text-slate-300">
            Cette carte peut être repliée et accepte des slots pour son en-tête et son pied.
          </p>
        </AppCard>

        <AppCard
          title="AppStatCard"
          description="Indicateur synthétique réutilisé sur le tableau de bord."
        >
          <AppStatCard
            title="Dépenses enregistrées"
            value="20 500 FCFA"
            subtitle="Exemple de montant"
            icon="i-lucide-wallet"
            color="success"
          />
        </AppCard>

        <AppCard
          title="AppDataTable"
          description="Recherche, tri, pagination et cellules personnalisées."
        >
          <AppDataTable
            :columns="sampleColumns"
            :data="sampleRows"
            :page-size="5"
            empty-title="Aucune donnée"
          >
            <template #status-cell="{ row }">
              <AppBadge
                :status="row.status"
                size="xs"
              />
            </template>
          </AppDataTable>
        </AppCard>

        <AppCard
          title="AppModal"
          description="Dialogue d’action avec états de confirmation et d’annulation."
        >
          <AppButton
            label="Ouvrir un exemple"
            icon="i-lucide-panel-top"
            @click="isModalOpen = true"
          />
          <AppModal
            v-model="isModalOpen"
            title="Exemple de dialogue"
            description="La modale réutilise les composants de bouton et le style de l’application."
            icon="i-lucide-info"
            confirm-label="Compris"
            hide-cancel
            @confirm="isModalOpen = false"
          >
            <p class="text-sm text-slate-600 dark:text-slate-300">
              Le contenu de chaque fenêtre est fourni via le slot principal.
            </p>
          </AppModal>
        </AppCard>

        <AppCard
          title="Notifications"
          description="Messages de résultat uniformisés avec useToast de Nuxt UI."
        >
          <div class="flex flex-wrap gap-2">
            <AppButton
              label="Succès"
              variant="outline"
              icon="i-lucide-circle-check"
              @click="toast.success('Exemple de notification de succès.')"
            />
            <AppButton
              label="Erreur"
              variant="danger-outline"
              icon="i-lucide-circle-alert"
              @click="toast.error('Exemple de notification d’erreur.')"
            />
          </div>
        </AppCard>

        <AppCard
          title="AppLogo"
          description="Logo vectoriel utilisé pour l’identité visuelle."
        >
          <div class="max-w-48 text-primary [&_svg]:h-auto [&_svg]:w-full">
            <AppLogo />
          </div>
        </AppCard>
      </div>
    </section>

    <section
      aria-labelledby="shell-components-title"
      class="space-y-3"
    >
      <div>
        <h2
          id="shell-components-title"
          class="text-lg font-bold text-slate-900 dark:text-white"
        >
          Structure de l’application
        </h2>
        <p class="text-xs text-slate-500">
          Composants intégrés au cadre global de navigation.
        </p>
      </div>
      <div class="grid gap-3 sm:grid-cols-2">
        <AppCard
          v-for="component in shellComponents"
          :key="component.name"
          :title="component.name"
          :description="component.description"
          icon="i-lucide-layout-template"
        >
          <p class="text-xs text-slate-500 dark:text-slate-400">
            Composant monté par le layout principal ; aperçu rendu ici sous forme de fiche pour éviter de dupliquer la navigation.
          </p>
        </AppCard>
      </div>
    </section>
  </div>
</template>
