<script setup lang="ts">
import { UpdateCredentialsSchema } from '~~/shared/schemas'

function getErrorMessage(err: unknown, fallback: string): string {
  if (typeof err !== 'object' || err === null) {
    return fallback
  }

  if ('data' in err && typeof err.data === 'object' && err.data !== null
    && 'statusMessage' in err.data && typeof err.data.statusMessage === 'string') {
    return err.data.statusMessage
  }
  if ('message' in err && typeof err.message === 'string') {
    return err.message
  }

  return fallback
}

useHead({
  title: 'Mon compte'
})

const { user, roleLabel } = useAuth()
const requestToast = useRequestToast()

const form = reactive({
  username: user.value?.username || '',
  currentPassword: '',
  newPassword: '',
  confirmPassword: ''
})

const errors = ref<Record<string, string>>({})
const loading = ref(false)
const errorMessage = ref('')

watch(() => user.value?.username, (username) => {
  if (username) {
    form.username = username
  }
}, { immediate: true })

const updateCredentials = async () => {
  errors.value = {}
  errorMessage.value = ''

  const usernameChanged = form.username.trim().toLowerCase() !== user.value?.username
  const passwordChanged = form.newPassword.length > 0

  if (!usernameChanged && !passwordChanged) {
    errorMessage.value = 'Modifiez votre identifiant ou saisissez un nouveau mot de passe.'
    return
  }

  if (passwordChanged && form.newPassword !== form.confirmPassword) {
    errors.value.confirmPassword = 'La confirmation du mot de passe ne correspond pas.'
    errorMessage.value = errors.value.confirmPassword
    return
  }

  const validation = UpdateCredentialsSchema.safeParse({
    currentPassword: form.currentPassword,
    username: usernameChanged ? form.username : undefined,
    newPassword: passwordChanged ? form.newPassword : undefined
  })

  if (!validation.success) {
    for (const issue of validation.error.errors) {
      const field = issue.path[0]
      if (typeof field === 'string') {
        errors.value[field] = issue.message
      }
    }
    errorMessage.value = validation.error.errors[0]?.message || 'Vérifiez les informations saisies.'
    return
  }

  loading.value = true
  try {
    const response = await useApi().put<{ success: boolean, user: { username: string } }>('/api/auth/profile', validation.data)
    const result = response.data

    if (user.value) {
      user.value = { ...user.value, username: result.user.username }
    }
    form.username = result.user.username
    form.currentPassword = ''
    form.newPassword = ''
    form.confirmPassword = ''
    requestToast.success('Vos identifiants ont été mis à jour.')
  } catch (err: unknown) {
    requestToast.error(getErrorMessage(err, 'Erreur lors de la mise à jour de vos identifiants.'))
  } finally {
    loading.value = false
  }
}
</script>

<template>
  <div class="max-w-2xl mx-auto space-y-6">
    <div>
      <h1 class="text-2xl font-bold tracking-tight text-slate-900 dark:text-white">
        Mon compte
      </h1>
      <p class="mt-1 text-sm text-slate-500 dark:text-slate-400">
        Modifiez votre identifiant ou votre mot de passe. Votre rôle reste géré par l’administrateur.
      </p>
    </div>

    <AppCard
      title="Identifiants de connexion"
      icon="i-lucide-user-round-cog"
      description="Le mot de passe actuel est demandé pour confirmer toute modification."
    >
      <form
        class="space-y-4"
        @submit.prevent="updateCredentials"
      >
        <div
          v-if="errorMessage"
          class="rounded-lg border border-red-200 bg-red-50 p-3 text-sm text-red-700 dark:border-red-900 dark:bg-red-950/40 dark:text-red-300"
        >
          {{ errorMessage }}
        </div>

        <AppInput
          v-model="form.username"
          label="Identifiant de connexion"
          :error="errors.username"
          required
        />

        <div class="rounded-lg border border-slate-200 bg-slate-50 p-3 dark:border-slate-700 dark:bg-slate-800/50">
          <p class="text-xs text-slate-500 dark:text-slate-400">
            Rôle du compte
          </p>
          <p class="mt-1 text-sm font-semibold text-slate-800 dark:text-slate-200">
            {{ roleLabel }}
          </p>
          <p class="mt-1 text-xs text-slate-500 dark:text-slate-400">
            Le rôle ne peut pas être modifié depuis cette page.
          </p>
        </div>

        <AppInput
          v-model="form.currentPassword"
          type="password"
          label="Mot de passe actuel"
          :error="errors.currentPassword"
          required
        />

        <AppInput
          v-model="form.newPassword"
          type="password"
          label="Nouveau mot de passe (laisser vide pour ne pas le modifier)"
          :error="errors.newPassword"
        />

        <AppInput
          v-model="form.confirmPassword"
          type="password"
          label="Confirmer le nouveau mot de passe"
          :error="errors.confirmPassword"
        />

        <div class="flex justify-end pt-2">
          <AppButton
            type="submit"
            variant="primary"
            icon="i-lucide-save"
            label="Enregistrer mes identifiants"
            :loading="loading"
          />
        </div>
      </form>
    </AppCard>
  </div>
</template>
