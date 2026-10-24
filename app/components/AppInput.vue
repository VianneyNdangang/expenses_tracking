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
  'update:modelValue': [value: string | number | null]
  'change': [event: Event]
  'enter': [event: KeyboardEvent]
  'clear': []
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

const onInput = (value: string | number | null) => {
  emit('update:modelValue', value)
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
    size="sm"
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
      size="sm"
      :autofocus="autofocus"
      class="w-full font-sans"
      @update:model-value="onInput"
      @change="$emit('change', $event)"
    />

    <UInputNumber
      v-else-if="type === 'number'"
      :model-value="typeof modelValue === 'number' ? modelValue : null"
      :placeholder="placeholder"
      :disabled="disabled"
      :readonly="readonly"
      :required="required"
      :min="min === undefined ? undefined : Number(min)"
      :max="max === undefined ? undefined : Number(max)"
      :step="step === undefined ? 1 : Number(step)"
      size="sm"
      :autofocus="autofocus"
      class="w-full h-8 min-h-8 font-sans"
      :ui="{ root: 'w-full h-8 min-h-8', base: 'h-8 min-h-8 text-xs' }"
      @update:model-value="emit('update:modelValue', $event ?? '')"
      @change="$emit('change', $event)"
      @keydown.enter="$emit('enter', $event)"
    />

    <!-- Cas Input standard ou spécialisé -->
    <UInput
      v-else
      :model-value="modelValue ?? undefined"
      :type="computedType"
      :placeholder="placeholder"
      :icon="computedIcon"
      :trailing-icon="trailingIcon"
      :disabled="disabled"
      :readonly="readonly"
      size="sm"
      :min="min"
      :max="max"
      :step="step"
      :autofocus="autofocus"
      class="w-full h-8 min-h-8 font-sans"
      :ui="{ base: 'h-8 min-h-8 text-xs' }"
      @update:model-value="emit('update:modelValue', $event)"
      @change="$emit('change', $event)"
      @keydown.enter="$emit('enter', $event)"
    >
      <!-- Bouton d'action à droite (Basculer mot de passe ou Effacer recherche) -->
      <template #trailing>
        <AppButton
          v-if="type === 'password'"
          type="button"
          variant="ghost"
          size="xs"
          :aria-label="showPassword ? 'Masquer le mot de passe' : 'Afficher le mot de passe'"
          :title="showPassword ? 'Masquer le mot de passe' : 'Afficher le mot de passe'"
          @click="showPassword = !showPassword"
        >
          <UIcon
            :name="showPassword ? 'i-lucide-eye-off' : 'i-lucide-eye'"
            class="w-4 h-4"
          />
        </AppButton>

        <AppButton
          v-else-if="clearable && modelValue"
          type="button"
          variant="ghost"
          size="xs"
          icon="i-lucide-x"
          aria-label="Effacer le champ"
          title="Effacer le champ"
          @click="handleClear"
        />
      </template>
    </UInput>
  </UFormField>
</template>
