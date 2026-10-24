<script setup lang="ts">
import { evaluatePriceDifference, type PriceComparisonResult } from '~~/shared/priceComparison'
import { amountInWordsFCFA, formatFCFA } from '~~/shared/currency'
import { CreateCommitmentSchema, validateForm, type CommitmentType } from '~~/shared/schemas'
import AppButton from '~/components/AppButton.vue'

useHead({
  title: 'Nouvel Engagement'
})

const router = useRouter()

// Données référentielles
const { data: workers } = await useFetch('/api/workers')
const { data: witnesses } = await useFetch('/api/witnesses')
const { data: items } = await useFetch('/api/items')
const { data: settings } = await useFetch('/api/settings')
const { data: templateData } = await useFetch('/api/template')

const selectedTemplateVersion = ref<number | undefined>(undefined)
watch(
  templateData,
  (val) => {
    if (val?.version && selectedTemplateVersion.value === undefined) {
      selectedTemplateVersion.value = val.version
    }
  },
  { immediate: true }
)

// Formulaire
const form = reactive({
  type: 'MATERIEL' as CommitmentType,
  workerId: '',
  purpose: '',
  city: settings.value?.defaultCity || 'Yaoundé',
  date: new Date().toISOString().split('T')[0],
  witnessIds: [] as string[],
  directAmount: 0,
  notes: ''
})

// Types d'engagements disponibles
const commitmentTypes = [
  {
    type: 'MATERIEL' as CommitmentType,
    label: 'Achat de Matériel',
    badge: 'Matériel & Équipement',
    icon: 'i-lucide-package',
    description: 'Achat de fournitures avec grille de prix de référence et factures justificatives.'
  },
  {
    type: 'PRET' as CommitmentType,
    label: 'Prêt d’argent',
    badge: 'Prêt & Avance',
    icon: 'i-lucide-hand-coins',
    description: 'Avance remboursable ou prêt avec reconnaissance de dette et échéancier convenu.'
  },
  {
    type: 'SALAIRE' as CommitmentType,
    label: 'Salaire / Rémunération',
    badge: 'Paiement Salaire',
    icon: 'i-lucide-briefcase',
    description: 'Règlement du salaire ou de prestations avec décharge libératoire.'
  },
  {
    type: 'AUTRE' as CommitmentType,
    label: 'Autre dépense',
    badge: 'Frais & Mission',
    icon: 'i-lucide-file-text',
    description: 'Dépenses diverses, frais de déplacement, carburant ou missions ponctuelles.'
  }
]

// Option d'ajouter des articles même si type !== 'MATERIEL'
const showItemLines = ref(false)

interface LineState {
  id: string
  itemId: string
  name: string
  unit: string
  quantity: number
  unitPriceDeclared: number
  referencePrice: number
  tolerancePercent: number
}

const lines = ref<LineState[]>([
  {
    id: '1',
    itemId: '',
    name: '',
    unit: 'Unité',
    quantity: 1,
    unitPriceDeclared: 0,
    referencePrice: 0,
    tolerancePercent: 10
  }
])

const formErrors = ref<Record<string, string>>({})
const loading = ref(false)
const errorMessage = ref('')

// Motifs fréquents selon le type d'engagement
const frequentPurposesByType = computed(() => {
  switch (form.type) {
    case 'PRET':
      return [
        'Avance remboursable pour urgence médicale familiale',
        'Prêt d’honneur remboursable en deux mensualités',
        'Avance sur salaire pour frais de rentrée scolaire',
        'Prêt personnel exceptionnel accordé par la direction'
      ]
    case 'SALAIRE':
      return [
        'Règlement du salaire mensuel et indemnités',
        'Paiement des heures de prestation maçonnerie / coffrage',
        'Avance sur le salaire du mois en cours',
        'Rémunération forfaitaire de mission et gardiennage'
      ]
    case 'AUTRE':
      return [
        'Frais de transport et déplacement pour livraison',
        'Dépenses courantes d’entretien et réparations mécaniques',
        'Frais administratifs, timbres fiscaux et légalisations',
        'Approvisionnement carburant gasoil pour camions'
      ]
    default:
      return [
        'Achat de ciment et fer pour coulage dalle magasin',
        'Approvisionnement carburant gasoil pour engins de chantier',
        'Achat de peinture et fournitures pour réfection',
        'Agrégats de sable et gravier pour maçonnerie',
        'Matériel électrique, disjoncteurs et câblage groupe'
      ]
  }
})

// Changement de type : adapter les suggestions et réinitialiser les erreurs
const selectType = (t: CommitmentType) => {
  form.type = t
  formErrors.value = {}
  if (t === 'MATERIEL') {
    showItemLines.value = true
  } else {
    showItemLines.value = false
  }
}

// Sélection d'un article existant
const onSelectItem = (lineIndex: number, itemId: string) => {
  const line = lines.value[lineIndex]
  const selected = items.value?.find((it: any) => it.id === itemId)
  if (selected) {
    line.itemId = selected.id
    line.name = selected.name
    line.unit = selected.unit
    line.referencePrice = selected.referencePrice || 0
    line.tolerancePercent = selected.tolerancePercent || 10
    // Propose le prix de référence par défaut
    if (line.unitPriceDeclared === 0) {
      line.unitPriceDeclared = selected.referencePrice || 0
    }
  }
}

const addLine = () => {
  lines.value.push({
    id: String(Date.now()),
    itemId: '',
    name: '',
    unit: 'Unité',
    quantity: 1,
    unitPriceDeclared: 0,
    referencePrice: 0,
    tolerancePercent: 10
  })
}

const removeLine = (index: number) => {
  if (lines.value.length > 1) {
    lines.value.splice(index, 1)
  }
}

// Comparaison en direct pour une ligne
const getLineComparison = (line: LineState): PriceComparisonResult => {
  return evaluatePriceDifference(
    line.unitPriceDeclared,
    line.referencePrice,
    line.tolerancePercent,
    settings.value?.suspectThreshold || 20
  )
}

// Calcul du montant total demandé (selon panier ou saisie directe)
const totalAmount = computed(() => {
  if (form.type === 'MATERIEL' || showItemLines.value) {
    return lines.value.reduce((sum, line) => {
      return sum + Math.round((line.quantity || 0) * (line.unitPriceDeclared || 0))
    }, 0)
  }
  return Math.round(Number(form.directAmount) || 0)
})

// Montant en toutes lettres généré en temps réel
const totalInWords = computed(() => {
  return amountInWordsFCFA(totalAmount.value)
})

const handleSubmit = async () => {
  formErrors.value = {}
  errorMessage.value = ''

  const isWithItems = form.type === 'MATERIEL' || showItemLines.value

  const payload: any = {
    type: form.type,
    workerId: form.workerId,
    purpose: form.purpose,
    city: form.city,
    date: form.date,
    witnessIds: form.witnessIds,
    templateVersion: selectedTemplateVersion.value,
    notes: form.notes
  }

  if (isWithItems) {
    payload.lines = lines.value.map((l) => ({
      itemId: l.itemId,
      name: l.name,
      unit: l.unit,
      quantity: Number(l.quantity),
      unitPriceDeclared: Math.round(Number(l.unitPriceDeclared))
    }))
  } else {
    payload.amount = Math.round(Number(form.directAmount))
    payload.lines = []
  }

  const validation = validateForm(CreateCommitmentSchema, payload)
  if (!validation.success) {
    formErrors.value = validation.errors
    errorMessage.value = validation.firstError
    return
  }

  loading.value = true
  try {
    const res = await $fetch<{ success: boolean; commitment: { id: string } }>('/api/commitments', {
      method: 'POST',
      body: validation.data
    })

    await router.push(`/engagements/${res.commitment.id}`)
  } catch (err: any) {
    errorMessage.value = err.data?.statusMessage || err.message || 'Erreur lors de la création de l’engagement'
  } finally {
    loading.value = false
  }
}
</script>

<template>
  <div class="space-y-6 max-w-4xl mx-auto">
    <!-- En-tête -->
    <div class="flex items-center justify-between">
      <div>
        <div class="flex items-center gap-2">
          <NuxtLink to="/engagements" class="text-xs font-medium text-slate-500 hover:text-slate-800 dark:hover:text-white">
            ← Retour aux engagements
          </NuxtLink>
        </div>
        <h1 class="text-2xl font-bold tracking-tight text-slate-900 dark:text-white mt-1">
          Nouvel engagement financier
        </h1>
        <p class="text-xs sm:text-sm text-slate-500">
          Choisissez la nature de l'engagement : achat de matériel, prêt d'argent, salaire ou frais divers
        </p>
      </div>
    </div>

    <!-- Alerte d'erreur -->
    <AppCard
      v-if="errorMessage"
      variant="danger"
      icon="i-lucide-alert-circle"
      :title="errorMessage"
    />

    <form class="space-y-6" @submit.prevent="handleSubmit">
      <!-- Section 0 : Nature de l'engagement -->
      <AppCard
        title="Nature de l'engagement"
        description="Précisez le type d'opération financière pour adapter la lettre et les clauses juridiques"
        icon="i-lucide-layers"
        body-class="space-y-3"
      >
        <div class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
          <button
            v-for="ct in commitmentTypes"
            :key="ct.type"
            type="button"
            class=" flex p-3.5 rounded-lg border text-left transition-all relative flex flex-col justify-between cursor-pointer"
            :class="[
              form.type === ct.type
                ? 'border-emerald-500 bg-emerald-50/50 dark:bg-emerald-950/20 ring-2 ring-emerald-500'
                : 'border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 hover:border-slate-300 dark:hover:border-slate-700'
            ]"
            @click="selectType(ct.type)"
          >
            <div>
              <div class="flex items-center justify-between mb-2">
                <UIcon
                  :name="ct.icon"
                  class="w-5 h-5"
                  :class="form.type === ct.type ? 'text-emerald-600' : 'text-slate-500'"
                />
                <span
                  v-if="form.type === ct.type"
                  class="w-2 h-2 rounded-full bg-emerald-500"
                />
              </div>
              <div class="font-bold text-xs text-slate-900 dark:text-white mb-0.5">
                {{ ct.label }}
              </div>
              <p class="text-[11px] text-slate-500 leading-tight">
                {{ ct.description }}
              </p>
            </div>
          </button>
        </div>
      </AppCard>

      <!-- Section 1 : Informations Générales -->
      <AppCard
        title="1. Cadre de la demande"
        icon="i-lucide-user-check"
        body-class="space-y-4"
      >
        <div class="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <!-- Sélection Employé -->
          <div>
            <label class="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
              Employé / Bénéficiaire <span class="text-red-500">*</span>
            </label>
            <select
              v-model="form.workerId"
              required
              class="w-full px-3 py-2.5 text-xs rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-emerald-500 cursor-pointer"
              :class="{ 'border-red-500 focus:ring-red-500': formErrors.workerId }"
            >
              <option value="" disabled>Sélectionner un employé...</option>
              <option v-for="w in workers" :key="w.id" :value="w.id">
                {{ w.civility }} {{ w.fullName }} (CNI : {{ w.cniMasked }})
              </option>
            </select>
            <p v-if="formErrors.workerId" class="text-xs text-red-500 mt-1 font-medium">
              {{ formErrors.workerId }}
            </p>
          </div>

          <!-- Ville et Date -->
          <div class="grid grid-cols-2 gap-2">
            <div>
              <label class="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                Fait à (Ville) <span class="text-red-500">*</span>
              </label>
              <input
                v-model="form.city"
                type="text"
                required
                class="w-full px-3 py-2.5 text-xs rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-emerald-500"
                :class="{ 'border-red-500 focus:ring-red-500': formErrors.city }"
              />
              <p v-if="formErrors.city" class="text-xs text-red-500 mt-1 font-medium">
                {{ formErrors.city }}
              </p>
            </div>
            <div>
              <AppDatePicker
                v-model="form.date"
                label="Date de la demande"
                required
                :error="formErrors.date"
              />
            </div>
          </div>
        </div>

        <!-- Motif de la dépense -->
        <div>
          <label class="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
            Motif de la demande <span class="text-red-500">*</span>
          </label>
          <input
            v-model="form.purpose"
            type="text"
            required
            :placeholder="form.type === 'PRET' ? 'Ex : Avance remboursable pour urgence médicale familiale' : form.type === 'SALAIRE' ? 'Ex : Règlement salaire mensuel et prestations' : 'Ex : Achat de fer et ciment pour coffrage dalle'"
            class="w-full px-3.5 py-2.5 text-xs rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-emerald-500"
            :class="{ 'border-red-500 focus:ring-red-500': formErrors.purpose }"
          />
          <p v-if="formErrors.purpose" class="text-xs text-red-500 mt-1 font-medium">
            {{ formErrors.purpose }}
          </p>
          <!-- Suggestions dynamiques de motifs selon le type -->
          <div class="flex flex-wrap gap-1.5 mt-2">
            <span class="text-[11px] text-slate-500 self-center">Suggestions :</span>
            <AppButton
              v-for="sug in frequentPurposesByType"
              :key="sug"
              variant="outline"
              size="xs"
              :label="sug"
              class="text-[11px]"
              @click="form.purpose = sug"
            />
          </div>
        </div>

        <!-- Témoins -->
        <div>
          <label class="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
            Témoins désignés pour la lettre (Optionnel, max 2)
          </label>
          <div class="grid grid-cols-1 sm:grid-cols-2 gap-2">
            <label
              v-for="wt in witnesses"
              :key="wt.id"
              class="flex items-center gap-2 p-2.5 rounded-lg border border-slate-200 dark:border-slate-800 cursor-pointer hover:bg-slate-50 dark:hover:bg-slate-800/40 text-xs"
            >
              <input
                v-model="form.witnessIds"
                type="checkbox"
                :value="wt.id"
                :disabled="form.witnessIds.length >= 2 && !form.witnessIds.includes(wt.id)"
                class="rounded border-slate-300 text-emerald-600 focus:ring-emerald-500"
              />
              <span class="font-medium text-slate-900 dark:text-white">
                {{ wt.civility }} {{ wt.fullName }}
              </span>
              <span class="text-slate-500">({{ wt.cniMasked }})</span>
            </label>
          </div>
        </div>

        <!-- Version du Modèle de Lettre -->
        <div v-if="templateData?.templates && templateData.templates.length > 1" class="pt-2 border-t border-slate-100 dark:border-slate-800">
          <label class="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
            Modèle de lettre juridique à appliquer
          </label>
          <div class="grid grid-cols-1 sm:grid-cols-3 gap-2">
            <label
              v-for="tpl in templateData.templates"
              :key="tpl.id"
              class="flex items-center gap-2 p-2 rounded-lg border text-xs cursor-pointer transition-colors"
              :class="[
                selectedTemplateVersion === tpl.version
                  ? 'border-emerald-500 bg-emerald-50/50 dark:bg-emerald-950/20 font-bold text-slate-900 dark:text-white ring-1 ring-emerald-500'
                  : 'border-slate-200 dark:border-slate-800 hover:bg-slate-50 dark:hover:bg-slate-800/40 text-slate-600 dark:text-slate-400'
              ]"
            >
              <input
                v-model="selectedTemplateVersion"
                type="radio"
                :value="tpl.version"
                class="text-emerald-600 focus:ring-emerald-500"
              />
              <span>Version v{{ tpl.version }}</span>
              <span v-if="tpl.isActive" class="text-[10px] text-emerald-600 dark:text-emerald-400 font-semibold">(Actif)</span>
            </label>
          </div>
        </div>
      </AppCard>

      <!-- Section 2A : Saisie directe du montant (si Prêt, Salaire ou Autre) -->
      <AppCard
        v-if="form.type !== 'MATERIEL' && !showItemLines"
        title="2. Montant financier alloué"
        :description="form.type === 'PRET' ? 'Montant du prêt accordé par la direction à rembourser par l’employé' : form.type === 'SALAIRE' ? 'Montant de la rémunération versée à l’employé avec décharge' : 'Montant alloué pour la dépense'"
        :icon="form.type === 'PRET' ? 'i-lucide-hand-coins' : form.type === 'SALAIRE' ? 'i-lucide-banknote' : 'i-lucide-coins'"
        body-class="space-y-4"
      >
        <div class="grid grid-cols-1 sm:grid-cols-2 gap-4 items-center">
          <div>
            <label class="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
              Montant demandé (en FCFA) <span class="text-red-500">*</span>
            </label>
            <input
              v-model.number="form.directAmount"
              type="number"
              step="1"
              min="1"
              required
              placeholder="Ex : 250000"
              class="w-full px-3.5 py-2.5 text-base rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white font-bold focus:outline-none focus:ring-2 focus:ring-emerald-500"
              :class="{ 'border-red-500 focus:ring-red-500': formErrors.amount }"
            />
            <p v-if="formErrors.amount" class="text-xs text-red-500 mt-1 font-medium">
              {{ formErrors.amount }}
            </p>
          </div>

          <div class="p-3 rounded-lg bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700">
            <span class="text-[11px] text-slate-500 block mb-0.5">Montant formaté :</span>
            <div class="text-lg font-black text-slate-900 dark:text-white">
              {{ formatFCFA(form.directAmount || 0) }}
            </div>
            <div class="text-[11px] text-slate-500 italic mt-0.5">
              (En lettres : {{ totalInWords }})
            </div>
          </div>
        </div>

        <div class="pt-2 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between">
          <span class="text-xs text-slate-500">
            Vous souhaitez détailler une liste d'articles ou fournitures ?
          </span>
          <AppButton
            variant="ghost"
            size="xs"
            icon="i-lucide-list-plus"
            label="Ajouter une grille d'articles"
            @click="showItemLines = true"
          />
        </div>
      </AppCard>

      <!-- Section 2B : Articles et Comparaison des Prix en Direct (si Matériel ou avec articles) -->
      <AppCard
        v-if="form.type === 'MATERIEL' || showItemLines"
        title="2. Articles & Comparaison des Prix de Référence"
        description="Chaque ligne compare le prix déclaré par l'employé avec le tarif du marché"
        icon="i-lucide-shopping-cart"
        body-class="space-y-4"
      >
        <template #actions>
          <div class="flex items-center gap-2">
            <AppButton
              v-if="form.type !== 'MATERIEL'"
              variant="ghost"
              size="xs"
              icon="i-lucide-x"
              label="Basculer vers montant direct"
              @click="showItemLines = false"
            />
            <AppButton
              variant="soft"
              size="xs"
              icon="i-lucide-plus"
              label="Ajouter une ligne"
              @click="addLine"
            />
          </div>
        </template>

        <p v-if="formErrors.lines" class="text-xs text-red-500 font-medium">
          {{ formErrors.lines }}
        </p>

        <div class="space-y-3">
          <AppCard
            v-for="(line, index) in lines"
            :key="line.id"
            variant="subtle"
            body-class="space-y-3"
          >
            <div class="flex items-center justify-between text-xs font-bold text-slate-600 dark:text-slate-400">
              <span>Ligne #{{ index + 1 }}</span>
              <AppButton
                v-if="lines.length > 1"
                variant="ghost"
                color="error"
                size="xs"
                icon="i-lucide-trash-2"
                label="Supprimer"
                @click="removeLine(index)"
              />
            </div>

            <div class="grid grid-cols-1 sm:grid-cols-12 gap-3">
              <!-- Choix article -->
              <div class="sm:col-span-5">
                <label class="block text-[11px] font-semibold text-slate-600 dark:text-slate-400 mb-1">
                  Article de référence
                </label>
                <select
                  :value="line.itemId"
                  class="w-full px-3 py-2 text-xs rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-emerald-500 cursor-pointer"
                  :class="{ 'border-red-500 focus:ring-red-500': formErrors[`lines.${index}.itemId`] }"
                  @change="(e: any) => onSelectItem(index, e.target.value)"
                >
                  <option value="" disabled>Choisir un article...</option>
                  <option v-for="it in items" :key="it.id" :value="it.id">
                    {{ it.name }} (Réf: {{ formatFCFA(it.referencePrice) }} / {{ it.unit }})
                  </option>
                </select>
                <p v-if="formErrors[`lines.${index}.itemId`]" class="text-[11px] text-red-500 mt-1 font-medium">
                  {{ formErrors[`lines.${index}.itemId`] }}
                </p>
              </div>

              <!-- Quantité -->
              <div class="sm:col-span-2">
                <label class="block text-[11px] font-semibold text-slate-600 dark:text-slate-400 mb-1">
                  Quantité ({{ line.unit || 'Unité' }})
                </label>
                <input
                  v-model.number="line.quantity"
                  type="number"
                  step="any"
                  min="0.1"
                  required
                  class="w-full px-3 py-2 text-xs rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white text-right focus:outline-none focus:ring-2 focus:ring-emerald-500"
                  :class="{ 'border-red-500 focus:ring-red-500': formErrors[`lines.${index}.quantity`] }"
                />
                <p v-if="formErrors[`lines.${index}.quantity`]" class="text-[11px] text-red-500 mt-1 font-medium">
                  {{ formErrors[`lines.${index}.quantity`] }}
                </p>
              </div>

              <!-- Prix Unitaire Déclaré -->
              <div class="sm:col-span-3">
                <label class="block text-[11px] font-semibold text-slate-600 dark:text-slate-400 mb-1">
                  Prix Unit. Déclaré (FCFA)
                </label>
                <input
                  v-model.number="line.unitPriceDeclared"
                  type="number"
                  step="1"
                  min="1"
                  required
                  class="w-full px-3 py-2 text-xs rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white text-right font-bold focus:outline-none focus:ring-2 focus:ring-emerald-500"
                  :class="{ 'border-red-500 focus:ring-red-500': formErrors[`lines.${index}.unitPriceDeclared`] }"
                />
                <p v-if="formErrors[`lines.${index}.unitPriceDeclared`]" class="text-[11px] text-red-500 mt-1 font-medium">
                  {{ formErrors[`lines.${index}.unitPriceDeclared`] }}
                </p>
              </div>

              <!-- Total Ligne -->
              <div class="sm:col-span-2 flex flex-col justify-end text-right">
                <span class="text-[10px] text-slate-500 font-medium">Sous-total</span>
                <span class="text-sm font-bold text-slate-900 dark:text-white">
                  {{ formatFCFA(Math.round((line.quantity || 0) * (line.unitPriceDeclared || 0))) }}
                </span>
              </div>
            </div>

            <!-- Indicateur de prix en temps réel -->
            <div
              v-if="line.referencePrice > 0 && line.unitPriceDeclared > 0"
              class="flex flex-wrap items-center justify-between pt-2 border-t border-slate-200 dark:border-slate-700/60 text-xs gap-2"
            >
              <div class="flex items-center gap-2">
                <span class="text-slate-500">Prix de référence :</span>
                <span class="font-semibold text-slate-800 dark:text-slate-200">
                  {{ formatFCFA(line.referencePrice) }}
                </span>
                <span class="text-[11px] text-slate-500">
                  (Tolérance admise : {{ line.tolerancePercent }}%)
                </span>
              </div>

              <div class="flex items-center gap-2">
                <span class="text-slate-500">Écart :</span>
                <span
                  class="font-bold"
                  :class="[
                    getLineComparison(line).differenceValue > 0
                      ? getLineComparison(line).status === 'suspect' ? 'text-red-600' : 'text-amber-600'
                      : 'text-emerald-600'
                  ]"
                >
                  {{ getLineComparison(line).differenceValue > 0 ? '+' : '' }}{{ formatFCFA(getLineComparison(line).differenceValue) }}
                  ({{ getLineComparison(line).differencePercent > 0 ? '+' : '' }}{{ getLineComparison(line).differencePercent }}%)
                </span>

                <!-- Badge de contrôle -->
                <AppBadge
                  v-if="getLineComparison(line).status === 'conforme'"
                  status="Conforme"
                  variant="subtle"
                  size="xs"
                />
                <AppBadge
                  v-else-if="getLineComparison(line).status === 'a_verifier'"
                  status="À vérifier"
                  variant="subtle"
                  size="xs"
                />
                <AppBadge
                  v-else
                  status="Suspect"
                  variant="solid"
                  size="xs"
                />
              </div>
            </div>
          </AppCard>
        </div>
      </AppCard>

      <!-- Section 3 : Récapitulatif Total & Montant en Lettres -->
      <AppCard
        title="3. Récapitulatif Total & Montant en Lettres"
        icon="i-lucide-calculator"
        body-class="space-y-4"
      >
        <div class="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2 pb-3 border-b border-slate-100 dark:border-slate-800">
          <div>
            <span class="text-xs font-semibold text-slate-500 uppercase tracking-wider block">
              Montant Total Demandé
            </span>
            <div class="text-2xl sm:text-3xl font-extrabold text-emerald-600 dark:text-emerald-400 mt-0.5">
              {{ formatFCFA(totalAmount) }}
            </div>
          </div>
          <div class="text-right">
            <span class="text-xs font-medium text-slate-500">
              Nature : <strong class="text-slate-900 dark:text-white">{{ commitmentTypes.find(c => c.type === form.type)?.label }}</strong>
            </span>
            <div v-if="form.type === 'MATERIEL' || showItemLines" class="text-[11px] text-slate-400">
              {{ lines.length }} article(s) saisis
            </div>
          </div>
        </div>

        <div>
          <span class="text-xs font-semibold text-slate-500 uppercase tracking-wider block">
            Génération automatique en toutes lettres (pour la lettre officielle) :
          </span>
          <div class="mt-1 p-3 rounded-lg bg-slate-50 dark:bg-slate-800 text-slate-800 dark:text-slate-200 text-sm font-medium italic border border-slate-200 dark:border-slate-700">
            « {{ totalInWords }} »
          </div>
        </div>

        <div>
          <label class="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
            Notes / Observations particulières de la direction (facultatif)
          </label>
          <textarea
            v-model="form.notes"
            rows="2"
            class="w-full px-3 py-2 text-xs rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-emerald-500"
            placeholder="Commentaires internes sur les conditions d'octroi ou justificatifs..."
          />
        </div>
      </AppCard>

      <!-- Boutons d'action -->
      <div class="flex items-center justify-end gap-3 pt-2">
        <AppButton
          to="/engagements"
          variant="outline"
          size="sm"
          label="Annuler"
        />

        <AppButton
          type="submit"
          variant="primary"
          size="sm"
          :loading="loading"
          :disabled="loading || totalAmount <= 0"
          icon="i-lucide-check-circle-2"
          label="Créer l'engagement"
        />
      </div>
    </form>
  </div>
</template>
