<script setup lang="ts">
const githubUrl = 'https://github.com/liqiang88/svgforege-editor'
</script>

<template>
  <div class="h-dvh flex flex-col overflow-hidden bg-default">
    <header class="shrink-0 h-12 px-3 border-b border-default flex items-center justify-between gap-3">
      <div class="flex items-center gap-2 min-w-0">
        <UButton
          to="/"
          icon="i-lucide-arrow-left"
          color="neutral"
          variant="ghost"
          size="sm"
          aria-label="返回首页"
        />
        <NuxtLink
          to="/"
          class="flex items-center gap-2 min-w-0"
        >
          <AppLogo class="w-6 h-6 shrink-0" />
          <span class="font-semibold text-highlighted truncate">SVGForge Editor</span>
        </NuxtLink>
      </div>

      <div class="flex items-center gap-1">
        <UButton
          to="/svg-edit/index.html"
          target="_blank"
          icon="i-lucide-external-link"
          label="独立窗口"
          color="neutral"
          variant="ghost"
          size="sm"
          class="hidden sm:inline-flex"
        />
        <UColorModeButton size="sm" />
        <UButton
          :to="githubUrl"
          target="_blank"
          icon="i-simple-icons-github"
          aria-label="GitHub"
          color="neutral"
          variant="ghost"
          size="sm"
        />
      </div>
    </header>

    <main class="flex-1 min-h-0">
      <slot />
    </main>
  </div>
</template>
