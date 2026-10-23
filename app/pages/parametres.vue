<script setup lang="ts">
import {
  SettingsSchema,
  ChangePasswordSchema,
  CreateUserSchema,
  UpdateUserSchema,
  USER_ROLES,
  type UserRole,
  validateForm
} from '~~/shared/schemas'

useHead({
  title: 'Paramètres & Sécurité'
})

const { user: currentConnectedUser } = useAuth()
const activeTab = ref<'settings' | 'template' | 'users' | 'security' | 'sessions'>('settings')

// 1. Paramètres
const { data: settings, refresh: refreshSettings } = await useFetch('/api/settings')
const settingsForm = reactive({
  patronCivility: 'M.' as 'M.' | 'Mme' | 'Mlle',
  patronName: '',
  patronPhone: '',
  patronAddress: '',
  defaultCity: 'Yaoundé',
  justificationDelayDays: 7,
  toleranceThreshold: 10,
  suspectThreshold: 20
})

const settingsErrors = ref<Record<string, string>>({})

watch(settings, (val) => {
  if (val) {
    settingsForm.patronCivility = val.patronCivility
    settingsForm.patronName = val.patronName
    settingsForm.patronPhone = val.patronPhone
    settingsForm.patronAddress = val.patronAddress
    settingsForm.defaultCity = val.defaultCity
    settingsForm.justificationDelayDays = val.justificationDelayDays
    settingsForm.toleranceThreshold = val.toleranceThreshold
    settingsForm.suspectThreshold = val.suspectThreshold
  }
}, { immediate: true })

// 2. Modèle de lettre
const { data: templateData, refresh: refreshTemplate } = await useFetch('/api/template')
const templateContent = ref('')
const templateErrors = ref<Record<string, string>>({})
const isPasswordConfirmModalOpen = ref(false)
const patronPasswordConfirm = ref('')
const passwordConfirmError = ref('')
const createVersionLoading = ref(false)
const activatingVersion = ref<number | null>(null)

watch(templateData, (val) => {
  if (val && !templateContent.value) {
    templateContent.value = val.content
  }
}, { immediate: true })

// 3. Utilisateurs & Rôles
const { data: usersData, refresh: refreshUsers } = await useFetch('/api/users')
const usersList = computed(() => usersData.value?.users || [])

const isCreateUserModalOpen = ref(false)
const createUserForm = reactive({
  username: '',
  name: '',
  role: 'SECRETAIRE' as UserRole,
  password: ''
})
const createUserErrors = ref<Record<string, string>>({})
const createUserLoading = ref(false)

const isEditUserModalOpen = ref(false)
const editUserForm = reactive({
  id: '',
  username: '',
  name: '',
  role: 'SECRETAIRE' as UserRole,
  password: ''
})
const editUserErrors = ref<Record<string, string>>({})
const editUserLoading = ref(false)

const isDeleteUserModalOpen = ref(false)
const userToDelete = ref<any>(null)
const deleteUserLoading = ref(false)

const openCreateUserModal = () => {
  createUserForm.username = ''
  createUserForm.name = ''
  createUserForm.role = 'SECRETAIRE'
  createUserForm.password = ''
  createUserErrors.value = {}
  isCreateUserModalOpen.value = true
}

const submitCreateUser = async () => {
  createUserErrors.value = {}
  const validation = validateForm(CreateUserSchema, createUserForm)
  if (!validation.success) {
    createUserErrors.value = validation.errors
    return
  }

  createUserLoading.value = true
  try {
    await $fetch('/api/users', {
      method: 'POST',
      body: validation.data
    })
    successMsg.value = `Compte utilisateur "${createUserForm.name}" créé avec succès !`
    isCreateUserModalOpen.value = false
    await refreshUsers()
  } catch (err: any) {
    createUserErrors.value = {
      username: err.data?.statusMessage || err.message || 'Erreur lors de la création du compte'
    }
  } finally {
    createUserLoading.value = false
  }
}

const openEditUserModal = (targetUser: any) => {
  editUserForm.id = targetUser.id
  editUserForm.username = targetUser.username
  editUserForm.name = targetUser.name
  editUserForm.role = targetUser.role
  editUserForm.password = ''
  editUserErrors.value = {}
  isEditUserModalOpen.value = true
}

const submitEditUser = async () => {
  editUserErrors.value = {}
  const payload: any = {
    name: editUserForm.name,
    role: editUserForm.role
  }
  if (editUserForm.password && editUserForm.password.trim().length > 0) {
    payload.password = editUserForm.password
  }

  const validation = validateForm(UpdateUserSchema, payload)
  if (!validation.success) {
    editUserErrors.value = validation.errors
    return
  }

  editUserLoading.value = true
  try {
    await $fetch(`/api/users/${editUserForm.id}`, {
      method: 'PUT',
      body: validation.data
    })
    successMsg.value = `Utilisateur "${editUserForm.name}" mis à jour avec succès !`
    isEditUserModalOpen.value = false
    await refreshUsers()
  } catch (err: any) {
    editUserErrors.value = {
      name: err.data?.statusMessage || err.message || 'Erreur lors de la mise à jour'
    }
  } finally {
    editUserLoading.value = false
  }
}

const openDeleteUserModal = (targetUser: any) => {
  userToDelete.value = targetUser
  isDeleteUserModalOpen.value = true
}

const submitDeleteUser = async () => {
  if (!userToDelete.value) return
  deleteUserLoading.value = true
  try {
    await $fetch(`/api/users/${userToDelete.value.id}`, {
      method: 'DELETE'
    })
    successMsg.value = `L'utilisateur "${userToDelete.value.name}" a été supprimé avec succès.`
    isDeleteUserModalOpen.value = false
    userToDelete.value = null
    await refreshUsers()
  } catch (err: any) {
    errorMsg.value = err.data?.statusMessage || err.message || 'Erreur lors de la suppression'
    isDeleteUserModalOpen.value = false
  } finally {
    deleteUserLoading.value = false
  }
}

// 4. Changement de mot de passe
const passwordForm = reactive({
  currentPassword: '',
  newPassword: '',
  confirmPassword: ''
})
const passwordErrors = ref<Record<string, string>>({})

// 5. Sessions
const { data: sessions, refresh: refreshSessions } = await useFetch('/api/auth/sessions')

const loading = ref(false)
const successMsg = ref('')
const errorMsg = ref('')

const clearMessages = () => {
  successMsg.value = ''
  errorMsg.value = ''
  settingsErrors.value = {}
  templateErrors.value = {}
  passwordErrors.value = {}
}

const saveSettings = async () => {
  clearMessages()

  const validation = validateForm(SettingsSchema, {
    patronCivility: settingsForm.patronCivility,
    patronName: settingsForm.patronName,
    patronPhone: settingsForm.patronPhone,
    patronAddress: settingsForm.patronAddress,
    defaultCity: settingsForm.defaultCity,
    justificationDelayDays: Number(settingsForm.justificationDelayDays),
    toleranceThreshold: Number(settingsForm.toleranceThreshold),
    suspectThreshold: Number(settingsForm.suspectThreshold)
  })

  if (!validation.success) {
    settingsErrors.value = validation.errors
    errorMsg.value = validation.firstError
    return
  }

  loading.value = true
  try {
    await $fetch('/api/settings', {
      method: 'PUT',
      body: validation.data
    })
    successMsg.value = 'Paramètres généraux enregistrés avec succès'
    await refreshSettings()
  } catch (err: any) {
    errorMsg.value = err.data?.statusMessage || err.message || 'Erreur lors de l’enregistrement'
  } finally {
    loading.value = false
  }
}

// Ouvre la modale pour confirmer la création de version avec mot de passe
const openPasswordConfirmModal = () => {
  clearMessages()
  templateErrors.value = {}
  if (!templateContent.value || templateContent.value.trim().length < 50) {
    templateErrors.value = { content: 'Le texte du modèle doit comporter au moins 50 caractères' }
    errorMsg.value = 'Le texte du modèle doit comporter au moins 50 caractères'
    return
  }

  patronPasswordConfirm.value = ''
  passwordConfirmError.value = ''
  isPasswordConfirmModalOpen.value = true
}

// Validation de la création de version avec vérification du mot de passe
const submitCreateVersion = async () => {
  passwordConfirmError.value = ''
  if (!patronPasswordConfirm.value) {
    passwordConfirmError.value = 'Veuillez saisir votre mot de passe pour confirmer'
    return
  }

  createVersionLoading.value = true
  try {
    const res = await $fetch<{ success: boolean; message?: string; template: any }>('/api/template', {
      method: 'POST',
      body: {
        content: templateContent.value,
        password: patronPasswordConfirm.value
      }
    })

    isPasswordConfirmModalOpen.value = false
    patronPasswordConfirm.value = ''
    successMsg.value = res.message || 'Nouvelle version du modèle créée et activée avec succès'
    await refreshTemplate()
  } catch (err: any) {
    passwordConfirmError.value = err.data?.statusMessage || err.message || 'Mot de passe incorrect'
  } finally {
    createVersionLoading.value = false
  }
}

// Basculer d'un modèle à l'autre (activer une version existante)
const activateTemplateVersion = async (version: number) => {
  clearMessages()
  activatingVersion.value = version
  try {
    const res = await $fetch<{ success: boolean; message?: string }>('/api/template/activate', {
      method: 'POST',
      body: { version }
    })
    successMsg.value = res.message || `Le modèle v${version} a été activé avec succès`
    await refreshTemplate()
    // Si on active un modèle, on met aussi à jour le texte dans l'éditeur
    const active = templateData.value?.templates?.find((t: any) => t.version === version)
    if (active) {
      templateContent.value = active.content
    }
  } catch (err: any) {
    errorMsg.value = err.data?.statusMessage || err.message || 'Erreur lors de l’activation du modèle'
  } finally {
    activatingVersion.value = null
  }
}

// Charger le texte d'un modèle dans l'éditeur
const loadTemplateToEditor = (tpl: any) => {
  templateContent.value = tpl.content
  successMsg.value = `Contenu du modèle version v${tpl.version} chargé dans l'éditeur`
}

const changePassword = async () => {
  clearMessages()
  if (passwordForm.newPassword !== passwordForm.confirmPassword) {
    passwordErrors.value = { confirmPassword: 'Le nouveau mot de passe et sa confirmation ne correspondent pas' }
    errorMsg.value = 'Le nouveau mot de passe et sa confirmation ne correspondent pas'
    return
  }

  const validation = validateForm(ChangePasswordSchema, {
    currentPassword: passwordForm.currentPassword,
    newPassword: passwordForm.newPassword
  })

  if (!validation.success) {
    passwordErrors.value = validation.errors
    errorMsg.value = validation.firstError
    return
  }

  loading.value = true
  try {
    await $fetch('/api/auth/change-password', {
      method: 'POST',
      body: validation.data
    })
    successMsg.value = 'Mot de passe patron mis à jour avec succès (hachage Argon2id)'
    passwordForm.currentPassword = ''
    passwordForm.newPassword = ''
    passwordForm.confirmPassword = ''
  } catch (err: any) {
    errorMsg.value = err.data?.statusMessage || err.message || 'Erreur lors de la modification'
  } finally {
    loading.value = false
  }
}

const revokeSession = async (sessionId: string) => {
  clearMessages()
  try {
    await $fetch(`/api/auth/sessions/${sessionId}`, { method: 'DELETE' })
    successMsg.value = 'Session distante révoquée avec succès'
    await refreshSessions()
  } catch (err: any) {
    errorMsg.value = err.data?.statusMessage || err.message || 'Erreur lors de la révocation'
  }
}

// Dictionnaire complet des variables formatées pour la direction / patron
interface TemplateVariableItem {
  key: string
  label: string
  shortLabel: string
  description: string
  example: string
  category: 'employe' | 'finance' | 'direction'
  icon: string
  tag: string
  badgeClass: string
}

const TEMPLATE_VARIABLES: TemplateVariableItem[] = [
  // 1. Catégorie Employé
  {
    key: 'accord_soussigne',
    label: 'Accord de genre (soussigné / soussignée)',
    shortLabel: 'Accord soussigné(e)',
    description: 'S\'accorde automatiquement au masculin ou au féminin selon la civilité de l\'employé (M. ou Mme/Mlle).',
    example: 'soussigné',
    category: 'employe',
    icon: 'i-lucide-user-check',
    tag: '{accord_soussigne}',
    badgeClass: 'bg-blue-50 text-blue-700 border-blue-200 dark:bg-blue-950/40 dark:text-blue-300 dark:border-blue-800'
  },
  {
    key: 'nom_employe',
    label: 'Nom complet de l\'employé',
    shortLabel: 'Nom de l\'employé',
    description: 'Civilité et nom officiel de l\'employé qui reçoit les fonds et signe la décharge.',
    example: 'M. Jean DUPONT',
    category: 'employe',
    icon: 'i-lucide-user',
    tag: '{nom_employe}',
    badgeClass: 'bg-blue-50 text-blue-700 border-blue-200 dark:bg-blue-950/40 dark:text-blue-300 dark:border-blue-800'
  },
  {
    key: 'cni_employe',
    label: 'Numéro de CNI de l\'employé',
    shortLabel: 'N° CNI employé',
    description: 'Numéro officiel de la carte nationale d\'identité du travailleur (masqué pour confidentialité).',
    example: '1023 •••• ••••',
    category: 'employe',
    icon: 'i-lucide-id-card',
    tag: '{cni_employe}',
    badgeClass: 'bg-blue-50 text-blue-700 border-blue-200 dark:bg-blue-950/40 dark:text-blue-300 dark:border-blue-800'
  },
  {
    key: 'telephone_employe',
    label: 'Numéro de téléphone de l\'employé',
    shortLabel: 'Téléphone employé',
    description: 'Numéro de contact téléphonique joignable de l\'employé.',
    example: '+237 699 ••• •••',
    category: 'employe',
    icon: 'i-lucide-phone',
    tag: '{telephone_employe}',
    badgeClass: 'bg-blue-50 text-blue-700 border-blue-200 dark:bg-blue-950/40 dark:text-blue-300 dark:border-blue-800'
  },

  // 2. Catégorie Finance & Opération
  {
    key: 'montant_chiffres',
    label: 'Montant en chiffres (FCFA)',
    shortLabel: 'Montant en chiffres',
    description: 'Montant alloué en chiffres FCFA (ex : 250 000).',
    example: '250 000',
    category: 'finance',
    icon: 'i-lucide-coins',
    tag: '{montant_chiffres}',
    badgeClass: 'bg-emerald-50 text-emerald-700 border-emerald-200 dark:bg-emerald-950/40 dark:text-emerald-300 dark:border-emerald-800'
  },
  {
    key: 'montant_lettres',
    label: 'Montant en toutes lettres',
    shortLabel: 'Montant en lettres',
    description: 'Somme écrite mot pour mot garantissant la pleine valeur juridique devant témoins.',
    example: 'Deux cent cinquante mille Francs CFA',
    category: 'finance',
    icon: 'i-lucide-spell-check',
    tag: '{montant_lettres}',
    badgeClass: 'bg-emerald-50 text-emerald-700 border-emerald-200 dark:bg-emerald-950/40 dark:text-emerald-300 dark:border-emerald-800'
  },
  {
    key: 'motif',
    label: 'Motif / Justification de l\'opération',
    shortLabel: 'Motif de l\'opération',
    description: 'Raison de la sortie de fonds (achat matériel, avance, salaire, etc.).',
    example: 'Achat de fer et ciment pour coffrage dalle magasin',
    category: 'finance',
    icon: 'i-lucide-file-text',
    tag: '{motif}',
    badgeClass: 'bg-emerald-50 text-emerald-700 border-emerald-200 dark:bg-emerald-950/40 dark:text-emerald-300 dark:border-emerald-800'
  },
  {
    key: 'delai_jours',
    label: 'Délai de justification (jours)',
    shortLabel: 'Délai accordé (jours)',
    description: 'Nombre de jours calendaires accordés pour apporter les justificatifs.',
    example: '7',
    category: 'finance',
    icon: 'i-lucide-clock',
    tag: '{delai_jours}',
    badgeClass: 'bg-emerald-50 text-emerald-700 border-emerald-200 dark:bg-emerald-950/40 dark:text-emerald-300 dark:border-emerald-800'
  },

  // 3. Catégorie Direction Générale & Date
  {
    key: 'titre_patron',
    label: 'Civilité du patron',
    shortLabel: 'Civilité patron',
    description: 'Titre de politesse officiel (M. ou Mme).',
    example: 'M.',
    category: 'direction',
    icon: 'i-lucide-crown',
    tag: '{titre_patron}',
    badgeClass: 'bg-purple-50 text-purple-700 border-purple-200 dark:bg-purple-950/40 dark:text-purple-300 dark:border-purple-800'
  },
  {
    key: 'nom_patron',
    label: 'Nom du patron',
    shortLabel: 'Nom du patron',
    description: 'Nom officiel du chef d\'entreprise figurant dans les statuts.',
    example: 'El Hadj Abdouraman',
    category: 'direction',
    icon: 'i-lucide-building',
    tag: '{nom_patron}',
    badgeClass: 'bg-purple-50 text-purple-700 border-purple-200 dark:bg-purple-950/40 dark:text-purple-300 dark:border-purple-800'
  },
  {
    key: 'ville',
    label: 'Ville d\'engagement',
    shortLabel: 'Ville du siège',
    description: 'Ville où la lettre d\'engagement est établie et signée.',
    example: 'Yaoundé',
    category: 'direction',
    icon: 'i-lucide-map-pin',
    tag: '{ville}',
    badgeClass: 'bg-purple-50 text-purple-700 border-purple-200 dark:bg-purple-950/40 dark:text-purple-300 dark:border-purple-800'
  },
  {
    key: 'date',
    label: 'Date complète de signature',
    shortLabel: 'Date officielle',
    description: 'Date du jour au format complet (ex : 23 octobre 2026).',
    example: '23 octobre 2026',
    category: 'direction',
    icon: 'i-lucide-calendar',
    tag: '{date}',
    badgeClass: 'bg-purple-50 text-purple-700 border-purple-200 dark:bg-purple-950/40 dark:text-purple-300 dark:border-purple-800'
  }
]

const editorTextareaRef = ref<HTMLTextAreaElement | null>(null)
const selectedCategory = ref<'all' | 'employe' | 'finance' | 'direction'>('all')
const editorViewMode = ref<'edit' | 'formatted' | 'simulation'>('edit')
const isGuideOpen = ref(false)
const historyViewMode = ref<'patron' | 'simulation' | 'raw'>('patron')
const expandedHistoryId = ref<string | null>(null)
const lastInsertedVariable = ref<string>('')

const filteredVariables = computed(() => {
  if (selectedCategory.value === 'all') return TEMPLATE_VARIABLES
  return TEMPLATE_VARIABLES.filter(v => v.category === selectedCategory.value)
})

// Insertion intelligente de la variable à la position exacte du curseur
const insertVariable = (variableKey: string) => {
  const item = TEMPLATE_VARIABLES.find(v => v.key === variableKey)
  const tag = `{${variableKey}}`

  if (!editorTextareaRef.value) {
    templateContent.value = (templateContent.value ? templateContent.value + ' ' : '') + tag
    lastInsertedVariable.value = item ? item.shortLabel : variableKey
    setTimeout(() => { lastInsertedVariable.value = '' }, 2500)
    return
  }

  const textarea = editorTextareaRef.value
  const start = textarea.selectionStart ?? templateContent.value.length
  const end = textarea.selectionEnd ?? templateContent.value.length

  const before = templateContent.value.substring(0, start)
  const after = templateContent.value.substring(end)

  const prefix = before.length > 0 && !before.endsWith(' ') && !before.endsWith('\n') ? ' ' : ''
  const suffix = after.length > 0 && !after.startsWith(' ') && !after.startsWith('\n') ? ' ' : ''

  templateContent.value = before + prefix + tag + suffix + after
  lastInsertedVariable.value = item ? item.shortLabel : variableKey
  setTimeout(() => { lastInsertedVariable.value = '' }, 2500)

  nextTick(() => {
    textarea.focus()
    const newPos = start + prefix.length + tag.length + suffix.length
    textarea.setSelectionRange(newPos, newPos)
  })
}

// Formatage en texte fluide pour le patron (remplace {cle} par [Libellé en français])
const formatForPatronText = (text: string): string => {
  if (!text) return ''
  let result = text
  for (const v of TEMPLATE_VARIABLES) {
    const regex = new RegExp(`\\{${v.key}\\}`, 'g')
    result = result.replace(regex, `[${v.shortLabel}]`)
  }
  return result
}

// Formatage HTML avec pastilles stylisées pour lecture confortable par le patron
const formatForPatronHtml = (text: string): string => {
  if (!text) return ''
  let escaped = text
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')

  for (const v of TEMPLATE_VARIABLES) {
    const regex = new RegExp(`\\{${v.key}\\}`, 'g')
    const colorClasses = v.category === 'employe'
      ? 'bg-blue-100 text-blue-800 dark:bg-blue-950/70 dark:text-blue-300 border-blue-300 dark:border-blue-700'
      : v.category === 'finance'
      ? 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950/70 dark:text-emerald-300 border-emerald-300 dark:border-emerald-700'
      : 'bg-purple-100 text-purple-800 dark:bg-purple-950/70 dark:text-purple-300 border-purple-300 dark:border-purple-700'

    const badgeHtml = `<span class="inline-flex items-center gap-1 px-2 py-0.5 my-0.5 rounded text-[11px] font-sans font-semibold border ${colorClasses} shadow-2xs select-none" title="${v.label} — Exemple : ${v.example}"><span>${v.shortLabel}</span></span>`
    escaped = escaped.replace(regex, badgeHtml)
  }
  return escaped
}

// Fonction de simulation pour un texte quelconque
const renderSimulatedText = (text: string): string => {
  if (!text) return ''
  return text
    .replace(/{accord_soussigne}/g, 'soussigné')
    .replace(/{nom_employe}/g, 'M. Jean DUPONT')
    .replace(/{cni_employe}/g, '1023 •••• ••••')
    .replace(/{telephone_employe}/g, '+237 699 ••• •••')
    .replace(/{montant_chiffres}/g, '250 000')
    .replace(/{montant_lettres}/g, 'Deux cent cinquante mille Francs CFA')
    .replace(/{titre_patron}/g, settingsForm.patronCivility || 'M.')
    .replace(/{nom_patron}/g, settingsForm.patronName || 'El Hadj Abdouraman')
    .replace(/{motif}/g, 'Achat de fer et ciment pour coffrage dalle magasin')
    .replace(/{delai_jours}/g, String(settingsForm.justificationDelayDays || 7))
    .replace(/{ville}/g, settingsForm.defaultCity || 'Yaoundé')
    .replace(/{date}/g, new Date().toLocaleDateString('fr-FR', { day: 'numeric', month: 'long', year: 'numeric' }))
}

// Rendu simulé du modèle en cours d'édition
const simulatedPreview = computed(() => {
  return renderSimulatedText(templateContent.value)
})

// Rendu formaté avec pastilles HTML du modèle en cours d'édition
const formattedPreviewHtml = computed(() => {
  return formatForPatronHtml(templateContent.value)
})
</script>

<template>
  <div class="space-y-6 max-w-4xl mx-auto font-sans">
    <!-- En-tête -->
    <div>
      <h1 class="text-2xl font-bold tracking-tight text-slate-900 dark:text-white">
        Paramètres & Sécurité
      </h1>
      <p class="text-xs sm:text-sm text-slate-500 mt-0.5">
        Configuration de l'entreprise, gestion des modèles de lettre, sessions et sécurité
      </p>
    </div>

    <!-- Alertes -->
    <AppCard
      v-if="successMsg"
      variant="primary"
      icon="i-lucide-check-circle-2"
      :title="successMsg"
    />

    <AppCard
      v-if="errorMsg"
      variant="danger"
      icon="i-lucide-alert-circle"
      :title="errorMsg"
    />

    <!-- Navigation par Onglets -->
    <div class="flex items-center gap-1.5 p-1 bg-slate-100 dark:bg-slate-800 rounded-lg overflow-x-auto">
      <button
        type="button"
        class="h-7 px-3 rounded-lg transition-colors whitespace-nowrap cursor-pointer text-xs inline-flex items-center justify-center font-semibold"
        :class="activeTab === 'settings' ? 'bg-white dark:bg-slate-900 text-emerald-700 dark:text-emerald-400 shadow-xs' : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'"
        @click="activeTab = 'settings'"
      >
        Coordonnées & Seuils
      </button>

      <button
        type="button"
        class="h-7 px-3 rounded-lg transition-colors whitespace-nowrap cursor-pointer text-xs inline-flex items-center justify-center font-semibold"
        :class="activeTab === 'template' ? 'bg-white dark:bg-slate-900 text-emerald-700 dark:text-emerald-400 shadow-xs' : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'"
        @click="activeTab = 'template'"
      >
        Modèles de Lettre & Versions
      </button>

      <button
        type="button"
        class="h-7 px-3 rounded-lg transition-colors whitespace-nowrap cursor-pointer text-xs inline-flex items-center justify-center font-semibold"
        :class="activeTab === 'users' ? 'bg-white dark:bg-slate-900 text-emerald-700 dark:text-emerald-400 shadow-xs' : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'"
        @click="activeTab = 'users'"
      >
        Équipe & Rôles ({{ usersList?.length || 0 }})
      </button>

      <button
        type="button"
        class="h-7 px-3 rounded-lg transition-colors whitespace-nowrap cursor-pointer text-xs inline-flex items-center justify-center font-semibold"
        :class="activeTab === 'security' ? 'bg-white dark:bg-slate-900 text-emerald-700 dark:text-emerald-400 shadow-xs' : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'"
        @click="activeTab = 'security'"
      >
        Sécurité & Mot de passe
      </button>

      <button
        type="button"
        class="h-7 px-3 rounded-lg transition-colors whitespace-nowrap cursor-pointer text-xs inline-flex items-center justify-center font-semibold"
        :class="activeTab === 'sessions' ? 'bg-white dark:bg-slate-900 text-emerald-700 dark:text-emerald-400 shadow-xs' : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'"
        @click="activeTab = 'sessions'"
      >
        Sessions Actives ({{ sessions?.length || 0 }})
      </button>
    </div>

    <!-- Onglet 1 : Coordonnées Patron & Seuils -->
    <AppCard
      v-if="activeTab === 'settings'"
      title="Identité & Coordonnées du Patron"
      icon="i-lucide-building-2"
    >
      <form class="space-y-4" @submit.prevent="saveSettings">
        <div class="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <div>
            <label class="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
              Civilité
            </label>
            <select
              v-model="settingsForm.patronCivility"
              class="w-full px-3 py-2 text-xs rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800"
            >
              <option value="M.">M.</option>
              <option value="Mme">Mme</option>
            </select>
          </div>

          <div class="sm:col-span-2">
            <AppInput
              v-model="settingsForm.patronName"
              label="Nom complet du patron"
              :error="settingsErrors.patronName"
              required
            />
          </div>
        </div>

        <div class="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <AppInput
            v-model="settingsForm.patronPhone"
            type="tel"
            label="Téléphone officiel"
            :error="settingsErrors.patronPhone"
            required
          />

          <AppInput
            v-model="settingsForm.defaultCity"
            label="Ville par défaut"
            :error="settingsErrors.defaultCity"
            required
          />
        </div>

        <AppInput
          v-model="settingsForm.patronAddress"
          label="Adresse du siège / Résidence"
          :error="settingsErrors.patronAddress"
        />

        <div class="pt-4 border-t border-slate-100 dark:border-slate-800 space-y-4">
          <h3 class="text-xs font-bold text-slate-900 dark:text-white uppercase tracking-wider">
            Règles & Seuils de Tolérance des Dépenses
          </h3>

          <div class="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <AppInput
              v-model.number="settingsForm.justificationDelayDays"
              type="number"
              label="Délai de justification (jours)"
              min="1"
              :error="settingsErrors.justificationDelayDays"
              required
              help="Délai avant déclenchement d'une alerte de retard"
            />

            <AppInput
              v-model.number="settingsForm.toleranceThreshold"
              type="number"
              label="Seuil d'alerte tolérance (%)"
              min="1"
              :error="settingsErrors.toleranceThreshold"
              required
              help="Écart déclenchant 'À vérifier'"
            />

            <AppInput
              v-model.number="settingsForm.suspectThreshold"
              type="number"
              label="Seuil de prix suspect (%)"
              min="1"
              :error="settingsErrors.suspectThreshold"
              required
              help="Écart déclenchant 'Suspect'"
            />
          </div>
        </div>

        <div class="flex justify-end pt-3">
          <AppButton
            type="submit"
            variant="primary"
            size="sm"
            :loading="loading"
            label="Enregistrer les paramètres"
          />
        </div>
      </form>
    </AppCard>

    <!-- Onglet 2 : Modèles de lettre & Passage d'un modèle à l'autre -->
    <div v-if="activeTab === 'template'" class="space-y-6">
      <!-- Bannière d'état du modèle actif -->
      <div class="p-4 rounded-xl bg-gradient-to-r from-emerald-50 to-teal-50 dark:from-emerald-950/30 dark:to-teal-950/20 border border-emerald-200 dark:border-emerald-800 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
        <div class="flex items-center gap-3">
          <div class="w-10 h-10 rounded-lg bg-emerald-600 text-white flex items-center justify-center font-bold text-base shadow-xs">
            v{{ templateData?.version || 1 }}
          </div>
          <div>
            <div class="flex items-center gap-2">
              <span class="text-xs font-bold text-emerald-900 dark:text-emerald-200 uppercase tracking-wider">
                Modèle Actif dans l'application
              </span>
              <span class="px-2 py-0.5 rounded text-[10px] font-extrabold bg-emerald-600 text-white uppercase tracking-wider">
                En service
              </span>
            </div>
            <p class="text-xs text-emerald-800/80 dark:text-emerald-300/80 mt-0.5">
              Utilisé par défaut pour la rédaction et l'impression de toutes les nouvelles lettres d'engagement.
            </p>
          </div>
        </div>

        <div class="text-xs text-slate-500 whitespace-nowrap self-end sm:self-auto">
          {{ templateData?.templates?.length || 1 }} version(s) enregistrée(s)
        </div>
      </div>

      <!-- Section 2A : Passage d'un modèle à l'autre (Liste des versions) -->
      <AppCard
        title="Historique des Modèles & Sélection de la Version Active"
        description="Basculez d'un modèle à l'autre en un clic pour définir la lettre appliquée aux nouveaux engagements"
        icon="i-lucide-history"
        body-class="space-y-4"
      >
        <!-- Barre de filtre/vue pour le patron dans l'historique -->
        <div class="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2 p-2.5 rounded-lg bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-800 text-xs">
          <div class="flex items-center gap-1.5 text-slate-700 dark:text-slate-300 font-medium">
            <UIcon name="i-lucide-eye" class="w-4 h-4 text-emerald-600" />
            <span>Mode de lecture des modèles enregistrés :</span>
          </div>

          <div class="flex items-center gap-1">
            <button
              type="button"
              class="h-6.5 px-2.5 rounded-md text-[11px] font-semibold transition-colors cursor-pointer"
              :class="historyViewMode === 'patron' ? 'bg-emerald-600 text-white shadow-2xs' : 'bg-white dark:bg-slate-800 text-slate-600 dark:text-slate-400 hover:text-slate-900 border border-slate-200 dark:border-slate-700'"
              @click="historyViewMode = 'patron'"
            >
              👤 Vue Patron (Termes clairs)
            </button>
            <button
              type="button"
              class="h-6.5 px-2.5 rounded-md text-[11px] font-semibold transition-colors cursor-pointer"
              :class="historyViewMode === 'simulation' ? 'bg-emerald-600 text-white shadow-2xs' : 'bg-white dark:bg-slate-800 text-slate-600 dark:text-slate-400 hover:text-slate-900 border border-slate-200 dark:border-slate-700'"
              @click="historyViewMode = 'simulation'"
            >
              📄 Exemple Réel (Simulé)
            </button>
            <button
              type="button"
              class="h-6.5 px-2.5 rounded-md text-[11px] font-semibold transition-colors cursor-pointer"
              :class="historyViewMode === 'raw' ? 'bg-emerald-600 text-white shadow-2xs' : 'bg-white dark:bg-slate-800 text-slate-600 dark:text-slate-400 hover:text-slate-900 border border-slate-200 dark:border-slate-700'"
              @click="historyViewMode = 'raw'"
            >
              ⚙️ Code Brut {balises}
            </button>
          </div>
        </div>

        <div class="divide-y divide-slate-100 dark:divide-slate-800">
          <div
            v-for="tpl in templateData?.templates || []"
            :key="tpl.id"
            class="py-3.5 space-y-2 first:pt-0 last:pb-0"
          >
            <div class="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
              <div class="flex items-start gap-3">
                <div
                  class="w-8 h-8 rounded-lg flex items-center justify-center text-xs font-bold shrink-0 mt-0.5"
                  :class="[
                    tpl.isActive
                      ? 'bg-emerald-600 text-white shadow-xs'
                      : 'bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-400 border border-slate-200 dark:border-slate-700'
                  ]"
                >
                  v{{ tpl.version }}
                </div>

                <div>
                  <div class="flex items-center gap-2">
                    <span class="text-xs font-bold text-slate-900 dark:text-white">
                      Modèle de lettre Version {{ tpl.version }}
                    </span>
                    <span
                      v-if="tpl.isActive"
                      class="px-2 py-0.5 rounded text-[10px] font-bold bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300 border border-emerald-300 dark:border-emerald-700"
                    >
                      Actif
                    </span>
                    <span
                      v-else
                      class="px-2 py-0.5 rounded text-[10px] font-semibold bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-400"
                    >
                      Archivé
                    </span>
                  </div>
                  <p class="text-[11px] text-slate-500 mt-0.5">
                    Créé le {{ new Date(tpl.createdAt).toLocaleDateString('fr-FR', { day: 'numeric', month: 'long', year: 'numeric' }) }}
                  </p>
                </div>
              </div>

              <!-- Actions pour passer d'un modèle à l'autre -->
              <div class="flex items-center gap-2 shrink-0 self-end sm:self-auto">
                <button
                  type="button"
                  class="text-[11px] text-emerald-600 dark:text-emerald-400 hover:underline cursor-pointer font-medium mr-1"
                  @click="expandedHistoryId = expandedHistoryId === tpl.id ? null : tpl.id"
                >
                  {{ expandedHistoryId === tpl.id ? 'Masquer le texte' : '👁 Lire en entier' }}
                </button>

                <AppButton
                  variant="outline"
                  size="xs"
                  icon="i-lucide-file-edit"
                  label="Charger dans l'éditeur"
                  title="Charger ce texte dans la zone d'édition"
                  @click="loadTemplateToEditor(tpl)"
                />

                <AppButton
                  v-if="!tpl.isActive"
                  variant="primary"
                  size="xs"
                  icon="i-lucide-check-circle"
                  label="Activer ce modèle"
                  title="Rendre cette version active pour tous les nouveaux engagements"
                  :loading="activatingVersion === tpl.version"
                  @click="activateTemplateVersion(tpl.version)"
                />
                <span
                  v-else
                  class="text-xs font-bold text-emerald-600 dark:text-emerald-400 px-2 py-1 bg-emerald-50 dark:bg-emerald-950/40 rounded border border-emerald-200 dark:border-emerald-800"
                >
                  ✓ En service
                </span>
              </div>
            </div>

            <!-- Extrait textuel ou texte complet adapté pour le patron -->
            <div class="p-2.5 rounded-lg bg-slate-50 dark:bg-slate-900 border border-slate-100 dark:border-slate-800 text-xs text-slate-700 dark:text-slate-300 font-serif leading-relaxed">
              <template v-if="expandedHistoryId === tpl.id">
                <div v-if="historyViewMode === 'patron'" class="whitespace-pre-wrap" v-html="formatForPatronHtml(tpl.content)" />
                <div v-else-if="historyViewMode === 'simulation'" class="whitespace-pre-wrap">
                  {{ renderSimulatedText(tpl.content) }}
                </div>
                <div v-else class="whitespace-pre-wrap font-mono text-[11px]">
                  {{ tpl.content }}
                </div>
              </template>
              <template v-else>
                <p v-if="historyViewMode === 'patron'" class="line-clamp-2 italic">
                  « {{ formatForPatronText(tpl.content.slice(0, 160)) }}... »
                </p>
                <p v-else-if="historyViewMode === 'simulation'" class="line-clamp-2 italic">
                  « {{ renderSimulatedText(tpl.content.slice(0, 160)) }}... »
                </p>
                <p v-else class="line-clamp-2 italic font-mono text-[11px]">
                  « {{ tpl.content.slice(0, 140) }}... »
                </p>
              </template>
            </div>
          </div>
        </div>
      </AppCard>

      <!-- Section 2B : Éditeur de modèle & Création protégée par mot de passe -->
      <AppCard
        title="Création d'une Nouvelle Version de Modèle"
        icon="i-lucide-file-text"
        description="Rédigez ou personnalisez le texte officiel. Cliquez sur les termes ci-dessous pour insérer des champs automatiques en français clair."
      >
        <div class="space-y-4">
          <!-- Guide des termes & Boutons d'insertion formatés pour le patron -->
          <div class="space-y-2.5 p-3.5 rounded-xl bg-slate-50 dark:bg-slate-900/60 border border-slate-200 dark:border-slate-800">
            <div class="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
              <div class="flex items-center gap-2">
                <UIcon name="i-lucide-sparkles" class="w-4 h-4 text-emerald-600" />
                <span class="text-xs font-bold text-slate-900 dark:text-white uppercase tracking-wider">
                  Champs automatiques pour la lettre (Cliquez pour insérer) :
                </span>
              </div>

              <!-- Bouton dépliant le guide patron -->
              <button
                type="button"
                class="text-xs font-semibold text-emerald-600 dark:text-emerald-400 hover:text-emerald-700 dark:hover:text-emerald-300 inline-flex items-center gap-1 cursor-pointer self-start sm:self-auto"
                @click="isGuideOpen = !isGuideOpen"
              >
                <UIcon :name="isGuideOpen ? 'i-lucide-chevron-up' : 'i-lucide-help-circle'" class="w-4 h-4" />
                <span>{{ isGuideOpen ? 'Fermer le guide' : '📖 Guide & Explication des termes' }}</span>
              </button>
            </div>

            <!-- Guide détaillé dépliable pour patron non-technicien -->
            <div
              v-if="isGuideOpen"
              class="p-3 rounded-lg bg-white dark:bg-slate-800 border border-emerald-200 dark:border-emerald-800 space-y-2.5 text-xs text-slate-700 dark:text-slate-300"
            >
              <div class="flex items-start gap-2.5 text-emerald-900 dark:text-emerald-300 font-medium">
                <UIcon name="i-lucide-info" class="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
                <p class="leading-relaxed">
                  <strong>Comment fonctionnent ces champs ?</strong> Chaque terme inséré entre accolades est un champ automatique qui sera remplacé par les données exactes lors de la signature de chaque lettre d'engagement (nom de l'employé, numéro CNI, montant en toutes lettres, date du jour, etc.). Vous n'avez pas besoin de saisir ces informations manuellement dans le modèle.
                </p>
              </div>

              <div class="grid grid-cols-1 md:grid-cols-3 gap-2.5 pt-1">
                <div class="p-2.5 rounded-lg bg-blue-50/70 dark:bg-blue-950/30 border border-blue-200 dark:border-blue-900/50">
                  <div class="font-bold text-blue-900 dark:text-blue-300 flex items-center gap-1.5 mb-1">
                    <UIcon name="i-lucide-user" class="w-3.5 h-3.5" />
                    <span>Données Employé</span>
                  </div>
                  <ul class="text-[11px] space-y-1 text-blue-800 dark:text-blue-300/90">
                    <li>• <strong>Accord soussigné(e)</strong> : s'accorde selon le sexe</li>
                    <li>• <strong>Nom de l'employé</strong> : civilité et nom complet</li>
                    <li>• <strong>N° CNI employé</strong> : pièce d'identité officielle</li>
                    <li>• <strong>Téléphone employé</strong> : contact portable</li>
                  </ul>
                </div>

                <div class="p-2.5 rounded-lg bg-emerald-50/70 dark:bg-emerald-950/30 border border-emerald-200 dark:border-emerald-900/50">
                  <div class="font-bold text-emerald-900 dark:text-emerald-300 flex items-center gap-1.5 mb-1">
                    <UIcon name="i-lucide-coins" class="w-3.5 h-3.5" />
                    <span>Finances & Délais</span>
                  </div>
                  <ul class="text-[11px] space-y-1 text-emerald-800 dark:text-emerald-300/90">
                    <li>• <strong>Montant en chiffres</strong> : ex. 250 000 FCFA</li>
                    <li>• <strong>Montant en lettres</strong> : écrit en texte (juridique)</li>
                    <li>• <strong>Motif de l'opération</strong> : raison de la dépense</li>
                    <li>• <strong>Délai accordé</strong> : jours pour justifier les reçus</li>
                  </ul>
                </div>

                <div class="p-2.5 rounded-lg bg-purple-50/70 dark:bg-purple-950/30 border border-purple-200 dark:border-purple-900/50">
                  <div class="font-bold text-purple-900 dark:text-purple-300 flex items-center gap-1.5 mb-1">
                    <UIcon name="i-lucide-building" class="w-3.5 h-3.5" />
                    <span>Direction & Date</span>
                  </div>
                  <ul class="text-[11px] space-y-1 text-purple-800 dark:text-purple-300/90">
                    <li>• <strong>Civilité patron</strong> : M. ou Mme</li>
                    <li>• <strong>Nom du patron</strong> : nom de l'employeur</li>
                    <li>• <strong>Ville du siège</strong> : lieu de signature</li>
                    <li>• <strong>Date officielle</strong> : date calendaire du jour</li>
                  </ul>
                </div>
              </div>
            </div>

            <!-- Filtres de catégories pour navigation aisée -->
            <div class="flex items-center gap-1.5 overflow-x-auto pb-0.5">
              <button
                type="button"
                class="h-6.5 px-2.5 rounded-md text-[11px] font-semibold transition-colors cursor-pointer whitespace-nowrap"
                :class="selectedCategory === 'all' ? 'bg-slate-900 text-white dark:bg-white dark:text-slate-900' : 'bg-white dark:bg-slate-800 text-slate-600 dark:text-slate-400 hover:text-slate-900 border border-slate-200 dark:border-slate-700'"
                @click="selectedCategory = 'all'"
              >
                Tous les termes (12)
              </button>
              <button
                type="button"
                class="h-6.5 px-2.5 rounded-md text-[11px] font-semibold transition-colors cursor-pointer whitespace-nowrap"
                :class="selectedCategory === 'employe' ? 'bg-blue-600 text-white' : 'bg-white dark:bg-slate-800 text-blue-700 dark:text-blue-300 hover:bg-blue-50 border border-blue-200 dark:border-blue-900'"
                @click="selectedCategory = 'employe'"
              >
                👤 Employé (4)
              </button>
              <button
                type="button"
                class="h-6.5 px-2.5 rounded-md text-[11px] font-semibold transition-colors cursor-pointer whitespace-nowrap"
                :class="selectedCategory === 'finance' ? 'bg-emerald-600 text-white' : 'bg-white dark:bg-slate-800 text-emerald-700 dark:text-emerald-300 hover:bg-emerald-50 border border-emerald-200 dark:border-emerald-900'"
                @click="selectedCategory = 'finance'"
              >
                💰 Finances & Délais (4)
              </button>
              <button
                type="button"
                class="h-6.5 px-2.5 rounded-md text-[11px] font-semibold transition-colors cursor-pointer whitespace-nowrap"
                :class="selectedCategory === 'direction' ? 'bg-purple-600 text-white' : 'bg-white dark:bg-slate-800 text-purple-700 dark:text-purple-300 hover:bg-purple-50 border border-purple-200 dark:border-purple-900'"
                @click="selectedCategory = 'direction'"
              >
                🏢 Direction & Date (4)
              </button>
            </div>

            <!-- Liste des boutons de termes avec libellé en français et icône -->
            <div class="flex flex-wrap gap-1.5 pt-1">
              <button
                v-for="v in filteredVariables"
                :key="v.key"
                type="button"
                :title="`${v.label} — ${v.description} (Exemple : ${v.example})`"
                class="h-7.5 px-2.5 rounded-lg border text-xs font-medium transition-all duration-150 cursor-pointer inline-flex items-center gap-1.5 shadow-2xs hover:scale-[1.02] active:scale-[0.98]"
                :class="[
                  v.category === 'employe'
                    ? 'bg-blue-50 text-blue-800 border-blue-200 hover:bg-blue-100 hover:border-blue-300 dark:bg-blue-950/40 dark:text-blue-300 dark:border-blue-800'
                    : v.category === 'finance'
                    ? 'bg-emerald-50 text-emerald-800 border-emerald-200 hover:bg-emerald-100 hover:border-emerald-300 dark:bg-emerald-950/40 dark:text-emerald-300 dark:border-emerald-800'
                    : 'bg-purple-50 text-purple-800 border-purple-200 hover:bg-purple-100 hover:border-purple-300 dark:bg-purple-950/40 dark:text-purple-300 dark:border-purple-800'
                ]"
                @click="insertVariable(v.key)"
              >
                <UIcon :name="v.icon" class="w-3.5 h-3.5 shrink-0" />
                <span>+ {{ v.shortLabel }}</span>
              </button>
            </div>

            <!-- Notification éphémère d'insertion au curseur -->
            <div v-if="lastInsertedVariable" class="pt-1 flex items-center gap-1.5 text-[11px] text-emerald-600 dark:text-emerald-400 font-medium animate-pulse">
              <UIcon name="i-lucide-check-circle-2" class="w-3.5 h-3.5" />
              <span>Champ <strong>« {{ lastInsertedVariable }} »</strong> inséré à l'emplacement du curseur.</span>
            </div>
          </div>

          <!-- Zone d'affichage et édition -->
          <div>
            <div class="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2 mb-2">
              <label class="text-xs font-semibold text-slate-700 dark:text-slate-300">
                Texte du modèle juridique :
              </label>

              <!-- Onglets de prévisualisation : Rédaction, Vue Direction formatée, Vue simulation -->
              <div class="flex items-center gap-1 p-0.5 rounded-lg bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700">
                <button
                  type="button"
                  class="h-6.5 px-2.5 rounded-md text-[11px] font-semibold transition-colors cursor-pointer"
                  :class="editorViewMode === 'edit' ? 'bg-white dark:bg-slate-900 text-emerald-700 dark:text-emerald-400 shadow-2xs' : 'text-slate-600 dark:text-slate-400 hover:text-slate-900'"
                  @click="editorViewMode = 'edit'"
                >
                  ✏️ Rédaction
                </button>
                <button
                  type="button"
                  class="h-6.5 px-2.5 rounded-md text-[11px] font-semibold transition-colors cursor-pointer"
                  :class="editorViewMode === 'formatted' ? 'bg-white dark:bg-slate-900 text-emerald-700 dark:text-emerald-400 shadow-2xs' : 'text-slate-600 dark:text-slate-400 hover:text-slate-900'"
                  @click="editorViewMode = 'formatted'"
                >
                  🏷️ Termes Formatés (Patron)
                </button>
                <button
                  type="button"
                  class="h-6.5 px-2.5 rounded-md text-[11px] font-semibold transition-colors cursor-pointer"
                  :class="editorViewMode === 'simulation' ? 'bg-white dark:bg-slate-900 text-emerald-700 dark:text-emerald-400 shadow-2xs' : 'text-slate-600 dark:text-slate-400 hover:text-slate-900'"
                  @click="editorViewMode = 'simulation'"
                >
                  📄 Simulation Réelle
                </button>
              </div>
            </div>

            <!-- Mode 1 : Rédaction directe -->
            <div v-if="editorViewMode === 'edit'">
              <textarea
                ref="editorTextareaRef"
                v-model="templateContent"
                rows="11"
                placeholder="Rédigez le texte de votre lettre d'engagement..."
                class="w-full px-3.5 py-2.5 text-xs rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white font-sans leading-relaxed focus:outline-none focus:ring-2 focus:ring-emerald-500 shadow-2xs"
                :class="{ 'border-red-500 focus:ring-red-500': templateErrors.content }"
              />
              <p class="text-[11px] text-slate-500 mt-1">
                Astuce : Positionnez votre curseur dans le texte et cliquez sur un bouton de champ automatique pour l'insérer au bon endroit.
              </p>
            </div>

            <!-- Mode 2 : Vue Patron avec Termes Formatés -->
            <div
              v-else-if="editorViewMode === 'formatted'"
              class="p-4 rounded-lg bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-xs sm:text-sm text-justify leading-loose whitespace-pre-wrap font-serif text-slate-900 dark:text-slate-100 shadow-2xs"
              v-html="formattedPreviewHtml"
            />

            <!-- Mode 3 : Simulation complète avec données réelles -->
            <div
              v-else-if="editorViewMode === 'simulation'"
              class="p-4 rounded-lg bg-emerald-50/40 dark:bg-slate-900 border border-emerald-200 dark:border-slate-800 text-xs sm:text-sm text-justify leading-relaxed whitespace-pre-wrap font-serif text-slate-900 dark:text-slate-100 shadow-2xs"
            >
              <div class="mb-3 pb-2 border-b border-emerald-200 dark:border-slate-800 flex items-center justify-between text-xs text-emerald-800 dark:text-emerald-400 font-sans font-bold">
                <span>Aperçu de la lettre telle qu'elle sera remise à l'employé :</span>
                <span class="text-[10px] px-2 py-0.5 rounded bg-emerald-100 dark:bg-emerald-950 font-semibold">Données d'exemple</span>
              </div>
              {{ simulatedPreview }}
            </div>

            <p v-if="templateErrors.content" class="text-xs text-red-500 mt-1 font-medium">
              {{ templateErrors.content }}
            </p>
          </div>

          <!-- Actions d'enregistrement -->
          <div class="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 pt-3 border-t border-slate-100 dark:border-slate-800">
            <div class="text-xs text-slate-500">
              Prochaine version qui sera générée : <strong class="text-slate-800 dark:text-white">v{{ (templateData?.templates?.[0]?.version || templateData?.version || 1) + 1 }}</strong>
            </div>

            <div class="flex items-center gap-2">
              <AppButton
                variant="primary"
                size="sm"
                icon="i-lucide-shield-check"
                :label="`Créer la Version v${(templateData?.templates?.[0]?.version || templateData?.version || 1) + 1} (Confirmation Patron)`"
                @click="openPasswordConfirmModal"
              />
            </div>
          </div>
        </div>
      </AppCard>
    </div>

    <!-- Modale de Confirmation avec Mot de Passe Patron -->
    <AppModal
      v-model="isPasswordConfirmModalOpen"
      title="Confirmation patron requise"
      description="La création d’une nouvelle version de modèle de lettre est une action sensible qui s’appliquera aux engagements futurs."
      icon="i-lucide-lock"
      confirm-label="Valider & Créer la Version"
      :confirm-loading="createVersionLoading"
      @confirm="submitCreateVersion"
      @cancel="isPasswordConfirmModalOpen = false"
    >
      <div class="space-y-4 py-2">
        <p class="text-xs text-slate-600 dark:text-slate-300">
          Pour certifier cette nouvelle version juridique, veuillez confirmer votre identité en saisissant le <strong>mot de passe du patron</strong> :
        </p>

        <div>
          <AppInput
            v-model="patronPasswordConfirm"
            type="password"
            label="Mot de passe du patron"
            placeholder="Entrez votre mot de passe..."
            :error="passwordConfirmError"
            required
            @keyup.enter="submitCreateVersion"
          />
        </div>

        <div class="p-2.5 rounded-lg bg-amber-50 dark:bg-amber-950/30 border border-amber-200 dark:border-amber-800/50 text-[11px] text-amber-800 dark:text-amber-300 flex items-center gap-2">
          <UIcon name="i-lucide-info" class="w-4 h-4 shrink-0 text-amber-600" />
          <span>La nouvelle version créée sera immédiatement activée comme modèle par défaut.</span>
        </div>
      </div>
    </AppModal>

    <!-- Onglet 3 : Mot de passe -->
    <AppCard
      v-if="activeTab === 'security'"
      title="Changer le mot de passe patron (Argon2id)"
      icon="i-lucide-shield-check"
      description="Sécurité cryptographique forte avec coût mémoire et temps calibré"
      class="max-w-lg"
    >
      <form class="space-y-3" @submit.prevent="changePassword">
        <AppInput
          v-model="passwordForm.currentPassword"
          type="password"
          label="Mot de passe actuel"
          :error="passwordErrors.currentPassword"
          required
        />

        <AppInput
          v-model="passwordForm.newPassword"
          type="password"
          label="Nouveau mot de passe (min 8 caractères)"
          :error="passwordErrors.newPassword"
          required
        />

        <AppInput
          v-model="passwordForm.confirmPassword"
          type="password"
          label="Confirmer le nouveau mot de passe"
          :error="passwordErrors.confirmPassword"
          required
        />

        <div class="pt-2 flex justify-end">
          <AppButton
            type="submit"
            variant="primary"
            size="sm"
            :loading="loading"
            label="Mettre à jour le mot de passe"
          />
        </div>
      </form>
    </AppCard>

    <!-- Onglet 3 : Équipe & Rôles (Patron, Secrétaire, Technicien) -->
    <div v-if="activeTab === 'users'" class="space-y-6">
      <!-- Présentation des 3 Rôles -->
      <div class="grid grid-cols-1 md:grid-cols-3 gap-4">
        <!-- 1. Patron -->
        <div class="p-4 rounded-xl bg-emerald-50/70 dark:bg-emerald-950/30 border border-emerald-200 dark:border-emerald-800/60 flex flex-col justify-between">
          <div>
            <div class="flex items-center gap-2 mb-2">
              <div class="w-8 h-8 rounded-lg bg-emerald-600 text-white flex items-center justify-center font-bold text-sm shadow-xs">
                <UIcon name="i-lucide-crown" class="w-4 h-4" />
              </div>
              <div>
                <h4 class="text-xs font-bold text-slate-900 dark:text-white uppercase tracking-wider">Patron</h4>
                <p class="text-[11px] text-emerald-700 dark:text-emerald-400 font-medium">Direction Générale</p>
              </div>
            </div>
            <p class="text-xs text-slate-600 dark:text-slate-300 leading-relaxed">
              Validation financière des engagements, approbation des paiements/décaissements, gestion des modèles de lettre, audit et contrôle des rôles.
            </p>
          </div>
          <div class="mt-3 pt-2.5 border-t border-emerald-200/60 dark:border-emerald-800/40 flex items-center gap-1.5 text-[11px] text-emerald-800 dark:text-emerald-300 font-semibold">
            <UIcon name="i-lucide-shield-check" class="w-3.5 h-3.5 text-emerald-600" />
            <span>Accès direction suprême</span>
          </div>
        </div>

        <!-- 2. Secrétaire -->
        <div class="p-4 rounded-xl bg-sky-50/70 dark:bg-sky-950/30 border border-sky-200 dark:border-sky-800/60 flex flex-col justify-between">
          <div>
            <div class="flex items-center gap-2 mb-2">
              <div class="w-8 h-8 rounded-lg bg-sky-600 text-white flex items-center justify-center font-bold text-sm shadow-xs">
                <UIcon name="i-lucide-clipboard-pen" class="w-4 h-4" />
              </div>
              <div>
                <h4 class="text-xs font-bold text-slate-900 dark:text-white uppercase tracking-wider">Secrétaire</h4>
                <p class="text-[11px] text-sky-700 dark:text-sky-400 font-medium">Administration & Saisie</p>
              </div>
            </div>
            <p class="text-xs text-slate-600 dark:text-slate-300 leading-relaxed">
              Création des demandes d'engagements, saisie des justificatifs & factures, gestion des fiches employés et témoins, export des lettres PDF.
            </p>
          </div>
          <div class="mt-3 pt-2.5 border-t border-sky-200/60 dark:border-sky-800/40 flex items-center gap-1.5 text-[11px] text-sky-800 dark:text-sky-300 font-semibold">
            <UIcon name="i-lucide-file-text" class="w-3.5 h-3.5 text-sky-600" />
            <span>Gestion opérationnelle</span>
          </div>
        </div>

        <!-- 3. Technicien -->
        <div class="p-4 rounded-xl bg-amber-50/70 dark:bg-amber-950/30 border border-amber-200 dark:border-amber-800/60 flex flex-col justify-between">
          <div>
            <div class="flex items-center gap-2 mb-2">
              <div class="w-8 h-8 rounded-lg bg-amber-600 text-white flex items-center justify-center font-bold text-sm shadow-xs">
                <UIcon name="i-lucide-wrench" class="w-4 h-4" />
              </div>
              <div>
                <h4 class="text-xs font-bold text-slate-900 dark:text-white uppercase tracking-wider">Technicien</h4>
                <p class="text-[11px] text-amber-700 dark:text-amber-400 font-medium">Contrôle Chantier & Prix</p>
              </div>
            </div>
            <p class="text-xs text-slate-600 dark:text-slate-300 leading-relaxed">
              Gestion du catalogue d'articles, vérification et mise à jour des prix de référence du marché local, suivi technique des matériaux.
            </p>
          </div>
          <div class="mt-3 pt-2.5 border-t border-amber-200/60 dark:border-amber-800/40 flex items-center gap-1.5 text-[11px] text-amber-800 dark:text-amber-300 font-semibold">
            <UIcon name="i-lucide-package" class="w-3.5 h-3.5 text-amber-600" />
            <span>Contrôle technique du marché</span>
          </div>
        </div>
      </div>

      <!-- Liste des Utilisateurs -->
      <AppCard
        title="Comptes Utilisateurs & Rôles Actifs"
        icon="i-lucide-users"
        description="Gérez les accès de votre équipe et attribuez les rôles selon les responsabilités de chacun"
      >
        <template #actions>
          <AppButton
            variant="primary"
            size="xs"
            icon="i-lucide-user-plus"
            label="Ajouter un compte"
            @click="openCreateUserModal"
          />
        </template>

        <div class="overflow-x-auto">
          <table class="w-full text-left text-xs border-collapse">
            <thead>
              <tr class="border-b border-slate-200 dark:border-slate-800 text-slate-500 font-medium">
                <th class="py-2.5 px-3 whitespace-nowrap">Collaborateur</th>
                <th class="py-2.5 px-3 whitespace-nowrap">Identifiant</th>
                <th class="py-2.5 px-3 whitespace-nowrap">Rôle Attribué</th>
                <th class="py-2.5 px-3 whitespace-nowrap">Dernière Connexion</th>
                <th class="py-2.5 px-3 text-right whitespace-nowrap">Actions</th>
              </tr>
            </thead>
            <tbody class="divide-y divide-slate-100 dark:divide-slate-800">
              <tr
                v-for="u in usersList"
                :key="u.id"
                class="hover:bg-slate-50 dark:hover:bg-slate-800/40 transition-colors"
              >
                <!-- Nom complet -->
                <td class="py-3 px-3 font-semibold text-slate-900 dark:text-white whitespace-nowrap">
                  <div class="flex items-center gap-2">
                    <div
                      class="w-7 h-7 rounded-lg flex items-center justify-center font-bold text-xs"
                      :class="u.role === 'PATRON' ? 'bg-emerald-100 text-emerald-700 dark:bg-emerald-950 dark:text-emerald-400' : u.role === 'SECRETAIRE' ? 'bg-sky-100 text-sky-700 dark:bg-sky-950 dark:text-sky-400' : 'bg-amber-100 text-amber-700 dark:bg-amber-950 dark:text-amber-400'"
                    >
                      {{ u.name.charAt(0) }}
                    </div>
                    <div>
                      <span>{{ u.name }}</span>
                      <span v-if="u.id === currentConnectedUser?.id" class="ml-1.5 text-[10px] text-emerald-600 font-normal">
                        (Vous)
                      </span>
                    </div>
                  </div>
                </td>

                <!-- Identifiant -->
                <td class="py-3 px-3 text-slate-600 dark:text-slate-300 font-mono whitespace-nowrap">
                  @{{ u.username }}
                </td>

                <!-- Rôle -->
                <td class="py-3 px-3 whitespace-nowrap">
                  <AppBadge
                    v-if="u.role === 'PATRON'"
                    label="Patron"
                    color="emerald"
                    variant="subtle"
                    size="xs"
                    icon="i-lucide-crown"
                  />
                  <AppBadge
                    v-else-if="u.role === 'SECRETAIRE'"
                    label="Secrétaire"
                    color="sky"
                    variant="subtle"
                    size="xs"
                    icon="i-lucide-clipboard-pen"
                  />
                  <AppBadge
                    v-else
                    label="Technicien"
                    color="amber"
                    variant="subtle"
                    size="xs"
                    icon="i-lucide-wrench"
                  />
                </td>

                <!-- Dernière Connexion -->
                <td class="py-3 px-3 text-slate-500 whitespace-nowrap">
                  <span v-if="u.lastLoginAt">
                    {{ new Date(u.lastLoginAt).toLocaleDateString('fr-FR', { day: '2-digit', month: '2-digit', year: 'numeric', hour: '2-digit', minute: '2-digit' }) }}
                  </span>
                  <span v-else class="text-slate-400 italic">
                    Jamais connecté
                  </span>
                </td>

                <!-- Actions -->
                <td class="py-3 px-3 text-right whitespace-nowrap space-x-1.5">
                  <AppButton
                    variant="ghost"
                    size="xs"
                    icon="i-lucide-pencil"
                    label="Modifier"
                    @click="openEditUserModal(u)"
                  />

                  <AppButton
                    v-if="u.id !== currentConnectedUser?.id"
                    variant="ghost"
                    color="error"
                    size="xs"
                    icon="i-lucide-trash-2"
                    label="Supprimer"
                    @click="openDeleteUserModal(u)"
                  />
                </td>
              </tr>
            </tbody>
          </table>
        </div>
      </AppCard>
    </div>

    <!-- Modale 1 : Créer un Utilisateur -->
    <AppModal
      v-model="isCreateUserModalOpen"
      title="Ajouter un compte collaborateur"
      description="Créez un compte d'accès et attribuez-lui son rôle dans l'entreprise."
      icon="i-lucide-user-plus"
      confirm-label="Créer le Compte"
      :confirm-loading="createUserLoading"
      @confirm="submitCreateUser"
      @cancel="isCreateUserModalOpen = false"
    >
      <form class="space-y-4 py-2" @submit.prevent="submitCreateUser">
        <AppInput
          v-model="createUserForm.name"
          label="Nom complet du collaborateur"
          placeholder="ex: Mme Ngo Biboum, M. Kamga..."
          :error="createUserErrors.name"
          required
        />

        <AppInput
          v-model="createUserForm.username"
          label="Identifiant de connexion (unique)"
          placeholder="ex: secretaire, technicien2..."
          :error="createUserErrors.username"
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
              :class="createUserForm.role === r.value ? 'border-emerald-600 bg-emerald-50 dark:bg-emerald-950/40 text-emerald-900 dark:text-emerald-200 ring-2 ring-emerald-500/20' : 'border-slate-200 dark:border-slate-800 hover:bg-slate-50 dark:hover:bg-slate-800/50'"
              @click="createUserForm.role = r.value"
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
          v-model="createUserForm.password"
          type="password"
          label="Mot de passe temporaire (min 8 caractères)"
          placeholder="••••••••••••"
          :error="createUserErrors.password"
          required
        />
      </form>
    </AppModal>

    <!-- Modale 2 : Modifier un Utilisateur -->
    <AppModal
      v-model="isEditUserModalOpen"
      title="Modifier le compte utilisateur"
      description="Mettez à jour les informations, le rôle ou réinitialisez le mot de passe."
      icon="i-lucide-pencil"
      confirm-label="Enregistrer les Modifications"
      :confirm-loading="editUserLoading"
      @confirm="submitEditUser"
      @cancel="isEditUserModalOpen = false"
    >
      <form class="space-y-4 py-2" @submit.prevent="submitEditUser">
        <AppInput
          v-model="editUserForm.name"
          label="Nom complet du collaborateur"
          :error="editUserErrors.name"
          required
        />

        <div>
          <label class="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
            Identifiant
          </label>
          <div class="px-3 py-2 rounded-lg bg-slate-100 dark:bg-slate-800 text-xs font-mono text-slate-600 dark:text-slate-400">
            @{{ editUserForm.username }} (non modifiable)
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
              :class="editUserForm.role === r.value ? 'border-emerald-600 bg-emerald-50 dark:bg-emerald-950/40 text-emerald-900 dark:text-emerald-200 ring-2 ring-emerald-500/20' : 'border-slate-200 dark:border-slate-800 hover:bg-slate-50 dark:hover:bg-slate-800/50'"
              @click="editUserForm.role = r.value"
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
          v-model="editUserForm.password"
          type="password"
          label="Nouveau mot de passe (laisser vide pour ne pas changer)"
          placeholder="Entrez pour changer le mot de passe..."
          :error="editUserErrors.password"
        />
      </form>
    </AppModal>

    <!-- Modale 3 : Confirmation de Suppression d'Utilisateur -->
    <AppModal
      v-model="isDeleteUserModalOpen"
      title="Confirmer la suppression du compte"
      :description="`Êtes-vous sûr de vouloir supprimer définitivement le compte de ${userToDelete?.name} (@${userToDelete?.username}) ? Ses sessions actives seront également révoquées.`"
      icon="i-lucide-alert-triangle"
      confirm-label="Supprimer Définitivement"
      color="error"
      :confirm-loading="deleteUserLoading"
      @confirm="submitDeleteUser"
      @cancel="isDeleteUserModalOpen = false"
    />

    <!-- Onglet 4 : Sessions Actives -->
    <AppCard
      v-if="activeTab === 'sessions'"
      title="Sessions de Connexion Actives"
      icon="i-lucide-laptop"
      description="Visualisez et révoquez les sessions ouvertes sur vos différents appareils"
    >
      <div class="divide-y divide-slate-100 dark:divide-slate-800">
        <div
          v-for="s in sessions"
          :key="s.id"
          class="py-3 flex items-center justify-between first:pt-0 last:pb-0"
        >
          <div class="flex items-center gap-3">
            <UIcon
              :name="s.userAgent.toLowerCase().includes('mobile') ? 'i-lucide-smartphone' : 'i-lucide-laptop'"
              class="w-5 h-5 text-slate-500"
            />
            <div>
              <div class="text-xs font-semibold text-slate-900 dark:text-white flex items-center gap-2">
                <span>{{ s.ip || '127.0.0.1' }}</span>
                <span
                  v-if="s.isCurrent"
                  class="px-1.5 py-0.5 rounded text-[10px] font-bold bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300"
                >
                  Session Actuelle
                </span>
              </div>
              <div class="text-[11px] text-slate-500 truncate max-w-sm">
                {{ s.userAgent }}
              </div>
            </div>
          </div>

          <AppButton
            v-if="!s.isCurrent"
            variant="outline"
            color="error"
            size="xs"
            label="Déconnecter"
            @click="revokeSession(s.id)"
          />
        </div>
      </div>
    </AppCard>
  </div>
</template>
