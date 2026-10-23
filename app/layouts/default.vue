<script setup lang="ts">
const route = useRoute()
const mobileMenuOpen = ref(false)

const isPrintPage = computed(() => route.path.includes('/lettre'))
const isLoginPage = computed(() => route.path === '/login')
</script>

<template>
  <div v-if="isPrintPage" class="min-h-screen bg-white text-black font-sans">
    <slot />
  </div>

  <div v-else-if="isLoginPage" class="min-h-screen bg-slate-50 dark:bg-slate-950 font-sans">
    <slot />
  </div>

  <div v-else class="min-h-screen bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-slate-100 flex flex-col font-sans">
    <!-- Header Fixe (Desktop & Mobile) -->
    <AppHeader @toggle-sidebar="mobileMenuOpen = !mobileMenuOpen" />

    <!-- Sidebar Fixe (Bureau) & Tiroir (Mobile) -->
    <AppSidebar
      v-model:mobile-open="mobileMenuOpen"
      @close="mobileMenuOpen = false"
    />

    <!-- Zone de contenu principale, scrollable sous le header fixé et à droite de la sidebar fixée -->
    <main class="pt-16 lg:pl-64 min-h-screen flex flex-col flex-1">
      <div class="flex-1 p-4 sm:p-6 lg:p-8 w-full mx-auto">
        <slot />
      </div>
    </main>
  </div>
</template>
