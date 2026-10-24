<script setup lang="ts">
import { CreateDebtRecognitionSchema } from '~~/shared/schemas'

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
  hasSignedDocument: boolean
  hasJustificationDocument: boolean
}

interface CalendarDay {
  key: string
  day: number
  currentMonth: boolean
  count: number
}

const requestToast = useRequestToast()
const { data: recognitions, pending, refresh } = await useApiData<DebtRecognition[]>('/api/debt-recognitions', {
  key: 'debt-recognitions',
  default: () => []
})

const monthCursor = ref(new Date())
const selectedDate = ref(localDateKey(new Date()))
const isFormOpen = ref(false)
const isSaving = ref(false)
const editingId = ref<string | null>(null)

const emptyForm = () => ({
  debtorName: '',
  creditorName: '',
  amount: null as number | null,
  recognitionDate: selectedDate.value,
  dueDate: '',
  purpose: '',
  notes: ''
})
const form = reactive(emptyForm())

function localDateKey(date: Date) {
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`
}

const monthKey = computed(() => `${monthCursor.value.getFullYear()}-${String(monthCursor.value.getMonth() + 1).padStart(2, '0')}`)
const monthLabel = computed(() => monthCursor.value.toLocaleDateString('fr-FR', { month: 'long', year: 'numeric' }))
const recordsInMonth = computed(() => (recognitions.value || [])
  .filter(record => record.recognitionDate.slice(0, 7) === monthKey.value)
  .sort((a, b) => a.recognitionDate.localeCompare(b.recognitionDate)))
const recordsForSelectedDate = computed(() => (recognitions.value || [])
  .filter(record => record.recognitionDate.slice(0, 10) === selectedDate.value)
  .sort((a, b) => a.reference.localeCompare(b.reference)))

const calendarDays = computed<CalendarDay[]>(() => {
  const year = monthCursor.value.getFullYear()
  const month = monthCursor.value.getMonth()
  const firstDayOffset = (new Date(year, month, 1).getDay() + 6) % 7
  const firstVisibleDate = new Date(year, month, 1 - firstDayOffset)
  const counts = new Map<string, number>()

  for (const record of recognitions.value || []) {
    const key = record.recognitionDate.slice(0, 10)
    counts.set(key, (counts.get(key) || 0) + 1)
  }

  return Array.from({ length: 42 }, (_, index) => {
    const date = new Date(firstVisibleDate)
    date.setDate(firstVisibleDate.getDate() + index)
    const key = localDateKey(date)
    return {
      key,
      day: date.getDate(),
      currentMonth: date.getMonth() === month,
      count: counts.get(key) || 0
    }
  })
})

const selectedDateLabel = computed(() => new Date(`${selectedDate.value}T00:00:00`).toLocaleDateString('fr-FR', {
  weekday: 'long',
  day: 'numeric',
  month: 'long',
  year: 'numeric'
}))

const statusInfo = (status: DebtRecognition['status']) => {
  if (status === 'VALIDEE') return { label: 'Validée', color: 'success' as const }
  if (status === 'JUSTIFIEE') return { label: 'Justifiée', color: 'info' as const }
  return { label: 'Brouillon', color: 'warning' as const }
}

const formatDate = (value: string | null) => {
  if (!value) return 'Non définie'
  return new Date(`${value.slice(0, 10)}T00:00:00`).toLocaleDateString('fr-FR')
}

const moveMonth = (offset: number) => {
  monthCursor.value = new Date(monthCursor.value.getFullYear(), monthCursor.value.getMonth() + offset, 1)
}

const openNewForm = () => {
  editingId.value = null
  Object.assign(form, emptyForm(), { recognitionDate: selectedDate.value })
  isFormOpen.value = true
}

const openEditForm = (record: DebtRecognition) => {
  editingId.value = record.id
  Object.assign(form, {
    debtorName: record.debtorName,
    creditorName: record.creditorName,
    amount: record.amount,
    recognitionDate: record.recognitionDate.slice(0, 10),
    dueDate: record.dueDate?.slice(0, 10) || '',
    purpose: record.purpose,
    notes: record.notes || ''
  })
  isFormOpen.value = true
}

const saveRecognition = async () => {
  const validation = CreateDebtRecognitionSchema.safeParse({
    ...form,
    amount: Number(form.amount)
  })
  if (!validation.success) {
    requestToast.error(validation.error.errors[0]?.message || 'Vérifiez les informations saisies.')
    return
  }

  isSaving.value = true
  try {
    if (editingId.value) {
      await useApi().put(`/api/debt-recognitions/${editingId.value}`, validation.data)
      requestToast.success('Le brouillon a été mis à jour.')
    } else {
      await useApi().post('/api/debt-recognitions', validation.data)
      requestToast.success('La reconnaissance de dette a été enregistrée en brouillon.')
    }
    isFormOpen.value = false
    await refresh()
  } catch (error: unknown) {
    const message = error && typeof error === 'object' && 'data' in error
      && error.data && typeof error.data === 'object' && 'statusMessage' in error.data
      && typeof error.data.statusMessage === 'string'
      ? error.data.statusMessage
      : error instanceof Error ? error.message : 'Impossible d’enregistrer la reconnaissance de dette.'
    requestToast.error(message)
  } finally {
    isSaving.value = false
  }
}

useHead({ title: 'Agenda du Patron - Reconnaissances de dette' })
</script>

<template>
  <div class="mx-auto max-w-7xl space-y-6">
    <header class="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
      <div>
        <p class="mb-1 text-xs font-semibold uppercase tracking-wide text-primary">
          Agenda du Patron
        </p>
        <h1 class="text-2xl font-bold tracking-tight text-slate-900 dark:text-white">
          Reconnaissances de dette
        </h1>
        <p class="mt-1 max-w-2xl text-sm text-slate-500 dark:text-slate-400">
          Saisissez les brouillons avec l’aide du Secrétaire. Seul le Patron peut les valider.
        </p>
      </div>
      <AppButton
        label="Nouvelle reconnaissance"
        icon="i-lucide-plus"
        @click="openNewForm"
      />
    </header>

    <div class="grid gap-5 xl:grid-cols-[minmax(0,1.35fr)_minmax(340px,0.85fr)]">
      <AppCard
        title="Calendrier"
        description="Sélectionnez une date pour afficher les reconnaissances prévues."
        icon="i-lucide-calendar-days"
      >
        <div class="mb-4 flex items-center justify-between">
          <AppButton
            icon="i-lucide-chevron-left"
            variant="ghost"
            aria-label="Mois précédent"
            @click="moveMonth(-1)"
          />
          <h2 class="text-sm font-bold capitalize text-slate-800 dark:text-slate-200">
            {{ monthLabel }}
          </h2>
          <AppButton
            icon="i-lucide-chevron-right"
            variant="ghost"
            aria-label="Mois suivant"
            @click="moveMonth(1)"
          />
        </div>

        <div class="grid grid-cols-7 gap-1 text-center">
          <div
            v-for="weekday in ['Lun', 'Mar', 'Mer', 'Jeu', 'Ven', 'Sam', 'Dim']"
            :key="weekday"
            class="pb-2 text-[11px] font-semibold text-slate-400"
          >
            {{ weekday }}
          </div>
          <AppButton
            v-for="day in calendarDays"
            :key="day.key"
            :label="String(day.day)"
            variant="ghost"
            :title="`${day.key}${day.count ? ` — ${day.count} reconnaissance(s)` : ''}`"
            :class="[
              '!h-12 !w-full !flex-col !gap-0 rounded-lg',
              !day.currentMonth ? 'opacity-35' : '',
              selectedDate === day.key ? 'bg-primary/10 text-primary ring-1 ring-primary/40' : ''
            ]"
            @click="selectedDate = day.key"
          >
            <span>{{ day.day }}</span>
            <span
              v-if="day.count"
              class="mt-0.5 size-1 rounded-full bg-primary"
            />
          </AppButton>
        </div>
        <div class="mt-4 flex items-center justify-between border-t border-slate-100 pt-3 text-xs dark:border-slate-800">
          <span class="text-slate-500">{{ recordsInMonth.length }} reconnaissance(s) ce mois</span>
          <AppButton
            label="Aujourd’hui"
            variant="outline"
            size="xs"
            @click="selectedDate = localDateKey(new Date()); monthCursor = new Date()"
          />
        </div>
      </AppCard>

      <AppCard
        :title="`Agenda du ${selectedDateLabel}`"
        :description="pending ? 'Chargement des reconnaissances…' : `${recordsForSelectedDate.length} élément(s) pour cette date`"
        icon="i-lucide-list-checks"
        body-class="space-y-3"
      >
        <div
          v-if="!recordsForSelectedDate.length"
          class="rounded-lg border border-dashed border-slate-200 p-6 text-center text-sm text-slate-500 dark:border-slate-700"
        >
          Aucune reconnaissance de dette à cette date.
        </div>

        <article
          v-for="record in recordsForSelectedDate"
          :key="record.id"
          class="rounded-lg border border-slate-200 p-3 dark:border-slate-700"
        >
          <div class="flex items-start justify-between gap-3">
            <div class="min-w-0">
              <NuxtLink
                :to="`/agenda/${record.id}`"
                class="font-semibold text-primary hover:underline"
              >
                {{ record.reference }}
              </NuxtLink>
              <p class="mt-1 truncate text-sm text-slate-800 dark:text-slate-200">
                {{ record.debtorName }} → {{ record.creditorName }}
              </p>
            </div>
            <AppBadge
              :label="statusInfo(record.status).label"
              :color="statusInfo(record.status).color"
              size="xs"
            />
          </div>
          <div class="mt-2 flex items-center justify-between gap-3 text-xs text-slate-500">
            <span>{{ record.amount.toLocaleString('fr-FR') }} FCFA</span>
            <span>Échéance : {{ formatDate(record.dueDate) }}</span>
          </div>
          <div class="mt-3 flex justify-end gap-2">
            <AppButton
              :to="`/agenda/${record.id}`"
              label="Lire"
              variant="outline"
              size="xs"
              icon="i-lucide-eye"
            />
            <AppButton
              v-if="record.status === 'BROUILLON'"
              label="Modifier"
              variant="ghost"
              size="xs"
              icon="i-lucide-pencil"
              @click="openEditForm(record)"
            />
          </div>
        </article>
      </AppCard>
    </div>

    <AppCard
      title="Reconnaissances du mois"
      :description="`${recordsInMonth.length} enregistrement(s) classé(s) par date`"
      icon="i-lucide-calendar-range"
    >
      <div
        v-if="!recordsInMonth.length"
        class="py-8 text-center text-sm text-slate-500"
      >
        Aucune reconnaissance enregistrée pour ce mois.
      </div>
      <div
        v-else
        class="divide-y divide-slate-100 dark:divide-slate-800"
      >
        <button
          v-for="record in recordsInMonth"
          :key="record.id"
          type="button"
          class="flex w-full items-center justify-between gap-3 py-3 text-left hover:bg-slate-50 dark:hover:bg-slate-800/50"
          @click="selectedDate = record.recognitionDate.slice(0, 10)"
        >
          <span class="min-w-0">
            <span class="block truncate text-sm font-semibold text-slate-800 dark:text-slate-200">
              {{ record.reference }} · {{ record.debtorName }}
            </span>
            <span class="mt-0.5 block truncate text-xs text-slate-500">
              {{ formatDate(record.recognitionDate) }} · {{ record.purpose }}
            </span>
          </span>
          <span class="shrink-0 text-sm font-semibold text-slate-700 dark:text-slate-300">
            {{ record.amount.toLocaleString('fr-FR') }} FCFA
          </span>
        </button>
      </div>
    </AppCard>

    <AppModal
      v-model="isFormOpen"
      :title="editingId ? 'Modifier le brouillon' : 'Nouvelle reconnaissance de dette'"
      description="Le Secrétaire peut préparer les informations. Seul le Patron valide la reconnaissance."
      icon="i-lucide-file-pen-line"
      :confirm-label="editingId ? 'Enregistrer les modifications' : 'Enregistrer le brouillon'"
      :confirm-loading="isSaving"
      @confirm="saveRecognition"
    >
      <form
        class="grid gap-3 sm:grid-cols-2"
        @submit.prevent="saveRecognition"
      >
        <AppInput
          v-model="form.debtorName"
          label="Débiteur"
          placeholder="Nom complet"
          required
        />
        <AppInput
          v-model="form.creditorName"
          label="Créancier"
          placeholder="Nom complet ou entreprise"
          required
        />
        <AppInput
          v-model="form.amount"
          label="Montant dû (FCFA)"
          type="number"
          min="1"
          step="1"
          required
        />
        <AppDatePicker
          v-model="form.recognitionDate"
          label="Date de reconnaissance"
          required
        />
        <AppDatePicker
          v-model="form.dueDate"
          label="Date d’échéance (facultative)"
          clearable
        />
        <AppInput
          v-model="form.purpose"
          label="Motif de la dette"
          placeholder="Décrire l’origine de la dette"
          required
        />
        <AppInput
          v-model="form.notes"
          type="textarea"
          label="Observations"
          placeholder="Informations complémentaires"
          class="sm:col-span-2"
        />
      </form>
    </AppModal>
  </div>
</template>
