<script setup lang="ts">
interface SelectOption {
  label: string
  value: string
  description?: string
  disabled?: boolean
}

interface Props {
  modelValue?: string
  items: Array<string | SelectOption>
  label?: string
  placeholder?: string
  error?: string | boolean
  required?: boolean
  disabled?: boolean
}

withDefaults(defineProps<Props>(), {
  modelValue: '',
  label: '',
  placeholder: 'Sélectionner...',
  required: false,
  disabled: false
})

const emit = defineEmits<{
  'update:modelValue': [value: string]
  'change': [event: Event]
}>()

const updateValue = (value: unknown) => {
  emit('update:modelValue', typeof value === 'string' || typeof value === 'number' ? String(value) : '')
}
</script>

<template>
  <UFormField
    :label="label"
    :error="error"
    :required="required"
    size="sm"
    class="w-full"
  >
    <USelect
      :model-value="modelValue"
      :items="items"
      :placeholder="placeholder"
      :disabled="disabled"
      size="sm"
      class="w-full h-8 min-h-8"
      :ui="{ base: 'w-full h-8 min-h-8 text-xs' }"
      @update:model-value="updateValue"
      @change="$emit('change', $event)"
    />
  </UFormField>
</template>
