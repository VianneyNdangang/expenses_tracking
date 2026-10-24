<script setup lang="ts">
interface Props {
  modelValue?: string | Date | null
  label?: string
  placeholder?: string
  error?: string | boolean
  help?: string
  required?: boolean
  disabled?: boolean
  clearable?: boolean
  min?: string
  max?: string
  size?: 'xs' | 'sm' | 'md' | 'lg'
}

const props = withDefaults(defineProps<Props>(), {
  modelValue: '',
  placeholder: 'Sélectionner une date...',
  error: false,
  required: false,
  disabled: false,
  clearable: true,
  size: 'sm'
})

const emit = defineEmits<{
  'update:modelValue': [value: string]
  'change': [value: string]
}>()

const isOpen = ref(false)

// Conversion en chaîne YYYY-MM-DD normalisée
const normalizedValue = computed(() => {
  if (!props.modelValue) return ''
  if (props.modelValue instanceof Date) {
    return props.modelValue.toISOString().split('T')[0]
  }
  return String(props.modelValue).split('T')[0]
})

// Affichage texte formaté en français
const formattedDateText = computed(() => {
  if (!normalizedValue.value) return ''
  const parts = normalizedValue.value.split('-')
  if (parts.length !== 3) return normalizedValue.value
  const [yearPart, monthPart, dayPart] = parts
  if (!yearPart || !monthPart || !dayPart) return normalizedValue.value
  const year = parseInt(yearPart, 10)
  const month = parseInt(monthPart, 10) - 1
  const day = parseInt(dayPart, 10)
  const d = new Date(year, month, day)
  if (isNaN(d.getTime())) return normalizedValue.value
  return d.toLocaleDateString('fr-FR', {
    day: 'numeric',
    month: 'short',
    year: 'numeric'
  })
})

// Navigation interne dans le calendrier
const viewDate = ref(new Date())

// Initialise le calendrier sur la date sélectionnée lors de l'ouverture
watch(
  isOpen,
  (open) => {
    if (open) {
      if (normalizedValue.value) {
        const parts = normalizedValue.value.split('-')
        const [yearPart, monthPart, dayPart] = parts
        if (parts.length === 3 && yearPart && monthPart && dayPart) {
          viewDate.value = new Date(parseInt(yearPart, 10), parseInt(monthPart, 10) - 1, 1)
          return
        }
      }
      viewDate.value = new Date()
    }
  },
  { immediate: true }
)

const viewYear = computed(() => viewDate.value.getFullYear())
const viewMonth = computed(() => viewDate.value.getMonth())

const monthNames = [
  'Janvier', 'Février', 'Mars', 'Avril', 'Mai', 'Juin',
  'Juillet', 'Août', 'Septembre', 'Octobre', 'Novembre', 'Décembre'
]

const weekDays = ['Lu', 'Ma', 'Me', 'Je', 'Ve', 'Sa', 'Di']

const currentMonthName = computed(() => monthNames[viewMonth.value])

const prevMonth = () => {
  viewDate.value = new Date(viewYear.value, viewMonth.value - 1, 1)
}

const nextMonth = () => {
  viewDate.value = new Date(viewYear.value, viewMonth.value + 1, 1)
}

interface CalendarDay {
  dayNumber: number
  dateString: string
  isCurrentMonth: boolean
  isToday: boolean
  isSelected: boolean
  isDisabled: boolean
}

// Calcul de la matrice des 35 ou 42 jours du calendrier
const calendarDays = computed(() => {
  const days: CalendarDay[] = []
  const todayStr = new Date().toISOString().split('T')[0]

  const firstDayOfMonth = new Date(viewYear.value, viewMonth.value, 1)
  const lastDayOfMonth = new Date(viewYear.value, viewMonth.value + 1, 0)
  const totalDaysInMonth = lastDayOfMonth.getDate()

  // Décalage pour commencer le Lundi (Lundi = 0, Dimanche = 6)
  let startDayOfWeek = firstDayOfMonth.getDay() - 1
  if (startDayOfWeek === -1) startDayOfWeek = 6

  // Jours du mois précédent
  const prevMonthLastDay = new Date(viewYear.value, viewMonth.value, 0).getDate()
  for (let i = startDayOfWeek - 1; i >= 0; i--) {
    const d = prevMonthLastDay - i
    const m = viewMonth.value === 0 ? 12 : viewMonth.value
    const y = viewMonth.value === 0 ? viewYear.value - 1 : viewYear.value
    const dateStr = `${y}-${String(m).padStart(2, '0')}-${String(d).padStart(2, '0')}`
    days.push({
      dayNumber: d,
      dateString: dateStr,
      isCurrentMonth: false,
      isToday: dateStr === todayStr,
      isSelected: dateStr === normalizedValue.value,
      isDisabled: isDateDisabled(dateStr)
    })
  }

  // Jours du mois en cours
  for (let d = 1; d <= totalDaysInMonth; d++) {
    const m = viewMonth.value + 1
    const y = viewYear.value
    const dateStr = `${y}-${String(m).padStart(2, '0')}-${String(d).padStart(2, '0')}`
    days.push({
      dayNumber: d,
      dateString: dateStr,
      isCurrentMonth: true,
      isToday: dateStr === todayStr,
      isSelected: dateStr === normalizedValue.value,
      isDisabled: isDateDisabled(dateStr)
    })
  }

  // Jours du mois suivant pour compléter les 6 semaines (42 cellules)
  const remaining = 42 - days.length
  for (let d = 1; d <= remaining; d++) {
    const m = viewMonth.value === 11 ? 1 : viewMonth.value + 2
    const y = viewMonth.value === 11 ? viewYear.value + 1 : viewYear.value
    const dateStr = `${y}-${String(m).padStart(2, '0')}-${String(d).padStart(2, '0')}`
    days.push({
      dayNumber: d,
      dateString: dateStr,
      isCurrentMonth: false,
      isToday: dateStr === todayStr,
      isSelected: dateStr === normalizedValue.value,
      isDisabled: isDateDisabled(dateStr)
    })
  }

  return days
})

const isDateDisabled = (dateStr: string): boolean => {
  if (props.min && dateStr < props.min) return true
  if (props.max && dateStr > props.max) return true
  return false
}

const selectDate = (dateStr: string) => {
  if (props.disabled || isDateDisabled(dateStr)) return
  emit('update:modelValue', dateStr)
  emit('change', dateStr)
  isOpen.value = false
}

const selectToday = () => {
  const todayStr = new Date().toISOString().slice(0, 10)
  selectDate(todayStr)
}

const clearDate = (e?: MouseEvent) => {
  if (e) e.stopPropagation()
  emit('update:modelValue', '')
  emit('change', '')
  isOpen.value = false
}
</script>

<template>
  <div class="space-y-1 font-sans">
    <!-- Label -->
    <label
      v-if="label"
      class="block text-xs font-semibold text-slate-700 dark:text-slate-300"
    >
      {{ label }}
      <span
        v-if="required"
        class="text-red-500 font-bold ml-0.5"
      >*</span>
    </label>

    <!-- Popover Déclencheur -->
    <div class="flex items-center gap-1">
      <UPopover
        v-model:open="isOpen"
        :disabled="disabled"
        class="flex-1"
        :ui="{
          content: 'p-3 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl shadow-lg z-50 min-w-[280px]'
        }"
      >
        <AppButton
          height="field"
          variant="outline"
          :disabled="disabled"
          :aria-label="formattedDateText || placeholder"
          :class="[
            'w-full !justify-between !px-3',
            error ? '!border-red-500 !text-red-600' : ''
          ]"
          trailing-icon="i-lucide-chevron-down"
        >
          <span class="flex items-center gap-2 truncate">
            <UIcon
              name="i-lucide-calendar"
              class="w-4 h-4 shrink-0"
              :class="error ? 'text-red-500' : 'text-slate-500 dark:text-slate-400'"
            />
            <span
              v-if="normalizedValue"
              class="font-medium"
            >
              {{ formattedDateText }}
            </span>
            <span
              v-else
              class="text-slate-400 dark:text-slate-500"
            >
              {{ placeholder }}
            </span>
          </span>
        </AppButton>

        <!-- Contenu du calendrier -->
        <template #content>
          <div class="space-y-3 select-none">
            <!-- En-tête mois / année et navigation -->
            <div class="flex items-center justify-between gap-1">
              <AppButton
                variant="ghost"
                size="xs"
                icon="i-lucide-chevron-left"
                title="Mois précédent"
                @click="prevMonth"
              />

              <div class="text-xs font-bold text-slate-900 dark:text-white">
                {{ currentMonthName }} {{ viewYear }}
              </div>

              <AppButton
                variant="ghost"
                size="xs"
                icon="i-lucide-chevron-right"
                title="Mois suivant"
                @click="nextMonth"
              />
            </div>

            <!-- Jours de la semaine -->
            <div class="grid grid-cols-7 gap-1 text-center text-[10px] font-bold text-slate-400 uppercase">
              <div
                v-for="wd in weekDays"
                :key="wd"
                class="py-1"
              >
                {{ wd }}
              </div>
            </div>

            <!-- Grille des jours -->
            <div class="grid grid-cols-7 gap-1 text-xs">
              <AppButton
                v-for="day in calendarDays"
                :key="day.dateString"
                type="button"
                :disabled="day.isDisabled"
                variant="ghost"
                size="xs"
                height="compact"
                :aria-label="day.dateString"
                :title="day.dateString"
                class="w-7 !h-7 mx-auto rounded-lg !p-0 font-medium"
                :class="[
                  day.isDisabled
                    ? 'opacity-25 cursor-not-allowed text-slate-400'
                    : day.isSelected
                      ? 'bg-emerald-600 text-white font-bold shadow-xs'
                      : day.isToday
                        ? 'border border-emerald-500 text-emerald-600 dark:text-emerald-400 font-bold hover:bg-emerald-50 dark:hover:bg-emerald-950/40'
                        : day.isCurrentMonth
                          ? 'text-slate-800 dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800'
                          : 'text-slate-400 dark:text-slate-600 hover:bg-slate-100/50 dark:hover:bg-slate-800/50'
                ]"
                @click="selectDate(day.dateString)"
              >
                {{ day.dayNumber }}
              </AppButton>
            </div>

            <!-- Actions rapides en bas de calendrier -->
            <div class="flex items-center justify-between pt-2 border-t border-slate-100 dark:border-slate-800 text-[11px]">
              <AppButton
                variant="ghost"
                size="xs"
                label="Aujourd'hui"
                icon="i-lucide-calendar-check"
                @click="selectToday"
              />

              <AppButton
                v-if="clearable && normalizedValue"
                variant="ghost"
                size="xs"
                label="Effacer"
                icon="i-lucide-trash-2"
                @click="clearDate"
              />
            </div>
          </div>
        </template>
      </UPopover>

      <AppButton
        v-if="clearable && normalizedValue && !disabled"
        variant="ghost"
        size="xs"
        icon="i-lucide-x"
        aria-label="Effacer la date"
        title="Effacer la date"
        @click="clearDate"
      />
    </div>

    <!-- Message d'erreur -->
    <p
      v-if="typeof error === 'string' && error"
      class="text-xs text-red-500 font-medium"
    >
      {{ error }}
    </p>

    <!-- Message d'aide -->
    <p
      v-else-if="help"
      class="text-[11px] text-slate-500 dark:text-slate-400"
    >
      {{ help }}
    </p>
  </div>
</template>
