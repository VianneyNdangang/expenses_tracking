<script setup lang="ts">
import { CreateUserSchema, USER_ROLES, type UserRole, validateForm } from '~~/shared/schemas'

interface Props {
  modelValue: boolean
}

const props = defineProps<Props>()

const emit = defineEmits<{
  'update:modelValue': [value: boolean]
  created: [message: string]
}>()

const isOpen = computed({
  get: () => props.modelValue,
  set: (val: boolean) => emit('update:modelValue', val)
})

const form = reactive({
  username: '',
  name: '',
  role: 'SECRETAIRE' as UserRole,
  password: ''
})

const errors = ref<Record<string, string>>({})
const loading = ref(false)

watch(() => props.modelValue, (val) => {
  if (val) {
    form.username = ''
    form.name = ''
    form.role = 'SECRETAIRE'
    form.password = ''
    errors.value = {}
  }
})

const submitCreateUser = async () => {
  errors.value = {}
  const validation = validateForm(CreateUserSchema, form)
  if (!validation.success) {
    errors.value = validation.errors
    return
  }

  loading.value = true
  try {
    await $fetch('/api/users', {
      method: 'POST',
      body: validation.data
    })
    const msg = `Compte utilisateur "${form.name}" créé avec succès !`
    isOpen.value = false
    emit('created', msg)
  } catch (err: any) {
    errors.value = {
      username: err.data?.statusMessage || err.message || 'Erreur lors de la création du compte'
    }
  } finally {
    loading.value = false
  }
}
</script>

<template>
  <AppModal
    v-model="isOpen"
    title="Ajouter un compte collaborateur"
    description="Créez un compte d'accès et attribuez-lui son rôle dans l'entreprise."
    icon="i-lucide-user-plus"
    confirm-label="Créer le Compte"
    :confirm-loading="loading"
    @confirm="submitCreateUser"
    @cancel="isOpen = false"
  >
    <form class="space-y-4 py-2" @submit.prevent="submitCreateUser">
      <AppInput
        v-model="form.name"
        label="Nom complet du collaborateur"
        placeholder="ex: Mme Ngo Biboum, M. Kamga..."
        :error="errors.name"
        required
      />

      <AppInput
        v-model="form.username"
        label="Identifiant de connexion (unique)"
        placeholder="ex: secretaire, technicien2..."
        :error="errors.username"
        required
      />

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
        label="Mot de passe temporaire (min 8 caractères)"
        placeholder="••••••••••••"
        :error="errors.password"
        required
      />
    </form>
  </AppModal>
</template>
