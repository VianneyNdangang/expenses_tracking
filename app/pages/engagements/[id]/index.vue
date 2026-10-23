<script setup lang="ts">
import { formatFCFA } from '~~/shared/currency'
import {
  ApproveCommitmentSchema,
  CreatePaymentSchema,
  CreateJustificationSchema,
  CancelCommitmentSchema,
  validateForm
} from '~~/shared/schemas'

const route = useRoute()
const router = useRouter()
const commitmentId = route.params.id as string

const { data: commitment, pending, refresh } = await useFetch(`/api/commitments/${commitmentId}`)

const { downloadingId, downloadCommitmentPdf } = usePdfDownload()
const { isPatron } = useAuth()

useHead({
  title: computed(() => commitment.value ? `${commitment.value.letterNumber} - Détail` : 'Détail Engagement')
})

// Modales d'action
const isDecisionModalOpen = ref(false)
const decisionType = ref<'approve' | 'refuse'>('approve')
const decisionForm = reactive({
  amountApproved: 0,
  refusalReason: ''
})
const decisionErrors = ref<Record<string, string>>({})

const isPaymentModalOpen = ref(false)
const paymentForm = reactive({
  amount: 0,
  date: new Date().toISOString().split('T')[0],
  method: 'Espèces' as 'Espèces' | 'Virement' | 'Chèque' | 'Mobile Money' | 'Autre',
  reference: '',
  notes: ''
})
const paymentErrors = ref<Record<string, string>>({})

const isJustificationModalOpen = ref(false)
const justificationForm = reactive({
  amountSpent: 0,
  date: new Date().toISOString().split('T')[0],
  notes: ''
})
const justificationErrors = ref<Record<string, string>>({})

const isCancelModalOpen = ref(false)
const cancelForm = reactive({
  reason: ''
})
const cancelErrors = ref<Record<string, string>>({})

const isScanModalOpen = ref(false)
const scanFile = ref<File | null>(null)

const actionLoading = ref(false)
const actionError = ref('')

// Ouvre la modale d'acceptation ou refus
const openDecisionModal = (type: 'approve' | 'refuse') => {
  decisionType.value = type
  decisionErrors.value = {}
  actionError.value = ''
  if (type === 'approve') {
    decisionForm.amountApproved = commitment.value?.amountRequested || 0
  } else {
    decisionForm.refusalReason = ''
  }
  isDecisionModalOpen.value = true
}

const submitDecision = async () => {
  decisionErrors.value = {}
  actionError.value = ''

  const payload = {
    approved: decisionType.value === 'approve',
    amountApproved: Math.round(Number(decisionForm.amountApproved)),
    refusalReason: decisionForm.refusalReason
  }

  const validation = validateForm(ApproveCommitmentSchema, payload)
  if (!validation.success) {
    decisionErrors.value = validation.errors
    actionError.value = validation.firstError
    return
  }

  actionLoading.value = true
  try {
    await $fetch(`/api/commitments/${commitmentId}/decision`, {
      method: 'POST',
      body: validation.data
    })
    isDecisionModalOpen.value = false
    await refresh()
  } catch (err: any) {
    actionError.value = err.data?.statusMessage || err.message || 'Erreur lors de la prise de décision'
  } finally {
    actionLoading.value = false
  }
}

// Ouvre la modale de paiement
const openPaymentModal = () => {
  paymentForm.amount = commitment.value?.amountApproved || commitment.value?.amountRequested || 0
  paymentForm.date = new Date().toISOString().split('T')[0]
  paymentForm.method = 'Espèces'
  paymentForm.reference = ''
  paymentForm.notes = ''
  paymentErrors.value = {}
  actionError.value = ''
  isPaymentModalOpen.value = true
}

const submitPayment = async () => {
  paymentErrors.value = {}
  actionError.value = ''

  const payload = {
    commitmentId,
    amount: Math.round(Number(paymentForm.amount)),
    date: paymentForm.date,
    method: paymentForm.method,
    reference: paymentForm.reference,
    notes: paymentForm.notes
  }

  const validation = validateForm(CreatePaymentSchema, payload)
  if (!validation.success) {
    paymentErrors.value = validation.errors
    actionError.value = validation.firstError
    return
  }

  actionLoading.value = true
  try {
    await $fetch('/api/payments', {
      method: 'POST',
      body: validation.data
    })
    isPaymentModalOpen.value = false
    await refresh()
  } catch (err: any) {
    actionError.value = err.data?.statusMessage || err.message || 'Erreur lors de l’enregistrement du paiement'
  } finally {
    actionLoading.value = false
  }
}

// Ouvre la modale de justification
const openJustificationModal = () => {
  const paid = commitment.value?.payment?.amount || commitment.value?.amountApproved || 0
  justificationForm.amountSpent = paid
  justificationForm.date = new Date().toISOString().split('T')[0]
  justificationForm.notes = ''
  justificationErrors.value = {}
  actionError.value = ''
  isJustificationModalOpen.value = true
}

const liveBalance = computed(() => {
  const paid = commitment.value?.payment?.amount || commitment.value?.amountApproved || 0
  return paid - (justificationForm.amountSpent || 0)
})

const submitJustification = async () => {
  justificationErrors.value = {}
  actionError.value = ''

  const payload = {
    commitmentId,
    amountSpent: Math.round(Number(justificationForm.amountSpent)),
    date: justificationForm.date,
    notes: justificationForm.notes
  }

  const validation = validateForm(CreateJustificationSchema, payload)
  if (!validation.success) {
    justificationErrors.value = validation.errors
    actionError.value = validation.firstError
    return
  }

  actionLoading.value = true
  try {
    await $fetch('/api/justifications', {
      method: 'POST',
      body: validation.data
    })
    isJustificationModalOpen.value = false
    await refresh()
  } catch (err: any) {
    actionError.value = err.data?.statusMessage || err.message || 'Erreur lors de l’enregistrement de la justification'
  } finally {
    actionLoading.value = false
  }
}

// Annulation
const submitCancel = async () => {
  cancelErrors.value = {}
  actionError.value = ''

  const validation = validateForm(CancelCommitmentSchema, {
    reason: cancelForm.reason
  })

  if (!validation.success) {
    cancelErrors.value = validation.errors
    actionError.value = validation.firstError
    return
  }

  actionLoading.value = true
  try {
    await $fetch(`/api/commitments/${commitmentId}/cancel`, {
      method: 'POST',
      body: validation.data
    })
    isCancelModalOpen.value = false
    await refresh()
  } catch (err: any) {
    actionError.value = err.data?.statusMessage || err.message || 'Erreur lors de l’annulation'
  } finally {
    actionLoading.value = false
  }
}

// Upload Scan signé
const onFileSelected = (e: any) => {
  const file = e.target.files?.[0]
  if (file) {
    scanFile.value = file
  }
}

const submitScan = async () => {
  if (!scanFile.value) return
  actionLoading.value = true
  actionError.value = ''

  try {
    const reader = new FileReader()
    reader.onload = async (e) => {
      const base64 = e.target?.result as string
      await $fetch(`/api/commitments/${commitmentId}/upload-scan`, {
        method: 'POST',
        body: {
          filename: scanFile.value!.name,
          base64
        }
      })
      isScanModalOpen.value = false
      scanFile.value = null
      await refresh()
    }
    reader.readAsDataURL(scanFile.value)
  } catch (err: any) {
    actionError.value = err.data?.statusMessage || err.message || 'Erreur lors du téléversement du scan'
  } finally {
    actionLoading.value = false
  }
}

const getLineStatusBadge = (status: string) => {
  switch (status) {
    case 'conforme':
      return { class: 'bg-emerald-50 text-emerald-700 dark:bg-emerald-950/60 dark:text-emerald-300', label: 'Conforme' }
    case 'a_verifier':
      return { class: 'bg-amber-50 text-amber-700 dark:bg-amber-950/60 dark:text-amber-300', label: 'À vérifier' }
    case 'suspect':
      return { class: 'bg-red-50 text-red-700 dark:bg-red-950/60 dark:text-red-300 font-bold', label: 'Suspect' }
    default:
      return { class: 'bg-slate-100 text-slate-700', label: status }
  }
}
</script>

<template>
  <div v-if="commitment" class="space-y-6 max-w-5xl mx-auto">
    <!-- En-tête supérieur avec boutons d'actions contextuelles -->
    <div class="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 pb-4 border-b border-slate-200 dark:border-slate-800">
      <div>
        <NuxtLink to="/engagements" class="text-xs font-semibold text-slate-500 hover:text-slate-800 dark:hover:text-white flex items-center gap-1 mb-1">
          <UIcon name="i-lucide-arrow-left" class="w-3.5 h-3.5" />
          <span>Tous les engagements</span>
        </NuxtLink>
        <div class="flex items-center gap-3">
          <h1 class="text-2xl font-bold tracking-tight text-slate-900 dark:text-white">
            {{ commitment.letterNumber }}
          </h1>
          <span
            class="px-2.5 py-0.5 rounded-full text-xs font-bold border"
            :class="[
              commitment.type === 'PRET'
                ? 'bg-amber-50 text-amber-700 dark:bg-amber-950/40 dark:text-amber-300 border-amber-200 dark:border-amber-800'
                : commitment.type === 'SALAIRE'
                ? 'bg-purple-50 text-purple-700 dark:bg-purple-950/40 dark:text-purple-300 border-purple-200 dark:border-purple-800'
                : commitment.type === 'AUTRE'
                ? 'bg-blue-50 text-blue-700 dark:bg-blue-950/40 dark:text-blue-300 border-blue-200 dark:border-blue-800'
                : 'bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-300 border-slate-200 dark:border-slate-700'
            ]"
          >
            {{ commitment.type === 'PRET' ? 'Prêt d’argent' : commitment.type === 'SALAIRE' ? 'Salaire' : commitment.type === 'AUTRE' ? 'Autre dépense' : 'Achat Matériel' }}
          </span>
          <span
            v-if="commitment.isCancelled"
            class="px-2.5 py-0.5 rounded-full text-xs font-bold bg-rose-100 text-rose-800 dark:bg-rose-950 dark:text-rose-300"
          >
            Annulé
          </span>
        </div>
        <p class="text-xs text-slate-500 mt-0.5">
          Créé le {{ new Date(commitment.date).toLocaleDateString('fr-FR', { day: 'numeric', month: 'long', year: 'numeric' }) }} • Ville : {{ commitment.city }}
        </p>
      </div>

      <!-- Barre d'actions selon statut -->
      <div class="flex flex-wrap items-center gap-2">
        <!-- Action : Télécharger en PDF (téléchargement direct sans redirection) -->
        <AppButton
          v-if="['Accepté', 'Payé', 'Justifié'].includes(commitment.status)"
          variant="primary"
          size="xs"
          icon="i-lucide-download"
          label="Télécharger PDF"
          :loading="downloadingId === commitment.id"
          @click="downloadCommitmentPdf(commitment.id, commitment.letterNumber)"
        />

        <!-- Action : Impression A4 (toujours possible dès acceptation) -->
        <AppButton
          v-if="['Accepté', 'Payé', 'Justifié'].includes(commitment.status)"
          :to="`/engagements/${commitment.id}/lettre`"
          target="_blank"
          variant="outline"
          size="xs"
          icon="i-lucide-printer"
          label="Imprimer Lettre A4"
        />

        <!-- Actions si Demandé -->
        <template v-if="commitment.status === 'Demandé' && !commitment.isCancelled">
          <template v-if="isPatron">
            <AppButton
              variant="danger-outline"
              size="xs"
              icon="i-lucide-x-circle"
              label="Refuser"
              @click="openDecisionModal('refuse')"
            />

            <AppButton
              variant="primary"
              size="xs"
              icon="i-lucide-check-circle"
              label="Accepter & Valider"
              @click="openDecisionModal('approve')"
            />
          </template>
          <div v-else class="text-xs text-amber-700 dark:text-amber-400 bg-amber-50 dark:bg-amber-950/40 px-2.5 py-1.5 rounded-lg border border-amber-200 dark:border-amber-800 flex items-center gap-1.5 font-medium">
            <UIcon name="i-lucide-lock" class="w-3.5 h-3.5 shrink-0" />
            <span>Validation réservée à la Direction (Patron)</span>
          </div>
        </template>

        <!-- Actions si Accepté : Enregistrer le Paiement -->
        <template v-if="commitment.status === 'Accepté' && !commitment.isCancelled">
          <template v-if="isPatron">
            <AppButton
              color="primary"
              variant="solid"
              size="xs"
              icon="i-lucide-banknote"
              label="Enregistrer le Paiement"
              @click="openPaymentModal"
            />
          </template>
          <div v-else class="text-xs text-amber-700 dark:text-amber-400 bg-amber-50 dark:bg-amber-950/40 px-2.5 py-1.5 rounded-lg border border-amber-200 dark:border-amber-800 flex items-center gap-1.5 font-medium">
            <UIcon name="i-lucide-lock" class="w-3.5 h-3.5 shrink-0" />
            <span>Décaissement réservé à la Direction (Patron)</span>
          </div>
        </template>

        <!-- Actions si Payé : Enregistrer Justification & Scan -->
        <template v-if="commitment.status === 'Payé' && !commitment.isCancelled">
          <AppButton
            variant="outline"
            size="xs"
            icon="i-lucide-upload"
            :label="commitment.signedLetterScanUrl ? 'Modifier le Scan' : 'Joindre Scan Signé'"
            @click="isScanModalOpen = true"
          />

          <AppButton
            variant="primary"
            size="xs"
            icon="i-lucide-receipt"
            label="Enregistrer la Justification"
            @click="openJustificationModal"
          />
        </template>

        <!-- Bouton d'annulation (si non annulé et non justifié) -->
        <AppButton
          v-if="!commitment.isCancelled && commitment.status !== 'Justifié'"
          variant="ghost"
          size="xs"
          icon="i-lucide-ban"
          title="Annuler l'engagement"
          @click="isCancelModalOpen = true"
        />
      </div>
    </div>

    <!-- Alerte si Annulé -->
    <AppCard
      v-if="commitment.isCancelled"
      variant="danger"
      icon="i-lucide-alert-triangle"
      title="Cet engagement a été annulé par le patron."
    >
      <div class="text-xs"><strong>Motif d'annulation :</strong> {{ commitment.cancellationReason }}</div>
    </AppCard>

    <!-- Alerte si Refusé -->
    <AppCard
      v-if="commitment.status === 'Refusé'"
      variant="danger"
      icon="i-lucide-x-circle"
      title="Demande refusée par la direction."
    >
      <div class="text-xs"><strong>Motif du refus :</strong> {{ commitment.refusalReason || 'Non spécifié' }}</div>
    </AppCard>

    <!-- Frise chronologique des statuts -->
    <AppCard
      title="Évolution du dossier"
      icon="i-lucide-git-commit"
      body-class="space-y-2"
    >

      <div class="grid grid-cols-4 gap-2 text-center text-xs">
        <!-- 1. Demandé -->
        <div class="space-y-1.5">
          <div
            class="w-8 h-8 mx-auto rounded-full flex items-center justify-center font-bold text-xs"
            :class="[
              ['Demandé', 'Accepté', 'Payé', 'Justifié'].includes(commitment.status)
                ? 'bg-emerald-600 text-white'
                : 'bg-slate-100 text-slate-400 dark:bg-slate-800'
            ]"
          >
            1
          </div>
          <div class="font-semibold text-slate-900 dark:text-white">Demandé</div>
          <div class="text-[10px] text-slate-500">Demande employeur</div>
        </div>

        <!-- 2. Accepté -->
        <div class="space-y-1.5">
          <div
            class="w-8 h-8 mx-auto rounded-full flex items-center justify-center font-bold text-xs"
            :class="[
              ['Accepté', 'Payé', 'Justifié'].includes(commitment.status)
                ? 'bg-emerald-600 text-white'
                : 'bg-slate-100 text-slate-400 dark:bg-slate-800'
            ]"
          >
            2
          </div>
          <div class="font-semibold text-slate-900 dark:text-white">Accepté</div>
          <div class="text-[10px] text-slate-500">Accord du patron</div>
        </div>

        <!-- 3. Payé -->
        <div class="space-y-1.5">
          <div
            class="w-8 h-8 mx-auto rounded-full flex items-center justify-center font-bold text-xs"
            :class="[
              ['Payé', 'Justifié'].includes(commitment.status)
                ? 'bg-emerald-600 text-white'
                : 'bg-slate-100 text-slate-400 dark:bg-slate-800'
            ]"
          >
            3
          </div>
          <div class="font-semibold text-slate-900 dark:text-white">Payé</div>
          <div class="text-[10px] text-slate-500">Fonds remis</div>
        </div>

        <!-- 4. Justifié -->
        <div class="space-y-1.5">
          <div
            class="w-8 h-8 mx-auto rounded-full flex items-center justify-center font-bold text-xs"
            :class="[
              commitment.status === 'Justifié'
                ? 'bg-emerald-600 text-white'
                : 'bg-slate-100 text-slate-400 dark:bg-slate-800'
            ]"
          >
            4
          </div>
          <div class="font-semibold text-slate-900 dark:text-white">Justifié</div>
          <div class="text-[10px] text-slate-500">Reçus & Reliquat soldé</div>
        </div>
      </div>
    </AppCard>

    <!-- Synthèse & Parties prenantes -->
    <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
      <!-- Demandeur & Motif -->
      <AppCard
        title="Employé Demandeur"
        icon="i-lucide-user"
        body-class="space-y-3"
      >
        <div class="space-y-1.5 text-xs">
          <div class="flex justify-between">
            <span class="text-slate-500">Nom complet :</span>
            <span class="font-bold text-slate-900 dark:text-white whitespace-nowrap">
              {{ commitment.workerSnapshot.civility }} {{ commitment.workerSnapshot.fullName }}
            </span>
          </div>
          <div class="flex justify-between">
            <span class="text-slate-500">CNI (chiffrée en base) :</span>
            <span class="font-medium text-slate-800 dark:text-slate-200">
              {{ commitment.workerSnapshot.cniMasked }}
            </span>
          </div>
          <div class="flex justify-between">
            <span class="text-slate-500">Téléphone (chiffré en base) :</span>
            <span class="font-medium text-slate-800 dark:text-slate-200">
              {{ commitment.workerSnapshot.phoneMasked }}
            </span>
          </div>
          <div class="pt-2 border-t border-slate-100 dark:border-slate-800">
            <span class="text-slate-500 block mb-0.5">Motif de la demande :</span>
            <span class="font-semibold text-slate-900 dark:text-white block">
              {{ commitment.purpose }}
            </span>
          </div>
        </div>
      </AppCard>

      <!-- Témoins & Modèle -->
      <AppCard
        title="Témoins & Référence"
        icon="i-lucide-users"
        body-class="space-y-3"
      >
        <div class="space-y-2 text-xs">
          <div v-if="commitment.witnesses && commitment.witnesses.length > 0" class="space-y-1.5">
            <div v-for="(wt, idx) in commitment.witnesses" :key="idx" class="flex justify-between items-center py-0.5">
              <span class="text-slate-500">Témoin {{ idx + 1 }} :</span>
              <span class="font-medium text-slate-900 dark:text-white whitespace-nowrap">
                {{ wt.civility }} {{ wt.fullName }} ({{ wt.cniMasked }})
              </span>
            </div>
          </div>
          <div v-else class="text-slate-500 italic">
            Aucun témoin désigné sur cette lettre.
          </div>

          <div class="pt-2 border-t border-slate-100 dark:border-slate-800 space-y-1">
            <div class="flex justify-between">
              <span class="text-slate-500">Modèle de lettre type :</span>
              <span class="font-semibold text-slate-800 dark:text-slate-200">Version {{ commitment.templateVersion }}</span>
            </div>
            <div v-if="commitment.notes" class="text-slate-600 dark:text-slate-400 italic">
              « {{ commitment.notes }} »
            </div>
          </div>
        </div>
      </AppCard>
    </div>

    <!-- Tableau détaillé des Articles avec Comparaison de Prix Figée (si articles présents) -->
    <AppCard
      v-if="commitment.items && commitment.items.length > 0"
      title="Articles demandés & Écarts avec les prix de référence figés"
      :badge="`${commitment.items.length} article(s)`"
      icon="i-lucide-shopping-cart"
      no-padding
    >

      <div class="overflow-x-auto">
        <table class="w-full text-left text-xs">
          <thead class="bg-slate-50 dark:bg-slate-800/60 text-slate-500 font-semibold uppercase tracking-wider border-b border-slate-200 dark:border-slate-800">
            <tr>
              <th class="py-3 px-4 whitespace-nowrap">Article</th>
              <th class="py-3 px-3 text-center">Unité</th>
              <th class="py-3 px-3 text-right">Qté</th>
              <th class="py-3 px-3 text-right">Prix Unitaire Déclaré</th>
              <th class="py-3 px-3 text-right">Total Déclaré</th>
              <th class="py-3 px-3 text-right">Prix Réf. Figé</th>
              <th class="py-3 px-3 text-right">Écart</th>
              <th class="py-3 px-4 text-center">Statut Ligne</th>
            </tr>
          </thead>
          <tbody class="divide-y divide-slate-200 dark:divide-slate-800">
            <tr
              v-for="(item, idx) in commitment.items"
              :key="idx"
              class="hover:bg-slate-50/70 dark:hover:bg-slate-800/40"
            >
              <td class="py-3.5 px-4 font-semibold text-slate-900 dark:text-white whitespace-nowrap">
                {{ item.name }}
              </td>
              <td class="py-3.5 px-3 text-center text-slate-500">
                {{ item.unit }}
              </td>
              <td class="py-3.5 px-3 text-right font-medium text-slate-800 dark:text-slate-200">
                {{ item.quantity }}
              </td>
              <td class="py-3.5 px-3 text-right font-bold text-slate-900 dark:text-white">
                {{ formatFCFA(item.unitPriceDeclared) }}
              </td>
              <td class="py-3.5 px-3 text-right font-bold text-slate-900 dark:text-white">
                {{ formatFCFA(item.totalPriceDeclared) }}
              </td>
              <td class="py-3.5 px-3 text-right text-slate-500">
                {{ formatFCFA(item.referenceUnitPrice) }}
              </td>
              <td class="py-3.5 px-3 text-right whitespace-nowrap">
                <span
                  class="font-semibold"
                  :class="[
                    item.differenceValue > 0
                      ? item.status === 'suspect' ? 'text-red-600' : 'text-amber-600'
                      : 'text-emerald-600'
                  ]"
                >
                  {{ item.differenceValue > 0 ? '+' : '' }}{{ formatFCFA(item.differenceValue) }}
                  ({{ item.differencePercent > 0 ? '+' : '' }}{{ item.differencePercent }}%)
                </span>
              </td>
              <td class="py-3.5 px-4 text-center">
                <span
                  class="inline-block px-2.5 py-0.5 rounded text-[11px] font-semibold"
                  :class="getLineStatusBadge(item.status).class"
                >
                  {{ getLineStatusBadge(item.status).label }}
                </span>
              </td>
            </tr>
          </tbody>
        </table>
      </div>

      <!-- Totaux -->
      <div class="p-4 bg-slate-50 dark:bg-slate-800/40 border-t border-slate-200 dark:border-slate-800 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 text-xs">
        <div>
          <span class="text-slate-500">Montant en toutes lettres :</span>
          <span class="font-bold text-slate-900 dark:text-white ml-1">
            « {{ commitment.amountInWords }} »
          </span>
        </div>

        <div class="flex items-center gap-6 self-end sm:self-auto">
          <div>
            <span class="text-slate-500">Demandé :</span>
            <span class="font-bold text-slate-900 dark:text-white text-sm ml-1.5">
              {{ commitment.formattedAmountRequested }}
            </span>
          </div>

          <div v-if="commitment.amountApproved > 0">
            <span class="text-slate-500">Accordé par le patron :</span>
            <span class="font-bold text-emerald-600 dark:text-emerald-400 text-sm ml-1.5">
              {{ commitment.formattedAmountApproved }}
            </span>
          </div>
        </div>
      </div>
    </AppCard>

    <!-- Synthèse financière si aucun article (Prêt d'argent, Salaire, Autre) -->
    <AppCard
      v-else
      title="Détail & Cadre financier de l'opération"
      :icon="commitment.type === 'PRET' ? 'i-lucide-hand-coins' : commitment.type === 'SALAIRE' ? 'i-lucide-banknote' : 'i-lucide-file-text'"
      body-class="space-y-4"
    >
      <div class="space-y-3 text-xs sm:text-sm">
        <p v-if="commitment.type === 'PRET'" class="text-slate-700 dark:text-slate-300">
          Cette opération est un <strong>prêt d'argent ou une avance remboursable</strong> accordé(e) à l'employé. Le bénéficiaire s'engage formellement au remboursement selon les modalités ou retenues convenues d'un commun accord avec la direction.
        </p>
        <p v-else-if="commitment.type === 'SALAIRE'" class="text-slate-700 dark:text-slate-300">
          Ce versement est consenti au titre de la <strong>rémunération du travail / salaire</strong> pour les prestations et la période convenues, conférant à la direction pleine décharge et quittance libératoire.
        </p>
        <p v-else class="text-slate-700 dark:text-slate-300">
          Fonds alloués pour la réalisation des dépenses ou missions indiquées au motif, sous réserve de production des reçus et factures justificatives.
        </p>

        <div class="p-3.5 bg-slate-50 dark:bg-slate-800/70 rounded-lg border border-slate-200 dark:border-slate-700 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
          <div>
            <span class="text-slate-500 text-xs block mb-0.5">Montant net validé :</span>
            <div class="text-xl font-black text-emerald-600 dark:text-emerald-400">
              {{ commitment.formattedEffectiveAmount }}
            </div>
            <div class="text-xs text-slate-500 italic mt-0.5">
              « {{ commitment.amountInWords }} »
            </div>
          </div>

          <div class="flex items-center gap-4 text-xs">
            <div>
              <span class="text-slate-500">Montant demandé :</span>
              <div class="font-bold text-slate-900 dark:text-white">
                {{ commitment.formattedAmountRequested }}
              </div>
            </div>
            <div v-if="commitment.amountApproved > 0">
              <span class="text-slate-500">Montant accordé :</span>
              <div class="font-bold text-emerald-600 dark:text-emerald-400">
                {{ commitment.formattedAmountApproved }}
              </div>
            </div>
          </div>
        </div>
      </div>
    </AppCard>

    <!-- Section Paiement (si payé) -->
    <AppCard
      v-if="commitment.payment"
      title="Paiement / Décaissement Effectué"
      icon="i-lucide-check-circle"
      badge="Transaction validée"
      badge-color="primary"
      body-class="space-y-3"
    >
      <div class="grid grid-cols-2 sm:grid-cols-4 gap-4 text-xs">
        <div>
          <span class="text-slate-500 block">Montant payé :</span>
          <span class="text-base font-bold text-slate-900 dark:text-white">
            {{ commitment.payment.formattedAmount }}
          </span>
        </div>
        <div>
          <span class="text-slate-500 block">Date du paiement :</span>
          <span class="font-semibold text-slate-800 dark:text-slate-200">
            {{ new Date(commitment.payment.date).toLocaleDateString('fr-FR') }}
          </span>
        </div>
        <div>
          <span class="text-slate-500 block">Mode de paiement :</span>
          <span class="font-semibold text-slate-800 dark:text-slate-200">
            {{ commitment.payment.method }}
          </span>
        </div>
        <div>
          <span class="text-slate-500 block">Référence :</span>
          <span class="font-semibold text-slate-800 dark:text-slate-200">
            {{ commitment.payment.reference || 'Aucune' }}
          </span>
        </div>
      </div>
    </AppCard>

    <!-- Section Justification & Reliquat (si justifié) -->
    <AppCard
      v-if="commitment.justification"
      title="Justification des Dépenses & Bilan"
      icon="i-lucide-receipt"
      badge="Dossier soldé"
      badge-color="success"
      body-class="space-y-4"
    >
      <div class="grid grid-cols-1 sm:grid-cols-3 gap-4 text-xs">
        <div class="p-3 rounded-lg bg-slate-50 dark:bg-slate-800/60">
          <span class="text-slate-500 block">Montant payé au départ :</span>
          <span class="text-base font-bold text-slate-900 dark:text-white">
            {{ commitment.payment ? commitment.payment.formattedAmount : commitment.formattedEffectiveAmount }}
          </span>
        </div>

        <div class="p-3 rounded-lg bg-slate-50 dark:bg-slate-800/60">
          <span class="text-slate-500 block">Montant réellement dépensé :</span>
          <span class="text-base font-bold text-slate-900 dark:text-white">
            {{ commitment.justification.formattedAmountSpent }}
          </span>
        </div>

        <!-- Reliquat -->
        <div
          class="p-3 rounded-lg border"
          :class="[
            commitment.justification.balance > 0
              ? 'bg-emerald-50 text-emerald-800 dark:bg-emerald-950/60 dark:text-emerald-300 border-emerald-200 dark:border-emerald-800'
              : commitment.justification.balance === 0
                ? 'bg-slate-50 text-slate-800 dark:bg-slate-800 border-slate-200 dark:border-slate-700'
                : 'bg-red-50 text-red-800 dark:bg-red-950/60 dark:text-red-300 border-red-200 dark:border-red-800'
          ]"
        >
          <span class="block text-xs font-semibold">
            {{ commitment.justification.balance > 0 ? 'Reliquat Restitué au patron :' : commitment.justification.balance === 0 ? 'Solde exact :' : 'Dépassement de budget :' }}
          </span>
          <span class="text-lg font-extrabold">
            {{ commitment.justification.formattedBalance }}
          </span>
        </div>
      </div>

      <div v-if="commitment.justification.notes" class="text-xs text-slate-700 dark:text-slate-300 pt-2 border-t border-slate-100 dark:border-slate-800">
        <strong>Notes :</strong> {{ commitment.justification.notes }}
      </div>
    </AppCard>

    <!-- Scan de la lettre signée -->
    <AppCard
      v-if="commitment.signedLetterScanUrl"
      title="Scan de la lettre signée"
      icon="i-lucide-file-check"
      body-class="space-y-2"
    >
      <div class="flex items-center justify-between p-3 rounded-lg bg-slate-50 dark:bg-slate-800 text-xs">
        <div class="flex items-center gap-2">
          <UIcon name="i-lucide-file-check" class="w-5 h-5 text-emerald-600" />
          <span class="font-medium text-slate-900 dark:text-white">
            {{ commitment.signedLetterScanFilename || 'Document scanné' }}
          </span>
        </div>
        <a
          :href="commitment.signedLetterScanUrl"
          target="_blank"
          download
          class="font-semibold text-emerald-600 hover:text-emerald-700"
        >
          Télécharger le document →
        </a>
      </div>
    </AppCard>

    <!-- Modale Décision (Accepter / Refuser) -->
    <AppModal
      v-model="isDecisionModalOpen"
      :title="decisionType === 'approve' ? 'Accepter l’engagement' : 'Refuser l’engagement'"
      :description="decisionType === 'approve' ? 'Validez le montant demandé ou accordez un montant partiel.' : 'Précisez le motif du refus qui sera conservé au dossier.'"
      :icon="decisionType === 'approve' ? 'i-lucide-check-circle' : 'i-lucide-x-circle'"
      :confirm-label="decisionType === 'approve' ? 'Confirmer l’acceptation' : 'Confirmer le refus'"
      :confirm-color="decisionType === 'approve' ? 'primary' : 'error'"
      :confirm-loading="actionLoading"
      @confirm="submitDecision"
    >
      <div v-if="actionError" class="p-3 rounded-lg bg-red-50 text-red-700 text-xs">
        {{ actionError }}
      </div>

      <div v-if="decisionType === 'approve'" class="space-y-3">
        <p class="text-xs text-slate-600 dark:text-slate-400">
          Le montant total demandé est de <strong>{{ commitment.formattedAmountRequested }}</strong>.
        </p>

        <AppInput
          v-model.number="decisionForm.amountApproved"
          type="number"
          label="Montant accordé (FCFA)"
          min="1"
          :error="decisionErrors.amountApproved"
          required
        />
      </div>

      <div v-else class="space-y-3">
        <AppInput
          v-model="decisionForm.refusalReason"
          type="textarea"
          label="Motif du refus"
          placeholder="Ex : Écart de prix suspect sur le ciment, devis non justifié..."
          :error="decisionErrors.refusalReason"
          required
          :rows="3"
        />
      </div>
    </AppModal>

    <!-- Modale Enregistrement Paiement -->
    <AppModal
      v-model="isPaymentModalOpen"
      title="Enregistrer le paiement (Décaissement)"
      description="Le statut passera à Payé et déclenchera le suivi du délai de justification."
      icon="i-lucide-banknote"
      confirm-label="Valider le Paiement"
      :confirm-loading="actionLoading"
      @confirm="submitPayment"
    >
      <div v-if="actionError" class="p-3 rounded-lg bg-red-50 text-red-700 text-xs">
        {{ actionError }}
      </div>

      <div class="space-y-3">
        <AppInput
          v-model.number="paymentForm.amount"
          type="number"
          label="Montant payé (FCFA)"
          min="1"
          :error="paymentErrors.amount"
          required
        />

        <div class="grid grid-cols-2 gap-3">
          <div>
            <label class="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
              Mode de paiement
            </label>
            <select
              v-model="paymentForm.method"
              class="w-full px-3 py-2 text-xs rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-800 dark:text-slate-200"
            >
              <option value="Espèces">Espèces</option>
              <option value="Virement">Virement bancaire</option>
              <option value="Chèque">Chèque</option>
              <option value="Mobile Money">Mobile Money (Orange/MTN)</option>
              <option value="Autre">Autre</option>
            </select>
          </div>

          <AppDatePicker
            v-model="paymentForm.date"
            label="Date de paiement"
            :error="paymentErrors.date"
            required
          />
        </div>

        <AppInput
          v-model="paymentForm.reference"
          label="Référence / N° de reçu (facultatif)"
          placeholder="Ex: RECU-089 ou ID Transaction OM"
          :error="paymentErrors.reference"
        />
      </div>
    </AppModal>

    <!-- Modale Enregistrement Justification -->
    <AppModal
      v-model="isJustificationModalOpen"
      title="Enregistrer la justification des dépenses"
      description="Saisissez le montant effectivement dépensé sur factures pour calculer le reliquat."
      icon="i-lucide-receipt"
      confirm-label="Clôturer la Justification"
      :confirm-loading="actionLoading"
      @confirm="submitJustification"
    >
      <div v-if="actionError" class="p-3 rounded-lg bg-red-50 text-red-700 text-xs">
        {{ actionError }}
      </div>

      <div class="space-y-3">
        <AppInput
          v-model.number="justificationForm.amountSpent"
          type="number"
          label="Montant réellement dépensé (FCFA)"
          min="0"
          :error="justificationErrors.amountSpent"
          required
        />

        <!-- Calcul en direct du reliquat -->
        <div
          class="p-3 rounded-lg border text-xs"
          :class="[
            liveBalance > 0
              ? 'bg-emerald-50 text-emerald-800 border-emerald-200'
              : liveBalance === 0
                ? 'bg-slate-50 text-slate-800 border-slate-200'
                : 'bg-red-50 text-red-800 border-red-200'
          ]"
        >
          <div class="font-medium">
            {{ liveBalance > 0 ? 'Reliquat à restituer par l’employé :' : liveBalance === 0 ? 'Dépense exacte (aucun reliquat) :' : 'Dépassement de budget à la charge de l’employé :' }}
          </div>
          <div class="text-base font-bold mt-0.5">
            {{ formatFCFA(liveBalance) }}
          </div>
        </div>

        <AppDatePicker
          v-model="justificationForm.date"
          label="Date du bilan"
          :error="justificationErrors.date"
          required
        />

        <AppInput
          v-model="justificationForm.notes"
          type="textarea"
          label="Notes & Références factures"
          placeholder="Ex : Factures n°12 et 14 conformes, reliquat de 5 000 versé en caisse..."
          :error="justificationErrors.notes"
          :rows="2"
        />
      </div>
    </AppModal>

    <!-- Modale Scan Signé -->
    <AppModal
      v-model="isScanModalOpen"
      title="Joindre le scan de la lettre signée"
      description="Sélectionnez le document PDF ou l'image contresignée par l'employé, le patron et les témoins."
      icon="i-lucide-upload"
      confirm-label="Enregistrer le scan"
      :confirm-disabled="!scanFile"
      :confirm-loading="actionLoading"
      @confirm="submitScan"
    >
      <div v-if="actionError" class="p-3 rounded-lg bg-red-50 text-red-700 text-xs">
        {{ actionError }}
      </div>

      <div>
        <input
          type="file"
          accept="application/pdf,image/*"
          class="w-full text-xs"
          @change="onFileSelected"
        />
      </div>
    </AppModal>

    <!-- Modale Annulation -->
    <AppModal
      v-model="isCancelModalOpen"
      title="Annuler cet engagement"
      description="Cette action est irréversible et sera intégralement tracée dans le journal d'audit."
      icon="i-lucide-alert-octagon"
      confirm-label="Confirmer l'annulation"
      confirm-color="error"
      :confirm-disabled="!cancelForm.reason"
      :confirm-loading="actionLoading"
      @confirm="submitCancel"
    >
      <div class="space-y-3">
        <AppInput
          v-model="cancelForm.reason"
          type="textarea"
          label="Motif obligatoire de l'annulation"
          placeholder="Précisez la raison de l'annulation..."
          :error="cancelErrors.reason"
          required
          :rows="3"
        />
      </div>
    </AppModal>
  </div>
</template>
