<script setup lang="ts">
export interface DataTableColumn {
  key: string
  label: string
  sortable?: boolean
  class?: string
  align?: 'left' | 'center' | 'right'
}

interface Props {
  columns: DataTableColumn[]
  data: any[]
  loading?: boolean
  searchable?: boolean
  searchPlaceholder?: string
  searchKeys?: string[]
  pagination?: boolean
  pageSize?: number
  emptyTitle?: string
  emptyDescription?: string
  emptyIcon?: string
  rowClickable?: boolean
}

const props = withDefaults(defineProps<Props>(), {
  data: () => [],
  loading: false,
  searchable: true,
  searchPlaceholder: 'Rechercher...',
  pagination: true,
  pageSize: 10,
  emptyTitle: 'Aucun enregistrement trouvé',
  emptyDescription: 'Aucune donnée disponible ou aucun résultat ne correspond à votre recherche.',
  emptyIcon: 'i-lucide-inbox',
  rowClickable: false
})

const emit = defineEmits<{
  'row-click': [row: any, index: number]
}>()

// Recherche interne
const searchQuery = ref('')
const sortColumn = ref<string | null>(null)
const sortDirection = ref<'asc' | 'desc'>('asc')
const currentPage = ref(1)
const currentPageSize = ref(props.pageSize)

// Réinitialise la page lors de la recherche
watch(searchQuery, () => {
  currentPage.value = 1
})

// Filtrage réactif
const filteredData = computed(() => {
  if (!props.data || props.data.length === 0) return []
  if (!searchQuery.value.trim()) return props.data

  const q = searchQuery.value.toLowerCase().trim()
  return props.data.filter((item) => {
    if (props.searchKeys && props.searchKeys.length > 0) {
      return props.searchKeys.some((k) => {
        const val = item[k]
        return val !== null && val !== undefined && String(val).toLowerCase().includes(q)
      })
    }
    // Recherche automatique sur toutes les propriétés primitives
    return Object.values(item).some((val) => {
      if (val === null || val === undefined) return false
      if (typeof val === 'object') return false
      return String(val).toLowerCase().includes(q)
    })
  })
})

// Tri réactif
const sortedData = computed(() => {
  if (!sortColumn.value) return filteredData.value
  const colKey = sortColumn.value
  const dir = sortDirection.value === 'asc' ? 1 : -1

  return [...filteredData.value].sort((a, b) => {
    const aVal = a[colKey]
    const bVal = b[colKey]

    if (aVal === bVal) return 0
    if (aVal === null || aVal === undefined) return 1
    if (bVal === null || bVal === undefined) return -1

    if (typeof aVal === 'number' && typeof bVal === 'number') {
      return (aVal - bVal) * dir
    }
    return String(aVal).localeCompare(String(bVal), 'fr', { numeric: true }) * dir
  })
})

// Pagination
const totalItems = computed(() => sortedData.value.length)
const totalPages = computed(() => Math.ceil(totalItems.value / currentPageSize.value) || 1)

const paginatedData = computed(() => {
  if (!props.pagination) return sortedData.value
  const start = (currentPage.value - 1) * currentPageSize.value
  return sortedData.value.slice(start, start + currentPageSize.value)
})

const handleSort = (column: DataTableColumn) => {
  if (!column.sortable) return

  if (sortColumn.value === column.key) {
    if (sortDirection.value === 'asc') {
      sortDirection.value = 'desc'
    } else {
      sortColumn.value = null
      sortDirection.value = 'asc'
    }
  } else {
    sortColumn.value = column.key
    sortDirection.value = 'asc'
  }
}

const tableColumns = computed(() => {
  return (props.columns || []).map((col) => {
    const isAlignRight = col.align === 'right'
    const isAlignCenter = col.align === 'center'
    const alignClass = isAlignRight ? 'text-right' : isAlignCenter ? 'text-center' : 'text-left'
    const isNameCol = ['name', 'fullName', 'workerName', 'witnessName', 'itemName', 'worker', 'witness', 'item'].includes(col.key)

    return {
      id: col.key,
      accessorKey: col.key,
      header: col.label,
      enableSorting: col.sortable !== false,
      meta: {
        class: {
          th: [
            alignClass,
            col.class || ''
          ].filter(Boolean).join(' '),
          td: [
            alignClass,
            isNameCol ? 'whitespace-nowrap' : '',
            col.class || ''
          ].filter(Boolean).join(' ')
        }
      }
    }
  })
})

const tableUi = computed(() => ({
  base: 'w-full text-left text-xs border-collapse',
  thead: 'bg-slate-50 dark:bg-slate-800/60 text-slate-600 dark:text-slate-400 font-semibold uppercase tracking-wider border-b border-slate-200 dark:border-slate-800 select-none',
  th: 'py-3 px-4 font-semibold uppercase tracking-wider text-xs',
  td: 'py-3.5 px-4 text-xs text-slate-800 dark:text-slate-200',
  tr: props.rowClickable
    ? 'transition-colors hover:bg-slate-50/70 dark:hover:bg-slate-800/40 cursor-pointer'
    : 'transition-colors hover:bg-slate-50/70 dark:hover:bg-slate-800/40',
  empty: 'py-12 text-center text-slate-500'
}))

const handleRowSelect = (_event: any, row: any) => {
  if (props.rowClickable && row?.original) {
    emit('row-click', row.original, row.index)
  }
}
</script>

<template>
  <div class="space-y-4 font-sans">
    <!-- Barre supérieure : Recherche + Filtres + Actions -->
    <div
      v-if="searchable || $slots['header-actions'] || $slots.filters"
      class="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3"
    >
      <!-- Barre de recherche -->
      <div v-if="searchable" class="w-full sm:max-w-xs">
        <AppInput
          v-model="searchQuery"
          type="search"
          :placeholder="searchPlaceholder"
          clearable
          size="sm"
        />
      </div>

      <!-- Filtres personnalisés -->
      <div v-if="$slots.filters" class="flex-1 flex items-center gap-2 overflow-x-auto">
        <slot name="filters" />
      </div>

      <!-- Actions à droite (Boutons Export, Nouveau, etc.) -->
      <div v-if="$slots['header-actions']" class="flex items-center gap-2 shrink-0">
        <slot name="header-actions" />
      </div>
    </div>

    <!-- Conteneur Tableau AppCard avec UTable de Nuxt UI -->
    <AppCard no-padding>
      <div class="overflow-x-auto">
        <UTable
          :data="paginatedData"
          :columns="tableColumns"
          :loading="loading"
          :ui="tableUi"
          :on-select="rowClickable ? handleRowSelect : undefined"
        >
          <!-- Forward header personnalisé avec tri pour chaque colonne -->
          <template v-for="col in columns" :key="`header-${col.key}`" #[`${col.key}-header`]="headerContext">
            <slot :name="`${col.key}-header`" v-bind="headerContext">
              <div
                class="inline-flex items-center gap-1.5"
                :class="[
                  col.sortable ? 'cursor-pointer select-none hover:text-slate-900 dark:hover:text-white transition-colors' : '',
                  col.align === 'right' ? 'justify-end w-full' : col.align === 'center' ? 'justify-center w-full' : 'justify-start'
                ]"
                @click="col.sortable && handleSort(col)"
              >
                <span>{{ col.label }}</span>
                <template v-if="col.sortable">
                  <UIcon
                    v-if="sortColumn === col.key && sortDirection === 'asc'"
                    name="i-lucide-arrow-up"
                    class="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400 shrink-0"
                  />
                  <UIcon
                    v-else-if="sortColumn === col.key && sortDirection === 'desc'"
                    name="i-lucide-arrow-down"
                    class="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400 shrink-0"
                  />
                  <UIcon
                    v-else
                    name="i-lucide-arrow-up-down"
                    class="w-3.5 h-3.5 text-slate-400 dark:text-slate-500 opacity-60 shrink-0"
                  />
                </template>
              </div>
            </slot>
          </template>

          <!-- Forward slots de cellules : supporte #[col.key] et #[col.key-cell] -->
          <template v-for="col in columns" :key="`cell-${col.key}`" #[`${col.key}-cell`]="cellContext">
            <slot
              :name="col.key"
              :row="cellContext.row.original"
              :value="cellContext.getValue ? cellContext.getValue() : cellContext.row.original[col.key]"
              :index="cellContext.row.index"
              :context="cellContext"
            >
              <slot
                :name="`${col.key}-cell`"
                :row="cellContext.row.original"
                :value="cellContext.getValue ? cellContext.getValue() : cellContext.row.original[col.key]"
                :index="cellContext.row.index"
                :context="cellContext"
              >
                <span
                  :class="[
                    col.align === 'right' ? 'text-right block w-full' : col.align === 'center' ? 'text-center block w-full' : 'text-left',
                    ['name', 'fullName', 'workerName', 'witnessName', 'itemName', 'worker', 'witness', 'item'].includes(col.key) ? 'whitespace-nowrap' : '',
                    col.class || ''
                  ]"
                >
                  {{ cellContext.getValue ? cellContext.getValue() : cellContext.row.original[col.key] }}
                </span>
              </slot>
            </slot>
          </template>

          <!-- Slot État vide personnalisé -->
          <template #empty>
            <slot name="empty">
              <div class="py-12 text-center text-slate-500 max-w-xs mx-auto space-y-2">
                <UIcon :name="emptyIcon" class="w-8 h-8 text-slate-400 mx-auto" />
                <p class="font-medium text-slate-700 dark:text-slate-300">{{ emptyTitle }}</p>
                <p class="text-xs text-slate-500">{{ emptyDescription }}</p>
              </div>
            </slot>
          </template>

          <!-- Slot État de chargement personnalisé -->
          <template #loading>
            <slot name="loading">
              <div class="py-12 text-center text-slate-500 space-y-2">
                <UIcon name="i-lucide-loader-2" class="w-7 h-7 animate-spin mx-auto text-emerald-600 dark:text-emerald-400" />
                <p class="text-xs font-medium text-slate-600 dark:text-slate-400">Chargement des données...</p>
              </div>
            </slot>
          </template>
        </UTable>
      </div>

      <!-- Barre de pagination inférieure -->
      <template v-if="pagination && totalItems > 0" #footer>
        <div class="p-3 sm:px-4 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 text-xs text-slate-500 dark:text-slate-400 border-t border-slate-200 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-800/30">
          <div>
            Affichage de
            <strong class="text-slate-800 dark:text-slate-200">
              {{ (currentPage - 1) * currentPageSize + 1 }}
            </strong>
            à
            <strong class="text-slate-800 dark:text-slate-200">
              {{ Math.min(currentPage * currentPageSize, totalItems) }}
            </strong>
            sur
            <strong class="text-slate-800 dark:text-slate-200">{{ totalItems }}</strong>
            élément{{ totalItems > 1 ? 's' : '' }}
          </div>

          <div class="flex items-center gap-1.5 self-end sm:self-auto">
            <AppButton
              variant="outline"
              size="xs"
              icon="i-lucide-chevron-left"
              :disabled="currentPage <= 1"
              label="Précédent"
              @click="currentPage--"
            />
            <span class="px-2 font-medium text-slate-700 dark:text-slate-300">
              {{ currentPage }} / {{ totalPages }}
            </span>
            <AppButton
              variant="outline"
              size="xs"
              trailing-icon="i-lucide-chevron-right"
              :disabled="currentPage >= totalPages"
              label="Suivant"
              @click="currentPage++"
            />
          </div>
        </div>
      </template>
    </AppCard>
  </div>
</template>
