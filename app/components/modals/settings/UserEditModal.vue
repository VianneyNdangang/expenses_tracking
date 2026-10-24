<script setup lang="ts">
import { UpdateUserSchema, USER_ROLES, type UserRole, validateForm } from '~~/shared/schemas'

interface Props {
  modelValue: boolean
  user: any | null
}

const props = withDefaults(defineProps<Props>(), {
  user: null
})

const emit = defineEmits<{
  'update:modelValue': [value: boolean]
  updated: [message: string]
}>()

const isOpen = computed({
  get: () => props.modelValue,
  set: (val: boolean) => emit('update:modelValue', val)
})

const form = reactive({
  id: '',
  username: '',
  name: '',
  role: 'SECRETAIRE' as UserRole,
  password: ''
})

const errors = ref<Record<string, string>>({})
const loading = ref(false)

watch(() => props.modelValue, (val) => {
  if (val && props.user) {
    form.id = props.user.id
    form.username = props.user.username
    form.name = props.user.name
    form.role = props.user.role
    form.password = ''
    errors.value = {}
  }
})

const submitEditUser = async () => {
  errors.value = {}
  const payload: any = {
    name: form.name,
    role: form.role
  }
  if (form.password && form.password.trim().length > 0) {
    payload.password = form.password
  }

  const validation = validateForm(UpdateUserSchema, payload)
  if (!validation.success) {
    errors.value = validation.errors
    return
  }

  loading.value = true
  try {
    await $fetch(`/api/users/${form.id}`, {
      method: 'PUT',
      body: validation.data
    })
    const msg = `Utilisateur "${form.name}" mis à jour avec succès !`
    isOpen.value = false
    emit('updated', msg)
  } catch (err: any) {
    errors.value = {
      name: err.data?.statusMessage || err.message || 'Erreur lors de la mise à jour'
    }
  } finally {
    loading.value = false
  }
}
</script>

<template>
  <AppModal
    v-model="isOpen"
    title="Modifier le compte utilisateur"
    description="Mettez à jour les informations, le rôle ou réinitialisez le mot de passe."
    icon="i-lucide-pencil"
    confirm-label="Enregistrer les Modifications"
    :confirm-loading="loading"
    @confirm="submitEditUser"
    @cancel="isOpen = false"
  >
    <form class="space-y-4 py-2" @submit.prevent="submitEditUser">
      <AppInput
        v-model="form.name"
        label="Nom complet du collaborateur"
        :error="errors.name"
        required
      />

      <div>
        <label class="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
          Identifiant
        </label>
        <div class="px-3 py-2 rounded-lg bg-slate-100 dark:bg-slate-800 text-xs font-mono text-slate-600 dark:text-slate-400">
          @{{ form.username }} (non modifiable)
        </div>
      </div>

      <!-- Sélection du Rôle -->
      <div>
        <label class="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5">
          Rôle et Responsabilités <span class="text-red-500">*</span>
        </label>
        <div class="grid grid-cols-1 sm:grid-cols-3 gap-2">
          <button
            v-for="r in USER_ROLES"
            :key="r.value"
            type="button"
            class="p-2.5 rounded-lg border text-left transition-colors cursor-pointer flex flex-col justify-between"
            :class="form.role === r.value ? 'border-emerald-600 bg-emerald-50 dark:bg-emerald-950/40 text-emerald-900 dark:text-emerald-200 ring-2 ring-emerald-500/20' : 'border-slate-200 dark:border-slate-800 hover:bg-slate-50 dark:hover:bg-slate-800/50'"
            @click="form.role = r.value"
          >
            <div class="flex items-center justify-between mb-1">
              <span class="font-bold text-xs">{{ r.label }}</span>
              <UIcon
                :name="r.value === 'PATRON' ? 'i-lucide-crown' : r.value === 'SECRETAIRE' ? 'i-lucide-clipboard-pen' : 'i-lucide-wrench'"
                class="w-4 h-4"
              />
            </div>
            <span class="text-[10px] text-slate-500 dark:text-slate-400 leading-tight">
              {{ r.description.split(':')[0] }}
            </span>
          </button>
        </div>
      </div>

      <AppInput
        v-model="form.password"
        type="password"
        label="Nouveau mot de passe (laisser vide pour ne pas changer)"
        placeholder="Entrez pour changer le mot de passe..."
        :error="errors.password"
      />
    </form>
  </AppModal>
</template>
