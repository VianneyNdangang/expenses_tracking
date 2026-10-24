<script setup lang="ts">
interface Props {
  modelValue: boolean
  log: any | null
}

const props = withDefaults(defineProps<Props>(), {
  log: null
})

const emit = defineEmits<{
  'update:modelValue': [value: boolean]
}>()

const isOpen = computed({
  get: () => props.modelValue,
  set: (val: boolean) => emit('update:modelValue', val)
})
</script>

<template>
  <AppModal
    v-model="isOpen"
    :title="`Événement d'Audit — ${log?.action || ''}`"
    icon="i-lucide-shield-alert"
    hide-confirm
    cancel-label="Fermer"
  >
    <div v-if="log" class="space-y-4 text-xs font-mono">
      <div class="grid grid-cols-2 gap-3 p-3 rounded-lg bg-slate-50 dark:bg-slate-800/60 font-sans">
        <div>
          <span class="text-slate-500 block text-[11px]">Utilisateur :</span>
          <span class="font-bold text-slate-900 dark:text-white">{{ log.username }}</span>
        </div>
        <div>
          <span class="text-slate-500 block text-[11px]">Date & Heure :</span>
          <span class="text-slate-800 dark:text-slate-200">{{ new Date(log.createdAt).toLocaleString('fr-FR') }}</span>
        </div>
        <div>
          <span class="text-slate-500 block text-[11px]">Adresse IP :</span>
          <span class="font-mono text-slate-800 dark:text-slate-200">{{ log.ip }}</span>
        </div>
        <div>
          <span class="text-slate-500 block text-[11px]">Entité :</span>
          <span class="font-semibold text-slate-800 dark:text-slate-200">{{ log.entity }} (ID: {{ log.entityId }})</span>
        </div>
      </div>

      <div v-if="log.before" class="space-y-1">
        <span class="font-sans font-semibold text-slate-700 dark:text-slate-300 block">Données Avant (Snapshot) :</span>
        <pre class="p-3 bg-slate-100 dark:bg-slate-950 rounded-lg text-slate-800 dark:text-slate-300 overflow-x-auto text-[11px]">{{ JSON.stringify(log.before, null, 2) }}</pre>
      </div>

      <div v-if="log.after" class="space-y-1">
        <span class="font-sans font-semibold text-slate-700 dark:text-slate-300 block">Données Après (Snapshot) :</span>
        <pre class="p-3 bg-slate-100 dark:bg-slate-950 rounded-lg text-slate-800 dark:text-slate-300 overflow-x-auto text-[11px]">{{ JSON.stringify(log.after, null, 2) }}</pre>
      </div>
    </div>
  </AppModal>
</template>
