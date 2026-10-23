<script setup lang="ts">
useHead({
  titleTemplate: (titleChunk) => {
    return titleChunk ? `${titleChunk} - Contrôle des Dépenses` : 'Contrôle des Dépenses - Direction'
  },
  meta: [
    { name: 'viewport', content: 'width=device-width, initial-scale=1' },
    { name: 'description', content: 'Application de contrôle, vérification des prix et suivi des dépenses' }
  ],
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
