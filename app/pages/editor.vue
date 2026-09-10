<script setup lang="ts">
import defaultSvg from '~/assets/svg/svgforge-logo.svg?raw'

definePageMeta({
  layout: 'editor'
})

useSeoMeta({
  title: 'SVG Editor · SVGForge Editor',
  description: 'Browser-based SVG editor with layers, inspector, undo/redo, and multi-format export.'
})

const studioRef = ref<{
  loadSvgString: (svg: string, name?: string) => Promise<void>
} | null>(null)

const pending = ref<{ svg: string, name: string } | null>(null)
const studioReady = ref(false)

async function flushLoad() {
  const job = pending.value
  const studio = studioRef.value
  if (!job || !studio || !studioReady.value) return
  pending.value = null
  await nextTick()
  await studio.loadSvgString(job.svg, job.name)
}

async function onStudioReady() {
  studioReady.value = true
  await flushLoad()
}

onMounted(async () => {
  pending.value = { svg: defaultSvg, name: 'svgforge-logo.svg' }
  await flushLoad()
})
</script>

<template>
  <div class="editor-page">
    <ClientOnly>
      <EditorSvgStudio
        ref="studioRef"
        @ready="onStudioReady"
      />
      <template #fallback>
        <p class="boot">
          Loading SVG editor…
        </p>
      </template>
    </ClientOnly>
  </div>
</template>

<style scoped>
.editor-page {
  height: 100%;
  min-height: 0;
  padding: 0.65rem;
  box-sizing: border-box;
}

.boot {
  margin: 2rem auto;
  text-align: center;
  color: var(--sf-muted);
}
</style>
