<script setup lang="ts">
import { LoginSchema, validateForm } from '~~/shared/schemas'

const { login } = useAuth()
const router = useRouter()
const requestToast = useRequestToast()

useSeoMeta({
  title: 'Grand Luix SARL - Gestion des dépenses',
  description: 'Espace sécurisé de gestion des dépenses, engagements et justificatifs de Grand Luix SARL.',
  ogTitle: 'Grand Luix SARL - Gestion des dépenses',
  ogDescription: 'Suivi sécurisé des dépenses, engagements et justificatifs de Grand Luix SARL.',
  ogType: 'website',
  ogUrl: 'https://controledepenses.grandluixdepense.com/login',
  twitterCard: 'summary'
})

const form = reactive({
  username: '',
  password: ''
})

const formErrors = ref<Record<string, string>>({})
const loading = ref(false)
const errorMessage = ref('')

const handleLogin = async () => {
  formErrors.value = {}
  errorMessage.value = ''

  const validation = validateForm(LoginSchema, {
    username: form.username,
    password: form.password
  })

  if (!validation.success) {
    formErrors.value = validation.errors
    errorMessage.value = validation.firstError
    return
  }

  loading.value = true
  try {
    await login({
      username: validation.data!.username,
      password: validation.data!.password
    })
    await router.push('/')
  } catch (err: any) {
    requestToast.error(err.data?.statusMessage || err.message || 'Identifiant ou mot de passe incorrect')
  } finally {
    loading.value = false
  }
}
</script>

<template>
  <div class="min-h-screen flex flex-col justify-center py-12 sm:px-6 lg:px-8 bg-slate-100 dark:bg-slate-950 px-4">
    <div class="sm:mx-auto sm:w-full sm:max-w-md text-center">
      <div class="inline-flex items-center justify-center w-12 h-12 rounded-xl bg-emerald-600 text-white font-bold text-xl shadow-md mb-4">
        GL
      </div>
      <h1 class="text-2xl font-bold tracking-tight text-slate-900 dark:text-white">
        Grand Luix SARL
      </h1>
      <p class="mt-2 text-sm text-slate-600 dark:text-slate-400">
        Gestion et suivi des dépenses
      </p>
    </div>

    <div class="mt-8 sm:mx-auto sm:w-full sm:max-w-md">
      <AppCard>
        <form class="space-y-4" @submit.prevent="handleLogin">
          <!-- Alerte d'erreur -->
          <AppCard
            v-if="errorMessage"
            variant="danger"
            icon="i-lucide-alert-circle"
            :title="errorMessage"
          />

          <AppInput
            v-model="form.username"
            type="text"
            label="Identifiant"
            placeholder="Votre identifiant"
            icon="i-lucide-user"
            :error="formErrors.username"
            required
            size="md"
          />

          <AppInput
            v-model="form.password"
            type="password"
            label="Mot de passe"
            placeholder="••••••••••••"
            :error="formErrors.password"
            required
            size="md"
          />

          <div class="pt-2">
            <AppButton
              type="submit"
              variant="primary"
              size="md"
              block
              :loading="loading"
              icon="i-lucide-lock"
              label="Se connecter au tableau de bord"
            />
          </div>
        </form>

        <template #footer>
          <div class="text-center text-xs text-slate-500 space-y-1">
            <p class="font-medium text-slate-700 dark:text-slate-400">
              Sécurité renforcée (Argon2id • Session Opaque • SSL)
            </p>
            <p>Seul le patron dispose d’un accès au système.</p>
          </div>
        </template>
      </AppCard>
    </div>
  </div>
</template>
