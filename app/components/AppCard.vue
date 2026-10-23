<script setup lang="ts">
interface Props {
  title?: string
  description?: string
  icon?: string
  iconColor?: string
  badge?: string
  badgeColor?: 'primary' | 'neutral' | 'error' | 'warning' | 'success' | 'info'
  badgeVariant?: 'subtle' | 'solid' | 'outline'
  variant?: 'default' | 'subtle' | 'primary' | 'warning' | 'danger' | 'outline'
  rounded?: string | number
  hover?: boolean
  to?: string
  href?: string
  target?: string
  collapsible?: boolean
  defaultCollapsed?: boolean
  loading?: boolean
  headerClass?: string
  bodyClass?: string
  footerClass?: string
  noPadding?: boolean
}

const props = withDefaults(defineProps<Props>(), {
  variant: 'default',
  rounded: 'var(--radius)', // Utilise la variable CSS globale --radius par défaut
  badgeColor: 'primary',
  badgeVariant: 'subtle',
  hover: false,
  collapsible: false,
  defaultCollapsed: false,
  loading: false,
  noPadding: false
})

const isCollapsed = ref(props.defaultCollapsed)

const toggleCollapse = () => {
  if (props.collapsible) {
    isCollapsed.value = !isCollapsed.value
  }
}

// Résolution de l'arrondi (utilise --radius par défaut)
const resolvedRadius = computed(() => {
  if (
    props.rounded === undefined ||
    props.rounded === null ||
    props.rounded === '' ||
    props.rounded === 'var(--radius)' ||
    props.rounded === 'radius' ||
    props.rounded === 1 ||
    props.rounded === '1'
  ) {
    return 'var(--radius)'
  }
  if (typeof props.rounded === 'number') {
    return `${props.rounded}rem`
  }
  const str = String(props.rounded).trim()
  if (str === 'none') return '0px'
  if (str === 'full') return '9999px'
  if (str.endsWith('rem') || str.endsWith('px') || str.endsWith('%')) {
    return str
  }
  return 'var(--radius)'
})

// Styles dynamiques selon la variante
const variantClasses = computed(() => {
  switch (props.variant) {
    case 'subtle':
      return 'bg-slate-50/70 dark:bg-slate-800/40 border-slate-200 dark:border-slate-800'
    case 'primary':
      return 'bg-emerald-50/40 dark:bg-emerald-950/20 border-emerald-300 dark:border-emerald-800/70'
    case 'warning':
      return 'bg-amber-50/80 dark:bg-amber-950/40 border-amber-300 dark:border-amber-700/70'
    case 'danger':
      return 'bg-rose-50/80 dark:bg-rose-950/40 border-rose-200 dark:border-rose-900'
    case 'outline':
      return 'bg-transparent border-slate-200 dark:border-slate-800'
    case 'default':
    default:
      return 'bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800'
  }
})

// Couleurs de l'icône selon la variante ou surcharge
const iconColorClasses = computed(() => {
  if (props.iconColor) return props.iconColor
  switch (props.variant) {
    case 'primary':
      return 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/60 dark:text-emerald-300'
    case 'warning':
      return 'bg-amber-100 text-amber-700 dark:bg-amber-900/60 dark:text-amber-300'
    case 'danger':
      return 'bg-rose-100 text-rose-700 dark:bg-rose-900/60 dark:text-rose-300'
    case 'subtle':
    case 'outline':
    case 'default':
    default:
      return 'bg-emerald-50 text-emerald-600 dark:bg-emerald-950/60 dark:text-emerald-400'
  }
})

const hasHeader = computed(() => {
  return !!(props.title || props.description || props.icon || props.badge || props.collapsible)
})
const NuxtLink = resolveComponent('NuxtLink')
</script>

<template>
  <component
    :is="to ? NuxtLink : href ? 'a' : 'div'"
    :to="to"
    :href="href"
    :target="target"
    class="block text-inherit no-underline"
    :class="{ 'cursor-pointer': to || href }"
  >
    <UCard
      data-app-card
      :style="{ borderRadius: resolvedRadius }"
      :ui="{
        root: [
          'app-card relative border shadow-xs transition-all font-sans overflow-hidden',
          variantClasses,
          hover || to || href ? 'hover:shadow-md hover:border-slate-300 dark:hover:border-slate-700 cursor-pointer' : ''
        ].join(' '),
        header: [
          'p-3 border-b border-slate-100 dark:border-slate-800/80',
          headerClass || ''
        ].join(' '),
        body: [
          noPadding ? 'p-0' : 'p-3',
          bodyClass || ''
        ].join(' '),
        footer: [
          'p-3 border-t border-slate-100 dark:border-slate-800/80 bg-slate-50/50 dark:bg-slate-800/30',
          footerClass || ''
        ].join(' ')
      }"
    >
      <!-- En-tête de Card -->
      <template v-if="$slots.header || hasHeader" #header>
        <slot name="header">
          <div
            class="flex items-center justify-between gap-3 select-none"
            :class="{ 'cursor-pointer': collapsible }"
            @click="toggleCollapse"
          >
            <!-- Bloc Gauche : Icône + Titre & Description -->
            <div class="flex items-center gap-2.5 min-w-0">
              <slot name="icon">
                <div
                  v-if="icon"
                  class="w-7 h-7 rounded-lg flex items-center justify-center shrink-0 shadow-xs"
                  :class="iconColorClasses"
                >
                  <UIcon :name="icon" class="w-4 h-4 shrink-0" />
                </div>
              </slot>

              <div class="min-w-0">
                <slot name="title">
                  <h3 class="text-xs sm:text-sm font-bold text-slate-900 dark:text-white leading-snug truncate">
                    {{ title }}
                  </h3>
                </slot>
                <slot name="description">
                  <p v-if="description" class="text-[11px] text-slate-500 dark:text-slate-400 mt-0.5 truncate">
                    {{ description }}
                  </p>
                </slot>
              </div>
            </div>

            <!-- Bloc Droit : Badge + Actions + Bouton Replier -->
            <div class="flex items-center gap-2 shrink-0" @click.stop>
              <slot name="badge">
                <AppBadge
                  v-if="badge"
                  :label="badge"
                  :color="badgeColor"
                  :variant="badgeVariant"
                  size="xs"
                />
              </slot>

              <slot name="actions" />

              <!-- Bouton Replier / Déplier -->
              <AppButton
                v-if="collapsible"
                variant="ghost"
                size="xs"
                :icon="isCollapsed ? 'i-lucide-chevron-down' : 'i-lucide-chevron-up'"
                title="Replier / Déplier"
                class="text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 cursor-pointer"
                @click="toggleCollapse"
              />
            </div>
          </div>
        </slot>
      </template>

      <!-- Corps de Card -->
      <div v-show="!isCollapsed" class="relative">
        <!-- État de chargement avec overlay subtil -->
        <div
          v-if="loading"
          class="absolute inset-0 bg-white/70 dark:bg-slate-900/70 backdrop-blur-[1px] flex items-center justify-center z-10 rounded-[inherit]"
        >
          <div class="flex items-center gap-2 text-xs font-semibold text-emerald-600 dark:text-emerald-400">
            <UIcon name="i-lucide-loader-2" class="w-4 h-4 animate-spin" />
            <span>Chargement...</span>
          </div>
        </div>

        <slot />
      </div>

      <!-- Pied de Card -->
      <template v-if="$slots.footer && !isCollapsed" #footer>
        <slot name="footer" />
      </template>
    </UCard>
  </component>
</template>
