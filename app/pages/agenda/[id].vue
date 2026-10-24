<script setup lang="ts">
interface DebtRecognition {
  id: string
  reference: string
  debtorName: string
  creditorName: string
  amount: number
  recognitionDate: string
  dueDate: string | null
  purpose: string
  notes: string
  status: 'BROUILLON' | 'VALIDEE' | 'JUSTIFIEE'
  createdByName: string
  validatedByName: string | null
  validatedAt: string | null
  justifiedByName: string | null
  justifiedAt: string | null
  signedDocumentFilename: string | null
  hasSignedDocument: boolean
  justificationFilename: string | null
  hasJustificationDocument: boolean
}

const route = useRoute()
const requestToast = useRequestToast()
const { isPatron } = useAuth()
const apiFile = useApiFile()
const signedInput = ref<HTMLInputElement | null>(null)
const justificationInput = ref<HTMLInputElement | null>(null)
const isValidating = ref(false)
const isUploading = ref(false)
const { data: recognition, pending, error, refresh } = await useApiData<DebtRecognition>(
  computed(() => `/api/debt-recognitions/${route.params.id}`),
  { key: 'debt-recognition-detail' }
)

const statusInfo = computed(() => {
  if (recognition.value?.status === 'VALIDEE') return { label: 'Validée', color: 'success' as const }
  if (recognition.value?.status === 'JUSTIFIEE') return { label: 'Justifiée', color: 'info' as const }
  return { label: 'Brouillon', color: 'warning' as const }
})

const formatDate = (value: string | null) => {
  if (!value) return 'Non définie'
  return new Date(`${value.slice(0, 10)}T00:00:00`).toLocaleDateString('fr-FR', {
    day: 'numeric',
    month: 'long',
    year: 'numeric'
  })
}

const formatAmount = (amount: number) => `${amount.toLocaleString('fr-FR')} FCFA`

const errorMessage = (error: unknown, fallback: string) => {
  if (error && typeof error === 'object' && 'data' in error
    && error.data && typeof error.data === 'object' && 'statusMessage' in error.data
    && typeof error.data.statusMessage === 'string') {
    return error.data.statusMessage
  }
  return error instanceof Error ? error.message : fallback
}

const openDocument = async (url: string) => {
  try {
    await apiFile.open(url)
  } catch (error: unknown) {
    requestToast.error(errorMessage(error, 'Impossible d’ouvrir ce document.'))
  }
}

const downloadDocument = async (url: string, filename: string) => {
  try {
    await apiFile.download(url, filename)
  } catch (error: unknown) {
    requestToast.error(errorMessage(error, 'Impossible de télécharger ce document.'))
  }
}

const pdfFilename = computed(() => `Reconnaissance_Dette_${recognition.value?.reference.replace(/[^a-zA-Z0-9_-]/g, '_') || 'document'}.pdf`)

const validateRecognition = async () => {
  if (!recognition.value) return
  isValidating.value = true
  try {
    await useApi().post(`/api/debt-recognitions/${recognition.value.id}/validate`)
    requestToast.success('La reconnaissance de dette est validée.')
    await refresh()
  } catch (cause: unknown) {
    requestToast.error(errorMessage(cause, 'Impossible de valider cette reconnaissance.'))
  } finally {
    isValidating.value = false
  }
}

const fileToDataUrl = (file: File) => new Promise<string>((resolve, reject) => {
  const reader = new FileReader()
  reader.onload = () => {
    if (typeof reader.result !== 'string') {
      reject(new Error('Impossible de lire le fichier sélectionné.'))
      return
    }
    resolve(reader.result)
  }
  reader.onerror = () => reject(reader.error || new Error('Impossible de lire le fichier sélectionné.'))
  reader.readAsDataURL(file)
})

const uploadDocument = async (kind: 'signed' | 'justification', event: Event) => {
  const input = event.target as HTMLInputElement
  const file = input.files?.[0]
  input.value = ''
  if (!file || !recognition.value) return
  if (file.size > 20 * 1024 * 1024) {
    requestToast.error('Le fichier doit peser moins de 20 Mo.')
    return
  }

  isUploading.value = true
  try {
    await useApi().post(`/api/debt-recognitions/${recognition.value.id}/files`, {
      kind,
      filename: file.name,
      base64: await fileToDataUrl(file)
    })
    requestToast.success(kind === 'signed'
      ? 'Le document signé a été enregistré.'
      : 'Le justificatif a été enregistré et la dette est maintenant justifiée.')
    await refresh()
  } catch (cause: unknown) {
    requestToast.error(errorMessage(cause, 'Impossible d’enregistrer le fichier.'))
  } finally {
    isUploading.value = false
  }
}

useHead(() => ({
  title: recognition.value
    ? `${recognition.value.reference} - Agenda des reconnaissances de dette`
    : 'Reconnaissance de dette'
}))
</script>

<template>
  <div class="mx-auto max-w-4xl space-y-5">
    <div class="flex flex-wrap items-center justify-between gap-3">
      <AppButton
        to="/agenda"
        label="Retour à l’agenda"
        variant="ghost"
        icon="i-lucide-arrow-left"
      />
      <AppBadge
        v-if="recognition"
        :label="statusInfo.label"
        :color="statusInfo.color"
      />
    </div>

    <AppCard
      v-if="pending"
      title="Chargement de la reconnaissance"
      icon="i-lucide-loader-circle"
    >
      <p class="text-sm text-slate-500">
        Veuillez patienter…
      </p>
    </AppCard>

    <AppCard
      v-else-if="error || !recognition"
      title="Reconnaissance introuvable"
      icon="i-lucide-circle-alert"
    >
      <p class="text-sm text-slate-600 dark:text-slate-300">
        {{ errorMessage(error, 'Cette reconnaissance de dette n’est pas disponible.') }}
      </p>
    </AppCard>

    <template v-else>
      <AppCard
        :title="recognition.reference"
        description="Détails, statut de validation et documents associés."
        icon="i-lucide-file-text"
      >
        <div class="grid gap-x-8 gap-y-5 sm:grid-cols-2">
          <div>
            <p class="text-xs font-medium text-slate-500">
              Débiteur
            </p>
            <p class="mt-1 font-semibold text-slate-900 dark:text-white">
              {{ recognition.debtorName }}
            </p>
          </div>
          <div>
            <p class="text-xs font-medium text-slate-500">
              Créancier
            </p>
            <p class="mt-1 font-semibold text-slate-900 dark:text-white">
              {{ recognition.creditorName }}
            </p>
          </div>
          <div>
            <p class="text-xs font-medium text-slate-500">
              Montant
            </p>
            <p class="mt-1 text-lg font-bold text-primary">
              {{ formatAmount(recognition.amount) }}
            </p>
          </div>
          <div>
            <p class="text-xs font-medium text-slate-500">
              Date de reconnaissance
            </p>
            <p class="mt-1 font-medium text-slate-900 dark:text-white">
              {{ formatDate(recognition.recognitionDate) }}
            </p>
          </div>
          <div>
            <p class="text-xs font-medium text-slate-500">
              Date d’échéance
            </p>
            <p class="mt-1 font-medium text-slate-900 dark:text-white">
              {{ formatDate(recognition.dueDate) }}
            </p>
          </div>
          <div>
            <p class="text-xs font-medium text-slate-500">
              Brouillon saisi par
            </p>
            <p class="mt-1 font-medium text-slate-900 dark:text-white">
              {{ recognition.createdByName }}
            </p>
          </div>
          <div class="sm:col-span-2">
            <p class="text-xs font-medium text-slate-500">
              Motif
            </p>
            <p class="mt-1 whitespace-pre-wrap text-sm text-slate-800 dark:text-slate-200">
              {{ recognition.purpose }}
            </p>
          </div>
          <div
            v-if="recognition.notes"
            class="sm:col-span-2"
          >
            <p class="text-xs font-medium text-slate-500">
              Observations
            </p>
            <p class="mt-1 whitespace-pre-wrap text-sm text-slate-800 dark:text-slate-200">
              {{ recognition.notes }}
            </p>
          </div>
          <div
            v-if="recognition.validatedAt"
            class="sm:col-span-2 rounded-lg bg-emerald-50 p-3 text-sm text-emerald-900 dark:bg-emerald-950/40 dark:text-emerald-200"
          >
            Validée par {{ recognition.validatedByName }} le {{ formatDate(recognition.validatedAt) }}.
          </div>
          <div
            v-if="recognition.justifiedAt"
            class="sm:col-span-2 rounded-lg bg-sky-50 p-3 text-sm text-sky-900 dark:bg-sky-950/40 dark:text-sky-200"
          >
            Justifiée par {{ recognition.justifiedByName }} le {{ formatDate(recognition.justifiedAt) }}.
          </div>
        </div>
      </AppCard>

      <AppCard
        title="Document de reconnaissance"
        description="Générez le document à signer, puis joignez le scan signé avant la validation du Patron."
        icon="i-lucide-file-signature"
      >
        <div class="flex flex-wrap gap-2">
          <AppButton
            label="Lire le document"
            icon="i-lucide-eye"
            variant="outline"
            @click="openDocument(`/api/debt-recognitions/${recognition.id}/pdf?inline=1`)"
          />
          <AppButton
            label="Télécharger le PDF"
            icon="i-lucide-download"
            variant="outline"
            @click="downloadDocument(`/api/debt-recognitions/${recognition.id}/pdf`, pdfFilename)"
          />
          <AppButton
            v-if="recognition.status === 'BROUILLON'"
            label="Joindre le scan signé"
            icon="i-lucide-upload"
            :loading="isUploading"
            @click="signedInput?.click()"
          />
          <AppButton
            v-if="recognition.hasSignedDocument"
            :label="`Lire : ${recognition.signedDocumentFilename}`"
            icon="i-lucide-file-search"
            variant="soft"
            @click="openDocument(`/api/debt-recognitions/${recognition.id}/files/signed`)"
          />
          <AppButton
            v-if="recognition.hasSignedDocument"
            label="Télécharger le scan"
            icon="i-lucide-download"
            variant="soft"
            @click="downloadDocument(`/api/debt-recognitions/${recognition.id}/files/signed`, recognition.signedDocumentFilename || 'scan-signe')"
          />
        </div>
        <input
          ref="signedInput"
          type="file"
          accept=".pdf,.jpg,.jpeg,.png,.webp,application/pdf,image/jpeg,image/png,image/webp"
          class="sr-only"
          aria-label="Sélectionner le scan signé"
          @change="uploadDocument('signed', $event)"
        >
        <p class="mt-3 text-xs text-slate-500">
          Formats acceptés : PDF, JPG, PNG ou WEBP. Taille maximale : 20 Mo.
        </p>
      </AppCard>

      <AppCard
        title="Validation et justificatif"
        description="La validation est réservée au Patron. Le justificatif peut être ajouté après validation."
        icon="i-lucide-shield-check"
      >
        <div class="flex flex-wrap items-center gap-2">
          <AppButton
            v-if="recognition.status === 'BROUILLON' && isPatron"
            label="Valider la reconnaissance"
            icon="i-lucide-check"
            :disabled="!recognition.hasSignedDocument"
            :loading="isValidating"
            @click="validateRecognition"
          />
          <p
            v-if="recognition.status === 'BROUILLON' && !recognition.hasSignedDocument"
            class="text-sm text-amber-700 dark:text-amber-300"
          >
            Joignez le document signé avant de pouvoir valider.
          </p>
          <AppButton
            v-if="recognition.status === 'VALIDEE'"
            label="Joindre le justificatif"
            icon="i-lucide-paperclip"
            :loading="isUploading"
            @click="justificationInput?.click()"
          />
          <AppButton
            v-if="recognition.hasJustificationDocument"
            :label="`Lire : ${recognition.justificationFilename}`"
            icon="i-lucide-eye"
            variant="outline"
            @click="openDocument(`/api/debt-recognitions/${recognition.id}/files/justification`)"
          />
          <AppButton
            v-if="recognition.hasJustificationDocument"
            label="Télécharger le justificatif"
            icon="i-lucide-download"
            variant="outline"
            @click="downloadDocument(`/api/debt-recognitions/${recognition.id}/files/justification`, recognition.justificationFilename || 'justificatif')"
          />
        </div>
        <input
          ref="justificationInput"
          type="file"
          accept=".pdf,.jpg,.jpeg,.png,.webp,application/pdf,image/jpeg,image/png,image/webp"
          class="sr-only"
          aria-label="Sélectionner le justificatif"
          @change="uploadDocument('justification', $event)"
        >
        <p
          v-if="recognition.status === 'JUSTIFIEE'"
          class="mt-3 text-sm text-emerald-700 dark:text-emerald-300"
        >
          Cette dette est justifiée. Les informations de la reconnaissance sont verrouillées.
        </p>
      </AppCard>
    </template>
  </div>
</template>
