<script setup lang="ts">
interface Props {
  modelValue: boolean
  title?: string
  description?: string
  icon?: string
  confirmLabel?: string
  confirmColor?: 'primary' | 'neutral' | 'error' | 'warning' | 'success' | 'info'
  confirmVariant?: 'solid' | 'outline' | 'soft' | 'subtle' | 'ghost'
  confirmLoading?: boolean
  confirmDisabled?: boolean
  cancelLabel?: string
  hideFooter?: boolean
  hideConfirm?: boolean
  hideCancel?: boolean
  preventClose?: boolean
}

const props = withDefaults(defineProps<Props>(), {
  title: '',
  description: '',
  confirmLabel: 'Confirmer',
  confirmColor: 'primary',
  confirmVariant: 'solid',
  confirmLoading: false,
  confirmDisabled: false,
  cancelLabel: 'Annuler',
  hideFooter: false,
  hideConfirm: false,
  hideCancel: false,
  preventClose: false
})

const emit = defineEmits<{
  'update:modelValue': [value: boolean]
  confirm: []
  cancel: []
  close: []
}>()

const isOpen = computed({
  get: () => props.modelValue,
  set: (val: boolean) => emit('update:modelValue', val)
})

const handleCancel = () => {
  emit('cancel')
  isOpen.value = false
}

const handleConfirm = () => {
  emit('confirm')
}
</script>

<template>
  <UModal
    v-model:open="isOpen"
    :prevent-close="preventClose"
  >
    <template #content>
      <div class="p-5 sm:p-6 space-y-4 font-sans bg-white dark:bg-slate-900 rounded-xl">
        <!-- En-tête -->
        <div v-if="$slots.header || title" class="flex items-start justify-between gap-3 pb-3 border-b border-slate-100 dark:border-slate-800">
          <slot name="header">
            <div class="flex items-center gap-3">
              <div
                v-if="icon"
                class="w-9 h-9 rounded-lg bg-emerald-50 dark:bg-emerald-950/60 text-emerald-600 dark:text-emerald-400 flex items-center justify-center shrink-0"
              >
                <UIcon :name="icon" class="w-5 h-5" />
              </div>
              <div>
                <h3 class="text-base font-bold text-slate-900 dark:text-white leading-snug">
                  {{ title }}
                </h3>
                <p v-if="description" class="text-xs text-slate-500 mt-0.5">
                  {{ description }}
                </p>
              </div>
            </div>
          </slot>

          <AppButton
            variant="ghost"
            size="xs"
            icon="i-lucide-x"
            aria-label="Fermer"
            @click="handleCancel"
          />
        </div>

        <!-- Corps de la modale -->
        <div class="space-y-4">
          <slot />
        </div>

        <!-- Pied de la modale -->
        <div
          v-if="!hideFooter"
          class="flex items-center justify-end gap-2 pt-4 border-t border-slate-100 dark:border-slate-800"
        >
          <slot name="footer">
            <AppButton
              v-if="!hideCancel"
              variant="outline"
              size="sm"
              :label="cancelLabel"
              :disabled="confirmLoading"
              @click="handleCancel"
            />

            <slot name="actions" />

            <AppButton
              v-if="!hideConfirm"
              :color="confirmColor"
              :variant="confirmVariant"
              size="sm"
              :label="confirmLabel"
              :loading="confirmLoading"
              :disabled="confirmDisabled"
              @click="handleConfirm"
            />
          </slot>
        </div>
      </div>
    </template>
  </UModal>
</template>
