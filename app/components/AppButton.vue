<script setup lang="ts">
import type { RouteLocationRaw } from 'vue-router'

interface Props {
  variant?: 'primary' | 'secondary' | 'danger' | 'danger-outline' | 'outline' | 'soft' | 'subtle' | 'ghost' | 'link' | 'solid'
  color?: 'primary' | 'neutral' | 'error' | 'warning' | 'success' | 'info'
  size?: 'xs' | 'sm' | 'md' | 'lg' | 'xl'
  height?: 'compact' | 'field' | 'auto'
  icon?: string
  trailingIcon?: string
  loading?: boolean
  disabled?: boolean
  block?: boolean
  to?: RouteLocationRaw
  href?: string
  download?: boolean | string
  target?: string
  type?: 'button' | 'submit' | 'reset'
  label?: string
  ariaLabel?: string
  title?: string
}

const props = withDefaults(defineProps<Props>(), {
  variant: 'primary',
  size: 'sm',
  height: 'compact',
  type: 'button',
  loading: false,
  disabled: false,
  block: false
})

const emit = defineEmits<{
  click: [event: MouseEvent]
}>()

// Mappage dynamique des variantes vers les props natives de Nuxt UI
const computedColor = computed(() => {
  if (props.color) return props.color
  switch (props.variant) {
    case 'primary':
      return 'primary'
    case 'secondary':
      return 'neutral'
    case 'danger':
    case 'danger-outline':
      return 'error'
    case 'ghost':
    case 'outline':
      return 'neutral'
    default:
      return 'primary'
  }
})

const computedVariant = computed(() => {
  switch (props.variant) {
    case 'primary':
      return 'solid'
    case 'secondary':
      return 'outline'
    case 'danger':
      return 'solid'
    case 'danger-outline':
      return 'outline'
    case 'solid':
    case 'outline':
    case 'soft':
    case 'subtle':
    case 'ghost':
    case 'link':
      return props.variant
    default:
      return 'solid'
  }
})

const buttonHeightClass = computed(() => {
  switch (props.height) {
    case 'field':
      return '!h-8 h-8 min-h-8'
    case 'auto':
      return '!h-auto h-auto min-h-0 !py-2.5 !text-left !justify-between !items-stretch'
    default:
      return '!h-7 h-7'
  }
})

const tooltipText = computed(() => props.title || props.ariaLabel)

const handleClick = (e: MouseEvent) => {
  if (!props.disabled && !props.loading) {
    emit('click', e)
  }
}
</script>

<template>
  <UTooltip
    :text="tooltipText"
    :disabled="!tooltipText"
  >
    <UButton
      :color="computedColor"
      :variant="computedVariant"
      :size="size"
      :icon="icon"
      :trailing-icon="trailingIcon"
      :loading="loading"
      :disabled="disabled"
      :block="block"
      :to="to"
      :href="href"
      :download="download"
      :target="target"
      :type="type"
      :aria-label="ariaLabel"
      :class="[buttonHeightClass, 'cursor-pointer transition-all active:scale-[0.98] inline-flex items-center justify-center text-xs py-0 select-none']"
      :ui="{
        base: [buttonHeightClass, 'cursor-pointer py-0 text-xs inline-flex items-center justify-center']
      }"
      @click="handleClick"
    >
      <template
        v-if="$slots.leading"
        #leading
      >
        <slot name="leading" />
      </template>

      <slot>{{ label }}</slot>

      <template
        v-if="$slots.trailing"
        #trailing
      >
        <slot name="trailing" />
      </template>
    </UButton>
  </UTooltip>
</template>
