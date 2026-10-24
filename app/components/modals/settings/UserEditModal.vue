<script setup lang="ts">
import { UpdateUserSchema, USER_ROLES, type UserRole, UserRoleEnum, validateForm } from '~~/shared/schemas'

interface Props {
  modelValue: boolean
  user: any | null
}

const props = withDefaults(defineProps<Props>(), {
  user: null
})
const requestToast = useRequestToast()

const { user: loggedInUser } = useAuth()
const isEditingOwnAccount = computed(() => props.user?.id === loggedInUser.value?.id)

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
    await useApi().put(`/api/users/${form.id}`, validation.data)
    const msg = `Utilisateur "${form.name}" mis à jour avec succès !`
    isOpen.value = false
    emit('updated', msg)
  } catch (err: any) {
    requestToast.error(err.data?.statusMessage || err.message || 'Erreur lors de la mise à jour')
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

      <div>
        <p v-if="isEditingOwnAccount" class="text-xs text-slate-500 mb-2">
          Le rôle de votre propre compte ne peut pas être modifié.
        </p>
        <AppSelect
          :model-value="form.role"
          label="Rôle et responsabilités"
          :items="roleOptions"
          :disabled="isEditingOwnAccount"
          @update:model-value="setRole"
        />
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
