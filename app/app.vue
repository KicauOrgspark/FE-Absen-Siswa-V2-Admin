<script setup lang="ts">
useHead({
  titleTemplate: (titleChunk) => {
    return titleChunk ? `${titleChunk} - Trabsen` : 'Trabsen - Smart-presence Admin Panel'
  },
  htmlAttrs: {
    lang: 'id'
  }
})
</script>

<template>
  <NuxtLayout>
    <NuxtPage />
  </NuxtLayout>
</template>
