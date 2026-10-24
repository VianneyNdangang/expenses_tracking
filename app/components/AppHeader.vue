<script setup lang="ts">
const emit = defineEmits<{
  'toggle-sidebar': []
}>()

const { user, roleLabel, roleBadgeColor, isPatron, isSecretaire } = useAuth()
</script>

<template>
  <header
    class="fixed top-0 right-0 left-0 lg:left-64 h-16 z-20 bg-white/95 dark:bg-slate-900/95 backdrop-blur-md border-b border-slate-200 dark:border-slate-800 flex items-center justify-between px-4 sm:px-6 select-none"
  >
    <!-- GAUCHE : Bouton Mobile Hamburger ou Badges Bureau -->
    <div class="flex items-center gap-3">
      <!-- Bouton menu mobile -->
      <AppButton
        variant="ghost"
        size="xs"
        icon="i-lucide-menu"
        class="lg:hidden"
        aria-label="Ouvrir le menu de navigation"
        @click="emit('toggle-sidebar')"
      />

      <!-- Titre Mobile -->
      <div class="lg:hidden flex items-center gap-2">
        <span class="font-bold text-sm tracking-tight text-slate-900 dark:text-white">
          Grand Luix SARL
        </span>
      </div>

      <!-- Badges de sécurité et conformité Bureau -->
      <div class="hidden lg:flex items-center gap-2.5">
        <AppBadge
          label="Session Sécurisée"
          color="success"
          variant="subtle"
          size="xs"
          icon="i-lucide-shield-check"
        />

        <AppBadge
          label="Devise : FCFA"
          color="neutral"
          variant="subtle"
          size="xs"
          icon="i-lucide-coins"
        />
      </div>
    </div>

    <!-- DROITE : Actions rapides, Rôle utilisateur et Thème -->
    <div class="flex items-center gap-2.5">
      <!-- Badge de rôle utilisateur connecté -->
      <div v-if="user" class="hidden sm:flex items-center gap-2 px-2.5 py-1 rounded-lg bg-slate-50 dark:bg-slate-800/60 border border-slate-100 dark:border-slate-800">
        <span class="text-xs font-medium text-slate-700 dark:text-slate-300 max-w-[120px] truncate">{{ user.name }}</span>
        <AppBadge
          :label="roleLabel"
          :color="roleBadgeColor as any"
          variant="subtle"
          size="xs"
          :icon="isPatron ? 'i-lucide-crown' : isSecretaire ? 'i-lucide-clipboard-pen' : 'i-lucide-wrench'"
        />
      </div>

      <!-- Raccourci Création Engagement (Bureau & Mobile) -->
      <AppButton
        to="/engagements/nouveau"
        variant="primary"
        size="xs"
        icon="i-lucide-plus-circle"
        label="Nouvel engagement"
        class="shadow-xs font-semibold"
      />

      <!-- Bascule Thème Sombre / Clair (uniquement desktop ici, mobile déjà dans le drawer) -->
      <div class="hidden sm:flex items-center pl-1 border-l border-slate-200 dark:border-slate-800">
        <UColorModeButton />
      </div>
    </div>
  </header>
</template>
