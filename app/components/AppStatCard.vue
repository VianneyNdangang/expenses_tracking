<script setup lang="ts">
interface Props {
  title: string
  value: string | number
  subtitle?: string
  icon?: string
  color?: 'primary' | 'neutral' | 'error' | 'warning' | 'success' | 'info'
  trend?: string
  to?: string
}

withDefaults(defineProps<Props>(), {
  color: 'primary'
})
</script>

<template>
  <AppCard
    :to="to"
    hover
  >
    <div class="flex items-start justify-between gap-3">
      <div class="space-y-1 min-w-0">
        <span class="text-xs font-medium text-slate-500 dark:text-slate-400 block truncate">
          {{ title }}
        </span>
        <div class="text-lg sm:text-xl font-extrabold tracking-tight text-slate-900 dark:text-white">
          {{ value }}
        </div>
        <div v-if="subtitle" class="text-[11px] text-slate-500 dark:text-slate-400 flex items-center gap-1">
          <span>{{ subtitle }}</span>
        </div>
      </div>

      <div
        v-if="icon"
        class="w-10 h-10 rounded-xl flex items-center justify-center shrink-0 shadow-xs"
        :class="[
          color === 'primary' ? 'bg-emerald-50 text-emerald-600 dark:bg-emerald-950/60 dark:text-emerald-400' : '',
          color === 'success' ? 'bg-emerald-50 text-emerald-600 dark:bg-emerald-950/60 dark:text-emerald-400' : '',
          color === 'warning' ? 'bg-amber-50 text-amber-600 dark:bg-amber-950/60 dark:text-amber-400' : '',
          color === 'error' ? 'bg-rose-50 text-rose-600 dark:bg-rose-950/60 dark:text-rose-400' : '',
          color === 'info' ? 'bg-blue-50 text-blue-600 dark:bg-blue-950/60 dark:text-blue-400' : '',
          color === 'neutral' ? 'bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-400' : ''
        ]"
      >
        <UIcon :name="icon" class="w-5 h-5" />
      </div>
    </div>
  </AppCard>
</template>
