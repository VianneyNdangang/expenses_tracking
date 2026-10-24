<script setup lang="ts">
import { CreateUserSchema, USER_ROLES, type UserRole, UserRoleEnum, validateForm } from '~~/shared/schemas'

interface Props {
  modelValue: boolean
}

const props = defineProps<Props>()
const requestToast = useRequestToast()

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
const roleOptions = USER_ROLES.map(role => ({
  label: role.label,
  description: role.description.split(':')[0],
  value: role.value
}))

const errors = ref<Record<string, string>>({})
const loading = ref(false)

const setRole = (value: string) => {
  const parsedRole = UserRoleEnum.safeParse(value)
  if (parsedRole.success) {
    form.role = parsedRole.data
  }
}

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
    await useApi().post('/api/users', validation.data)
    const msg = `Compte utilisateur "${form.name}" créé avec succès !`
    isOpen.value = false
    emit('created', msg)
  } catch (err: any) {
    requestToast.error(err.data?.statusMessage || err.message || 'Erreur lors de la création du compte')
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

      <AppSelect
        :model-value="form.role"
        label="Rôle et responsabilités"
        :items="roleOptions"
        :error="errors.role"
        required
        @update:model-value="setRole"
      />

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
