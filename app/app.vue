<script setup lang="ts">
const route = useRoute()

useHead({
  titleTemplate: (titleChunk) => {
    return titleChunk ? `${titleChunk} - Grand Luix SARL` : 'Grand Luix SARL - Gestion des dépenses'
  },
  meta: [
    { name: 'viewport', content: 'width=device-width, initial-scale=1' },
    { name: 'description', content: 'Application interne de gestion, de contrôle et de suivi des dépenses de Grand Luix SARL.' },
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
