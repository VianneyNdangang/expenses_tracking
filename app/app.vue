<script setup lang="ts">
const route = useRoute()

useHead({
  titleTemplate: (titleChunk) => {
    return titleChunk ? `${titleChunk} - Contrôle des Dépenses` : 'Contrôle des Dépenses - Direction'
  },
  meta: [
    { name: 'viewport', content: 'width=device-width, initial-scale=1' },
    { name: 'description', content: 'Application de contrôle, vérification des prix et suivi des dépenses' },
    {
      name: 'robots',
      content: computed(() => route.path === '/login' ? 'index, follow' : 'noindex, nofollow')
    }
  ],
  link: computed(() => route.path === '/login'
    ? [{ rel: 'canonical', href: 'https://controledepenses.grandluixdepense.com/login' }]
    : []),
  htmlAttrs: {
    lang: 'fr'
  }
})
</script>

<template>
  <UApp>
    <NuxtLayout>
      <NuxtPage />
    </NuxtLayout>
  </UApp>
</template>
