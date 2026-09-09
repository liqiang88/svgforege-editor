<script setup lang="ts">
definePageMeta({
  layout: 'editor'
})

useSeoMeta({
  title: '编辑器 · SVGForge Editor',
  description: '基于 SVG-edit 的在线 SVG 矢量编辑器。'
})
</script>

<template>
  <ClientOnly>
    <iframe
      src="/svg-edit/index.html"
      title="SVGForge SVG Editor"
      class="block w-full h-full border-0 bg-white"
      allow="clipboard-read; clipboard-write"
    />
    <template #fallback>
      <div class="h-full flex items-center justify-center text-muted">
        正在加载 SVG 编辑器…
      </div>
    </template>
  </ClientOnly>
</template>
