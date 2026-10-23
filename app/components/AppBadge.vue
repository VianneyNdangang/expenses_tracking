<script setup lang="ts">
interface Props {
  status?: string
  label?: string
  color?: 'primary' | 'neutral' | 'error' | 'warning' | 'success' | 'info'
  variant?: 'solid' | 'outline' | 'soft' | 'subtle'
  size?: 'xs' | 'sm' | 'md' | 'lg'
  icon?: string
  dot?: boolean
}

const props = withDefaults(defineProps<Props>(), {
  variant: 'subtle',
  size: 'sm',
  dot: false
})

const badgeConfig = computed(() => {
  const st = (props.status || props.label || '').trim()

  switch (st) {
    // Statuts Engagement
    case 'Demandé':
      return { color: 'warning' as const, icon: 'i-lucide-clock', label: 'Demandé' }
    case 'Accepté':
    case 'Validé':
      return { color: 'info' as const, icon: 'i-lucide-check-circle-2', label: 'Validé' }
    case 'Payé':
      return { color: 'primary' as const, icon: 'i-lucide-banknote', label: 'Payé' }
    case 'Justifié':
      return { color: 'success' as const, icon: 'i-lucide-file-check', label: 'Justifié' }
    case 'Refusé':
      return { color: 'error' as const, icon: 'i-lucide-x-circle', label: 'Refusé' }
    case 'Annulé':
      return { color: 'neutral' as const, icon: 'i-lucide-ban', label: 'Annulé' }

    // Évaluation des Prix
    case 'Conforme':
      return { color: 'success' as const, icon: 'i-lucide-check', label: 'Conforme' }
    case 'À vérifier':
      return { color: 'warning' as const, icon: 'i-lucide-alert-circle', label: 'À vérifier' }
    case 'Suspect':
      return { color: 'error' as const, icon: 'i-lucide-alert-octagon', label: 'Suspect' }

    // État d'archivage / activité
    case 'Actif':
      return { color: 'success' as const, icon: 'i-lucide-check', label: 'Actif' }
    case 'Archivé':
      return { color: 'neutral' as const, icon: 'i-lucide-archive', label: 'Archivé' }

    default:
      return {
        color: props.color || ('neutral' as const),
        icon: props.icon,
        label: st || props.label || ''
      }
  }
})

const finalColor = computed(() => props.color || badgeConfig.value.color)
const finalIcon = computed(() => (props.icon !== undefined ? props.icon : badgeConfig.value.icon))
const displayText = computed(() => props.label || badgeConfig.value.label)
</script>

<template>
  <UBadge
    :color="finalColor"
    :variant="variant"
    :size="size"
    class="inline-flex items-center gap-1 font-semibold whitespace-nowrap"
  >
    <!-- Point coloré si dot activé -->
    <span
      v-if="dot"
      class="w-1.5 h-1.5 rounded-full"
      :class="[
        finalColor === 'success' ? 'bg-emerald-500' : '',
        finalColor === 'warning' ? 'bg-amber-500' : '',
        finalColor === 'error' ? 'bg-rose-500' : '',
        finalColor === 'info' ? 'bg-blue-500' : '',
        finalColor === 'primary' ? 'bg-emerald-600' : '',
        finalColor === 'neutral' ? 'bg-slate-400' : ''
      ]"
    />

    <!-- Icône contextuelle -->
    <UIcon
      v-else-if="finalIcon"
      :name="finalIcon"
      class="w-3.5 h-3.5 shrink-0"
    />

    <slot>{{ displayText }}</slot>
  </UBadge>
</template>
