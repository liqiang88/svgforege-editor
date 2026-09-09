<script setup lang="ts">
useHead({
  htmlAttrs: {
    lang: 'zh-CN'
  }
})

const title = 'SVGForge Editor'
const description = '开源 SVG 矢量编辑器，基于 Nuxt 4 与 Nuxt UI v4 构建。'

useSeoMeta({
  title,
  description,
  ogTitle: title,
  ogDescription: description,
  twitterCard: 'summary_large_image'
})
</script>

<template>
  <UApp>
    <NuxtLayout>
      <NuxtPage />
    </NuxtLayout>
  </UApp>
</template>
