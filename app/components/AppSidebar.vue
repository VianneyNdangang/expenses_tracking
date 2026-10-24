<script setup lang="ts">
import type { UserRole } from '../../shared/schemas'

interface Props {
  mobileOpen?: boolean
}

withDefaults(defineProps<Props>(), {
  mobileOpen: false
})

const emit = defineEmits<{
  'update:mobileOpen': [val: boolean]
  'close': []
}>()

const route = useRoute()
const { user, role, roleLabel, roleBadgeColor, isPatron, isSecretaire, logout } = useAuth()

interface NavItem {
  label: string
  to: string
  icon: string
  highlight?: boolean
  roles?: UserRole[]
}

const allNavigation: NavItem[] = [
  { label: 'Tableau de bord', to: '/', icon: 'i-lucide-layout-dashboard' },
  { label: 'Mon compte', to: '/profil', icon: 'i-lucide-user-round' },
  { label: 'Engagements', to: '/engagements', icon: 'i-lucide-file-text' },
  { label: 'Nouvel engagement', to: '/engagements/nouveau', icon: 'i-lucide-plus-circle', highlight: true },
  { label: 'Agenda du Patron', to: '/agenda', icon: 'i-lucide-calendar-days', roles: ['PATRON', 'SECRETAIRE'] },
  { label: 'Articles & Prix', to: '/articles', icon: 'i-lucide-package', roles: ['PATRON', 'TECHNICIEN'] },
  { label: 'Employés', to: '/employes', icon: 'i-lucide-users', roles: ['PATRON', 'SECRETAIRE'] },
  { label: 'Témoins', to: '/temoins', icon: 'i-lucide-user-check', roles: ['PATRON', 'SECRETAIRE'] },
  { label: 'Paramètres', to: '/parametres', icon: 'i-lucide-settings', roles: ['PATRON'] },
  { label: 'Composants', to: '/composants', icon: 'i-lucide-panels-top-left', roles: ['TECHNICIEN'] },
  { label: 'Journal d’audit', to: '/audit', icon: 'i-lucide-shield-alert', roles: ['TECHNICIEN'] }
]

const navigation = computed(() => {
  return allNavigation.filter((item) => {
    if (!item.roles) return true
    return item.roles.includes(role.value)
  })
})

const handleClose = () => {
  emit('update:mobileOpen', false)
  emit('close')
}

// Ferme le drawer mobile lors du changement de page
watch(() => route.fullPath, () => {
  handleClose()
})
</script>

<template>
  <div>
    <!-- 1. BARRE LATÉRALE FIXE (BUREAU) -->
    <aside
      class="hidden lg:flex fixed top-0 bottom-0 left-0 w-64 z-30 flex-col bg-white dark:bg-slate-900 border-r border-slate-200 dark:border-slate-800 select-none shadow-xs"
    >
      <!-- Logo et Identité -->
      <div class="h-16 flex items-center px-6 border-b border-slate-200 dark:border-slate-800 shrink-0">
        <NuxtLink to="/" class="flex items-center gap-3">
          <div class="w-9 h-9 rounded-lg bg-emerald-600 flex items-center justify-center text-white font-bold text-base shadow-sm">
            GL
          </div>
          <div>
            <span class="font-bold text-sm tracking-tight text-slate-900 dark:text-white block leading-tight">
              Grand Luix SARL
            </span>
            <span class="text-xs text-slate-500 dark:text-slate-400 block font-normal">
              Gestion des dépenses
            </span>
          </div>
        </NuxtLink>
      </div>

      <!-- Navigation Principale -->
      <div class="flex-1 px-3 py-4 space-y-1 overflow-y-auto">
        <NuxtLink
          v-for="item in navigation"
          :key="item.to"
          :to="item.to"
          class="flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors"
          :class="[
            route.path === item.to
              ? 'bg-emerald-50 text-emerald-700 dark:bg-emerald-950/60 dark:text-emerald-400 font-semibold'
              : 'text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 hover:text-slate-900 dark:hover:text-white',
            item.highlight ? 'text-emerald-600 dark:text-emerald-400' : ''
          ]"
        >
          <UIcon :name="item.icon" class="w-5 h-5 shrink-0" />
          <span>{{ item.label }}</span>
        </NuxtLink>
      </div>

      <!-- Profil utilisateur connecté & déconnexion fixé en bas -->
      <div class="p-3 border-t border-slate-200 dark:border-slate-800 space-y-2 shrink-0 bg-white dark:bg-slate-900">
        <div class="p-2.5 rounded-lg bg-slate-50 dark:bg-slate-800/60 border border-slate-100 dark:border-slate-800/80">
          <div class="flex items-center justify-between gap-2 mb-1.5">
            <div class="text-xs font-semibold text-slate-900 dark:text-white truncate">
              {{ user?.name || 'M. Abdouraman' }}
            </div>
            <UColorModeButton />
          </div>
          <div class="flex items-center gap-1.5">
            <AppBadge
              :label="roleLabel"
              :color="roleBadgeColor as any"
              variant="subtle"
              size="xs"
              :icon="isPatron ? 'i-lucide-crown' : isSecretaire ? 'i-lucide-clipboard-pen' : 'i-lucide-wrench'"
            />
            <span class="text-[11px] text-slate-400 dark:text-slate-500 truncate">@{{ user?.username }}</span>
          </div>
        </div>

        <AppButton
          variant="danger-outline"
          size="xs"
          block
          icon="i-lucide-log-out"
          label="Se déconnecter"
          @click="logout"
        />
      </div>
    </aside>

    <!-- 2. MENU TIROIR MOBILE (FIXE OVERLAY) -->
    <div
      v-if="mobileOpen"
      class="lg:hidden fixed inset-0 z-50 bg-slate-950/60 backdrop-blur-xs flex"
      @click.self="handleClose"
    >
      <div class="w-72 max-w-[85vw] bg-white dark:bg-slate-900 h-full flex flex-col p-4 shadow-2xl border-r border-slate-200 dark:border-slate-800">
        <!-- En-tête tiroir -->
        <div class="flex items-center justify-between pb-4 border-b border-slate-200 dark:border-slate-800 mb-4">
          <div class="flex items-center gap-2.5">
            <div class="w-8 h-8 rounded-lg bg-emerald-600 flex items-center justify-center text-white font-bold text-sm">
              GL
            </div>
            <div>
              <div class="font-bold text-sm leading-none text-slate-900 dark:text-white">
                Grand Luix SARL
              </div>
              <div class="text-xs text-slate-500 mt-1">
                Gestion des dépenses
              </div>
            </div>
          </div>
          <AppButton
            variant="ghost"
            size="xs"
            icon="i-lucide-x"
            aria-label="Fermer le menu"
            @click="handleClose"
          />
        </div>

        <!-- Liens -->
        <nav class="flex-1 space-y-1 overflow-y-auto">
          <NuxtLink
            v-for="item in navigation"
            :key="item.to"
            :to="item.to"
            class="flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors cursor-pointer"
            :class="[
              route.path === item.to
                ? 'bg-emerald-50 text-emerald-700 dark:bg-emerald-950/60 dark:text-emerald-400 font-semibold'
                : 'text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800',
              item.highlight ? 'text-emerald-600 dark:text-emerald-400' : ''
            ]"
            @click="handleClose"
          >
            <UIcon :name="item.icon" class="w-5 h-5 shrink-0" />
            <span>{{ item.label }}</span>
          </NuxtLink>
        </nav>

        <!-- Bas du menu tiroir -->
        <div class="pt-4 border-t border-slate-200 dark:border-slate-800 space-y-3">
          <div class="p-2.5 rounded-lg bg-slate-50 dark:bg-slate-800/60 border border-slate-100 dark:border-slate-800/80">
            <div class="flex items-center justify-between gap-2 mb-1.5">
              <span class="text-xs font-semibold text-slate-900 dark:text-white truncate">{{ user?.name || 'Patron' }}</span>
              <UColorModeButton />
            </div>
            <div class="flex items-center gap-1.5">
              <AppBadge
                :label="roleLabel"
                :color="roleBadgeColor as any"
                variant="subtle"
                size="xs"
                :icon="isPatron ? 'i-lucide-crown' : isSecretaire ? 'i-lucide-clipboard-pen' : 'i-lucide-wrench'"
              />
              <span class="text-[11px] text-slate-400 dark:text-slate-500 truncate">@{{ user?.username }}</span>
            </div>
          </div>
          <AppButton
            variant="danger-outline"
            size="sm"
            block
            icon="i-lucide-log-out"
            label="Déconnexion"
            @click="logout"
          />
        </div>
      </div>
    </div>
  </div>
</template>
