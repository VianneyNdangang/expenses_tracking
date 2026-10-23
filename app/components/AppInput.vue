<script setup lang="ts">
interface Props {
  modelValue?: string | number | null
  type?: 'text' | 'password' | 'number' | 'email' | 'tel' | 'date' | 'search' | 'textarea'
  label?: string
  placeholder?: string
  hint?: string
  help?: string
  error?: string | boolean
  icon?: string
  trailingIcon?: string
  size?: 'xs' | 'sm' | 'md' | 'lg'
  disabled?: boolean
  readonly?: boolean
  required?: boolean
  min?: number | string
  max?: number | string
  step?: number | string
  rows?: number
  clearable?: boolean
  autofocus?: boolean
}

const props = withDefaults(defineProps<Props>(), {
  type: 'text',
  size: 'sm',
  rows: 3,
  disabled: false,
  readonly: false,
  required: false,
  clearable: false,
  autofocus: false
})

const emit = defineEmits<{
  'update:modelValue': [value: any]
  change: [event: Event]
  enter: [event: KeyboardEvent]
  clear: []
}>()

// État pour afficher/masquer le mot de passe
const showPassword = ref(false)

const computedType = computed(() => {
  if (props.type === 'password') {
    return showPassword.value ? 'text' : 'password'
  }
  return props.type
})

const computedIcon = computed(() => {
  if (props.icon) return props.icon
  if (props.type === 'search') return 'i-lucide-search'
  if (props.type === 'date') return 'i-lucide-calendar'
  if (props.type === 'tel') return 'i-lucide-phone'
  if (props.type === 'email') return 'i-lucide-mail'
  return undefined
})

const onInput = (value: any) => {
  if (props.type === 'number') {
    const num = value === '' || value === null || value === undefined ? '' : Number(value)
    emit('update:modelValue', num)
  } else {
    emit('update:modelValue', value)
  }
}

const handleClear = () => {
  emit('update:modelValue', '')
  emit('clear')
}
</script>

<template>
  <UFormField
    :label="label"
    :hint="hint"
    :help="help"
    :error="error"
    :required="required"
    :size="size"
    class="w-full"
  >
    <!-- Cas Textarea -->
    <UTextarea
      v-if="type === 'textarea'"
      :model-value="modelValue as string"
      :placeholder="placeholder"
      :rows="rows"
      :disabled="disabled"
      :readonly="readonly"
      :size="size"
      :autofocus="autofocus"
      class="w-full font-sans"
      @update:model-value="onInput"
      @change="$emit('change', $event)"
    />

    <!-- Cas Input standard ou spécialisé -->
    <UInput
      v-else
      :model-value="modelValue"
      :type="computedType"
      :placeholder="placeholder"
      :icon="computedIcon"
      :trailing-icon="trailingIcon"
      :disabled="disabled"
      :readonly="readonly"
      :size="size"
      :min="min"
      :max="max"
      :step="step"
      :autofocus="autofocus"
      class="w-full font-sans"
      @update:model-value="onInput"
      @change="$emit('change', $event)"
      @keydown.enter="$emit('enter', $event)"
    >
      <!-- Bouton d'action à droite (Basculer mot de passe ou Effacer recherche) -->
      <template #trailing>
        <button
          v-if="type === 'password'"
          type="button"
          tabindex="-1"
          class="h-7 w-7 inline-flex items-center justify-center cursor-pointer text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 transition-colors"
          :aria-label="showPassword ? 'Masquer le mot de passe' : 'Afficher le mot de passe'"
          @click="showPassword = !showPassword"
        >
          <UIcon
            :name="showPassword ? 'i-lucide-eye-off' : 'i-lucide-eye'"
            class="w-4 h-4"
          />
        </button>

        <button
          v-else-if="clearable && modelValue"
          type="button"
          tabindex="-1"
          class="h-7 w-7 inline-flex items-center justify-center cursor-pointer text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 transition-colors"
          aria-label="Effacer le champ"
          @click="handleClear"
        >
          <UIcon name="i-lucide-x" class="w-4 h-4" />
        </button>
      </template>
    </UInput>
  </UFormField>
</template>
