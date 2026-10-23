<script setup lang="ts">
import { formatFCFA } from '~~/shared/currency'

const route = useRoute()
const commitmentId = route.params.id as string

const { data: commitment } = await useFetch(`/api/commitments/${commitmentId}`)

useHead({
  title: computed(() => commitment.value ? `Lettre d'Engagement ${commitment.value.letterNumber}` : 'Lettre d’Engagement')
})

const letterRef = ref<HTMLElement | null>(null)
const { downloadingId, downloadCommitmentPdf } = usePdfDownload()

const printDocument = () => {
  window.print()
}

const downloadPdf = async () => {
  if (!commitment.value) return
  await downloadCommitmentPdf(commitment.value.id, commitment.value.letterNumber)
}

const formattedDate = computed(() => {
  if (!commitment.value?.date) return ''
  return new Date(commitment.value.date).toLocaleDateString('fr-FR', {
    day: 'numeric',
    month: 'long',
    year: 'numeric'
  })
})

const effectiveAmount = computed(() => {
  if (!commitment.value) return 0
  return commitment.value.amountApproved > 0 ? commitment.value.amountApproved : commitment.value.amountRequested
})

const accordSoussigne = computed(() => {
  if (!commitment.value?.workerSnapshot) return 'soussigné'
  const civ = commitment.value.workerSnapshot.civility
  return civ === 'Mme' || civ === 'Mlle' ? 'soussignée' : 'soussigné'
})

const commitmentType = computed(() => commitment.value?.type || 'MATERIEL')

const docTitle = computed(() => {
  switch (commitmentType.value) {
    case 'PRET':
      return 'Reconnaissance de Dette & Engagement de Remboursement'
    case 'SALAIRE':
      return 'Décharge de Paiement de Salaire & Rémunération'
    case 'AUTRE':
      return "Lettre d'Engagement & de Décharge Financière"
    default:
      return "Lettre d'Engagement & d'Achat de Matériel"
  }
})

const motifIntro = computed(() => {
  switch (commitmentType.value) {
    case 'PRET':
      return 'octroyée par la direction à titre d’avance remboursable / prêt d’honneur pour :'
    case 'SALAIRE':
      return 'versée par la direction au titre de la rémunération / salaire des prestations pour :'
    case 'AUTRE':
      return 'mise à disposition par la direction pour l’opération suivante :'
    default:
      return 'remise par la direction pour le motif exclusif d’achat et d’acquisition :'
  }
})

const hasItems = computed(() => {
  return Array.isArray(commitment.value?.items) && commitment.value.items.length > 0
})
</script>

<template>
  <div v-if="commitment" class="bg-slate-100 min-h-screen py-6 print:py-0 print:bg-white text-slate-900">
    <!-- Barre de contrôle à l'écran (masquée à l'impression) -->
    <div class="no-print max-w-4xl mx-auto mb-6 px-4 flex flex-col sm:flex-row items-center justify-between gap-4">
      <AppButton
        :to="`/engagements/${commitment.id}`"
        variant="outline"
        size="sm"
        icon="i-lucide-arrow-left"
        label="Retour au dossier"
      />

      <div class="flex items-center gap-2.5">
        <AppButton
          variant="primary"
          size="sm"
          icon="i-lucide-download"
          label="Télécharger en PDF"
          :loading="downloadingId === commitment.id"
          @click="downloadPdf"
        />

        <AppButton
          variant="outline"
          size="sm"
          icon="i-lucide-printer"
          label="Imprimer (Ctrl + P)"
          @click="printDocument"
        />
      </div>
    </div>

    <!-- Feuille A4 Physique -->
    <div
      ref="letterRef"
      id="letter-document"
      class="max-w-4xl mx-auto bg-white p-8 sm:p-12 shadow-md print:shadow-none print:p-0 border border-slate-200 print:border-none rounded-xl print:rounded-none font-sans text-black leading-relaxed"
    >
      <!-- En-tête officiel du document -->
      <div class="flex items-start justify-between border-b-2 border-black pb-4 mb-6">
        <div>
          <div class="text-xs font-bold uppercase tracking-wider text-slate-700">
            Établissements & Direction Générale
          </div>
          <div class="text-lg font-extrabold uppercase tracking-tight text-black mt-0.5">
            {{ commitment.settings.patronName }}
          </div>
          <div class="text-xs text-slate-600">
            {{ commitment.settings.patronAddress }} • Tél : {{ commitment.settings.patronPhone }}
          </div>
        </div>

        <div class="text-right">
          <div class="inline-block px-3 py-1 bg-slate-100 border border-slate-300 rounded font-mono text-xs font-bold">
            RÉF : {{ commitment.letterNumber }}
          </div>
          <div class="text-[11px] text-slate-500 mt-1">
            Date : {{ formattedDate }} • Ville : {{ commitment.city }}
          </div>
        </div>
      </div>

      <!-- Titre principal encadré -->
      <div class="text-center my-6">
        <h1 class="text-lg sm:text-xl font-black uppercase tracking-wide border-2 border-black py-2.5 px-6 inline-block rounded-xs shadow-xs">
          {{ docTitle }}
        </h1>
      </div>

      <!-- Paragraphe 1 : Reconnaissance de réception des fonds (Justifié) -->
      <div class="space-y-3 mb-6 text-sm sm:text-[15px] leading-relaxed text-justify [text-justify:inter-word]">
        <p>
          Je {{ accordSoussigne }} <strong>{{ commitment.workerSnapshot.civility }} {{ commitment.workerSnapshot.fullName }}</strong>,
          titulaire de la CNI n° <strong>{{ commitment.workerSnapshot.cniMasked }}</strong>,
          joignable au <strong>{{ commitment.workerSnapshot.phoneMasked }}</strong>,
          reconnais expressément avoir reçu de la direction (<strong>{{ commitment.settings.patronCivility }} {{ commitment.settings.patronName }}</strong>) la somme arrêtée à :
        </p>

        <!-- Encadré Montant Chiffres & Lettres -->
        <div class="bg-slate-50 border-l-4 border-black p-3.5 my-3 text-sm">
          <div class="text-xl font-black text-black">
            {{ formatFCFA(effectiveAmount) }}
          </div>
          <div class="text-xs sm:text-sm font-semibold italic text-slate-800 mt-0.5">
            (En toutes lettres : {{ commitment.amountInWords }})
          </div>
        </div>

        <p>
          {{ motifIntro }}
        </p>

        <p class="font-bold bg-slate-50 p-3 rounded border border-slate-300 text-sm sm:text-[14px]">
          « {{ commitment.purpose }} »
        </p>
      </div>

      <!-- Section Détail : Tableau d'articles OU Encadré Synthétique -->
      <div class="my-6">
        <!-- Cas avec liste d'articles (MATERIEL ou autre avec panier) -->
        <div v-if="hasItems">
          <div class="text-xs font-bold uppercase tracking-wider mb-2 text-slate-800">
            Détail des achats et fournitures autorisés :
          </div>

          <table class="w-full text-left text-xs border-collapse border border-black">
            <thead>
              <tr class="bg-slate-100 border-b border-black text-black font-bold">
                <th class="border border-black py-2 px-3 text-center w-8">N°</th>
                <th class="border border-black py-2 px-3 whitespace-nowrap">Désignation de l'article</th>
                <th class="border border-black py-2 px-3 text-center w-16">Unité</th>
                <th class="border border-black py-2 px-3 text-right w-16">Quantité</th>
                <th class="border border-black py-2 px-3 text-right w-28">Prix Unit. (FCFA)</th>
                <th class="border border-black py-2 px-3 text-right w-32">Total (FCFA)</th>
              </tr>
            </thead>
            <tbody>
              <tr v-for="(item, idx) in commitment.items" :key="idx" class="border-b border-slate-300">
                <td class="border border-black py-1.5 px-3 text-center">{{ idx + 1 }}</td>
                <td class="border border-black py-1.5 px-3 font-medium whitespace-nowrap">{{ item.name }}</td>
                <td class="border border-black py-1.5 px-3 text-center">{{ item.unit }}</td>
                <td class="border border-black py-1.5 px-3 text-right font-medium">{{ item.quantity }}</td>
                <td class="border border-black py-1.5 px-3 text-right">{{ formatFCFA(item.unitPriceDeclared).replace(' FCFA', '') }}</td>
                <td class="border border-black py-1.5 px-3 text-right font-bold">{{ formatFCFA(item.totalPriceDeclared).replace(' FCFA', '') }}</td>
              </tr>
            </tbody>
            <tfoot>
              <tr class="bg-slate-100 font-bold border-t border-black">
                <td colspan="5" class="border border-black py-2 px-3 text-right uppercase">
                  Montant total autorisé :
                </td>
                <td class="border border-black py-2 px-3 text-right font-extrabold text-sm">
                  {{ formatFCFA(effectiveAmount) }}
                </td>
              </tr>
            </tfoot>
          </table>
        </div>

        <!-- Cas sans articles : Encadré synthétique et aéré de l'opération -->
        <div v-else class="bg-slate-50 border border-slate-300 rounded p-4 text-xs sm:text-sm text-justify [text-justify:inter-word] leading-relaxed">
          <div class="text-xs font-bold uppercase tracking-wider mb-1.5 text-slate-800">
            Modalités et cadre financier de l'opération :
          </div>
          <p v-if="commitmentType === 'PRET'" class="text-slate-800">
            Fonds alloués à titre de <strong>prêt d'argent / avance remboursable</strong> d'un montant net de <strong>{{ formatFCFA(effectiveAmount) }}</strong>. L'employé s'engage expressément au remboursement selon les modalités, échéances ou retenues sur salaire convenues d'un commun accord avec la direction.
          </p>
          <p v-else-if="commitmentType === 'SALAIRE'" class="text-slate-800">
            Règlement financier d'un montant de <strong>{{ formatFCFA(effectiveAmount) }}</strong> effectué au titre de la <strong>rémunération du travail</strong> pour les prestations et la période convenues. La perception de ces fonds confère à la direction pleine décharge et quittance libératoire.
          </p>
          <p v-else class="text-slate-800">
            Fonds mis à disposition pour un montant total de <strong>{{ formatFCFA(effectiveAmount) }}</strong> au titre des dépenses et frais généraux mentionnés au motif, sous réserve de production des pièces justificatives correspondantes.
          </p>
        </div>
      </div>

      <!-- Clauses juridiques adaptées et strictement justifiées -->
      <div class="my-6 text-justify [text-justify:inter-word] text-xs sm:text-[13px] leading-relaxed">
        <!-- Clauses PRET -->
        <template v-if="commitmentType === 'PRET'">
          <p class="font-bold uppercase tracking-wider text-slate-800 mb-2">
            Conditions & Engagements de Remboursement du Prêt :
          </p>
          <ol class="list-decimal list-inside space-y-1.5 pl-1 text-slate-900">
            <li>
              <strong>Reconnaissance expresse :</strong> Je reconnais formellement avoir reçu à titre de prêt d'honneur ou avance financière remboursable la somme mentionnée ci-dessus accordée par la direction.
            </li>
            <li>
              <strong>Modalités de remboursement :</strong> Je m'engage expressément à restituer l'intégralité de cette somme selon les échéances et modalités convenues avec la direction, ou par retenue directe autorisée sur mes émoluments.
            </li>
            <li>
              <strong>Priorité d'apurement :</strong> Je reconnais qu'aucune autre facilité de caisse ou nouveau prêt ne pourra m'être consenti avant l'apurement intégral et effectif de la présente créance.
            </li>
            <li>
              <strong>Exigibilité immédiate :</strong> En cas de défaillance, de litige ou de cessation d'activité pour quelque motif que ce soit, le solde restant dû devient immédiatement exigible dans son intégralité.
            </li>
          </ol>
        </template>

        <!-- Clauses SALAIRE -->
        <template v-else-if="commitmentType === 'SALAIRE'">
          <p class="font-bold uppercase tracking-wider text-slate-800 mb-2">
            Attestation de Perception & Décharge Libératoire :
          </p>
          <ol class="list-decimal list-inside space-y-1.5 pl-1 text-slate-900">
            <li>
              <strong>Perception effective :</strong> Je reconnais avoir perçu l'intégralité de la somme susmentionnée au titre de mon salaire, avance ou rémunération pour les prestations et périodes convenues.
            </li>
            <li>
              <strong>Décharge complète :</strong> Par la présente signature, j'accorde à la direction pleine et entière décharge financière, ce versement valant quittance libératoire pour ladite période.
            </li>
            <li>
              <strong>Conformité des prestations :</strong> J'atteste que les travaux, heures et tâches ayant motivé ce règlement ont été fidèlement exécutés conformément aux accords et directives reçues.
            </li>
            <li>
              <strong>Engagement professionnel :</strong> Je m'engage à continuer d'exercer mes fonctions avec probité, assiduité et dans le respect strict des intérêts et de la confidentialité de l'établissement.
            </li>
          </ol>
        </template>

        <!-- Clauses AUTRE -->
        <template v-else-if="commitmentType === 'AUTRE'">
          <p class="font-bold uppercase tracking-wider text-slate-800 mb-2">
            Engagements & Conditions d'Utilisation des Fonds :
          </p>
          <ol class="list-decimal list-inside space-y-1.5 pl-1 text-slate-900">
            <li>
              <strong>Affectation exclusive :</strong> La somme allouée est strictement réservée à la réalisation du motif approuvé ci-dessus. Tout usage détourné à d'autres fins personnelles est formellement interdit.
            </li>
            <li>
              <strong>Justification intégrale :</strong> Je m'engage à produire l'ensemble des reçus réguliers, factures et pièces probantes dans un délai maximal de <strong>{{ commitment.settings.justificationDelayDays || 7 }} jours ouvrés</strong> à compter de la réception des fonds.
            </li>
            <li>
              <strong>Restitution du reliquat :</strong> Tout reliquat budgétaire non dépensé doit être intégralement et immédiatement reversé en caisse dès la présentation du décompte justificatif.
            </li>
            <li>
              <strong>Responsabilité civile et pénale :</strong> En cas de non-justification, perte injustifiée ou détournement, j'en réponds personnellement et autorise toute retenue compensatoire sur mes droits.
            </li>
          </ol>
        </template>

        <!-- Clauses MATERIEL (Défaut) -->
        <template v-else>
          <p class="font-bold uppercase tracking-wider text-slate-800 mb-2">
            Engagements Stricts de l'Employé :
          </p>
          <ol class="list-decimal list-inside space-y-1.5 pl-1 text-slate-900">
            <li>
              <strong>Affectation exclusive :</strong> La somme allouée est destinée exclusivement à l'acquisition des fournitures et articles autorisés ci-dessus. Tout usage détourné à d'autres fins personnelles ou non conformes est formellement prohibé.
            </li>
            <li>
              <strong>Justificatifs et Factures :</strong> Je m'engage à fournir l'intégralité des factures régulières, reçus et décharges dans un délai impératif de <strong>{{ commitment.settings.justificationDelayDays || 7 }} jours ouvrés</strong> à compter de la réception des fonds.
            </li>
            <li>
              <strong>Restitution du Reliquat :</strong> Tout reliquat budgétaire non dépensé doit être intégralement et immédiatement restitué en caisse à la présentation du bilan justificatif.
            </li>
            <li>
              <strong>Responsabilité :</strong> En cas de perte, détournement, absence de justificatifs ou dépassement non autorisé, j'en réponds personnellement sur le plan civil et pénal, et autorise toute retenue légale.
            </li>
          </ol>
        </template>
      </div>

      <!-- Fait à ... le ... -->
      <div class="flex justify-end my-4 text-xs sm:text-sm font-semibold">
        <p>
          Fait à <u>{{ commitment.city }}</u>, le <u>{{ formattedDate }}</u>
        </p>
      </div>

      <!-- Bloc des Signatures garanti sans coupure de page -->
      <div class="page-break-inside-avoid mt-8 pt-4 border-t-2 border-black">
        <div class="text-xs font-bold uppercase tracking-wider text-center mb-4">
          Bloc des Signatures & Décharge Formelle
        </div>

        <div class="grid grid-cols-2 sm:grid-cols-4 gap-4 text-xs">
          <!-- Signature Employé -->
          <div class="border border-black p-3 flex flex-col justify-between min-h-[140px] rounded-xs bg-white">
            <div>
              <div class="font-bold text-center uppercase border-b border-black pb-1 mb-1">
                L'Employé
              </div>
              <div class="text-[11px] text-center italic text-slate-500 mb-1">
                Mention "Lu et approuvé"
              </div>
              <div class="font-semibold text-slate-900 whitespace-nowrap truncate text-center">
                {{ commitment.workerSnapshot.civility }} {{ commitment.workerSnapshot.fullName }}
              </div>
            </div>
            <div class="border-t border-dashed border-slate-400 pt-1 text-[10px] text-center text-slate-400">
              Signature & Date
            </div>
          </div>

          <!-- Signature Patron -->
          <div class="border border-black p-3 flex flex-col justify-between min-h-[140px] rounded-xs bg-slate-50/50">
            <div>
              <div class="font-bold text-center uppercase border-b border-black pb-1 mb-1">
                La Direction
              </div>
              <div class="text-[11px] text-center text-slate-600 mb-1">
                Bon pour accord
              </div>
              <div class="font-semibold text-slate-900 truncate text-center">
                {{ commitment.settings.patronName }}
              </div>
            </div>
            <div class="border-t border-dashed border-slate-400 pt-1 text-[10px] text-center text-slate-400">
              Signature & Cachet
            </div>
          </div>

          <!-- Signature Témoin 1 -->
          <div class="border border-black p-3 flex flex-col justify-between min-h-[140px] rounded-xs bg-white">
            <div>
              <div class="font-bold text-center uppercase border-b border-black pb-1 mb-1">
                Témoin 1
              </div>
              <div class="font-semibold text-slate-900 whitespace-nowrap truncate text-center">
                {{ commitment.witnesses?.[0]?.fullName || 'Nom & Prénom' }}
              </div>
              <div class="text-[10px] text-slate-500 text-center">
                CNI : {{ commitment.witnesses?.[0]?.cniMasked || '•••• ••••' }}
              </div>
            </div>
            <div class="border-t border-dashed border-slate-400 pt-1 text-[10px] text-center text-slate-400">
              Signature
            </div>
          </div>

          <!-- Signature Témoin 2 -->
          <div class="border border-black p-3 flex flex-col justify-between min-h-[140px] rounded-xs bg-white">
            <div>
              <div class="font-bold text-center uppercase border-b border-black pb-1 mb-1">
                Témoin 2
              </div>
              <div class="font-semibold text-slate-900 whitespace-nowrap truncate text-center">
                {{ commitment.witnesses?.[1]?.fullName || 'Nom & Prénom' }}
              </div>
              <div class="text-[10px] text-slate-500 text-center">
                CNI : {{ commitment.witnesses?.[1]?.cniMasked || '•••• ••••' }}
              </div>
            </div>
            <div class="border-t border-dashed border-slate-400 pt-1 text-[10px] text-center text-slate-400">
              Signature
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>
