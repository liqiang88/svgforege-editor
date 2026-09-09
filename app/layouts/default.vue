<script setup lang="ts">
const githubUrl = 'https://github.com/liqiang88/svgforege-editor'
</script>

<template>
  <div>
    <UHeader>
      <template #left>
        <NuxtLink
          to="/"
          class="focus-visible:outline-3 outline-primary/25 rounded-md p-1 -ms-1 flex items-center gap-2"
        >
          <AppLogo class="w-7 h-7 shrink-0" />
          <span class="font-semibold text-highlighted">SVGForge Editor</span>
        </NuxtLink>
      </template>

      <template #right>
        <UButton
          to="/editor"
          icon="i-lucide-pen-tool"
          label="打开编辑器"
          color="primary"
          variant="soft"
          class="hidden sm:inline-flex"
        />

        <UColorModeButton />

        <UButton
          :to="githubUrl"
          target="_blank"
          icon="i-simple-icons-github"
          aria-label="GitHub"
          color="neutral"
          variant="ghost"
        />
      </template>
    </UHeader>

    <UMain>
      <slot />
    </UMain>

    <USeparator icon="i-lucide-vector-square" />

    <UFooter>
      <template #left>
        <p class="text-sm text-muted">
          SVGForge Editor · MIT License · © {{ new Date().getFullYear() }}
        </p>
      </template>

      <template #right>
        <UButton
          :to="githubUrl"
          target="_blank"
          icon="i-simple-icons-github"
          aria-label="GitHub"
          color="neutral"
          variant="ghost"
        />
      </template>
    </UFooter>
  </div>
</template>
