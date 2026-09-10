<script setup lang="ts">
const githubUrl = 'https://github.com/liqiang88/svgforege-editor'

const links = [
  {
    label: '打开编辑器',
    to: '/editor',
    trailingIcon: 'i-lucide-pen-tool',
    size: 'xl' as const
  },
  {
    label: 'GitHub',
    to: githubUrl,
    target: '_blank',
    icon: 'i-simple-icons-github',
    size: 'xl' as const,
    color: 'neutral' as const,
    variant: 'subtle' as const
  }
]

const features = [
  {
    icon: 'i-lucide-layers',
    title: '图层与选中',
    description: 'DOM 图层树、显隐与删除，选中后可拖拽移动与手柄缩放。'
  },
  {
    icon: 'i-lucide-sliders-horizontal',
    title: '属性检查器',
    description: '尺寸、填充、描边、透明度、圆角、旋转与翻转。'
  },
  {
    icon: 'i-lucide-history',
    title: '撤销 / 重做',
    description: '完整历史栈，支持快捷键 Ctrl/Cmd + Z / Y。'
  },
  {
    icon: 'i-lucide-file-code-2',
    title: '多格式导出',
    description: 'SVG / JSX / TSX / HTML / CSS / Data URI，以及 PNG / WEBP。'
  },
  {
    icon: 'i-lucide-upload',
    title: '上传 / 粘贴 / Iconify',
    description: '本地上传、剪贴板粘贴，或通过 Iconify key 拉取图标。'
  },
  {
    icon: 'i-lucide-package-open',
    title: '从 SVGForge 抽离',
    description: '核心来自 svgforge-web 的 SvgStudio，独立开源，原项目不变。'
  }
]
</script>

<template>
  <div>
    <UPageHero
      title="SVGForge Editor"
      description="开源 SVG 矢量编辑器。画布内核抽离自 svgforge 的 SvgStudio：图层、检查器、撤销重做与多格式导出。"
      :links="links"
    >
      <template #headline>
        <UBadge
          label="Open Source · SvgStudio · Nuxt UI v4"
          variant="subtle"
          color="primary"
        />
      </template>
    </UPageHero>

    <UPageSection
      id="features"
      title="浏览器内完整编辑闭环"
      description="上传或粘贴 SVG 后即可编辑；无需后端，导出在本地完成。"
      :features="features"
    />

    <UPageSection id="getting-started">
      <div class="mx-auto max-w-2xl text-center space-y-6">
        <div class="space-y-2">
          <h2 class="text-2xl font-semibold text-highlighted">
            本地启动
          </h2>
          <p class="text-muted">
            安装依赖后访问 /editor 即可使用完整 SvgStudio 编辑器。
          </p>
        </div>

        <pre class="rounded-lg bg-elevated border border-default p-4 text-sm text-left overflow-x-auto"><code>pnpm install
pnpm dev</code></pre>

        <div class="flex flex-wrap items-center justify-center gap-3">
          <UButton
            label="打开编辑器"
            to="/editor"
            trailing-icon="i-lucide-pen-tool"
          />
          <UButton
            label="查看 README"
            :to="githubUrl"
            target="_blank"
            color="neutral"
            variant="outline"
            trailing-icon="i-lucide-arrow-right"
          />
        </div>
      </div>
    </UPageSection>
  </div>
</template>
