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
    icon: 'i-lucide-pen-tool',
    title: '矢量编辑',
    description: '路径、形状、图层与节点编辑，适合图标、插画与界面素材。'
  },
  {
    icon: 'i-lucide-panels-top-left',
    title: '现代界面壳',
    description: 'Nuxt UI v4 站点壳层，自带深色模式与一致设计语言；画布内核基于 SVG-edit。'
  },
  {
    icon: 'i-lucide-folder-open',
    title: '打开 / 导出',
    description: '支持打开本地 SVG，并导出编辑结果，便于嵌入工具链。'
  },
  {
    icon: 'i-lucide-puzzle',
    title: '扩展能力',
    description: '内置网格、形状库、取色、平移、星形等多款扩展，可继续扩展。'
  },
  {
    icon: 'i-lucide-package-open',
    title: 'MIT 开源',
    description: '可自由使用、修改与分发，适合个人项目与商业产品集成。'
  },
  {
    icon: 'i-lucide-zap',
    title: 'Nuxt 4 部署',
    description: '静态资源 + Nuxt 页面封装，便于独立部署或嵌入现有产品。'
  }
]
</script>

<template>
  <div>
    <UPageHero
      title="SVGForge Editor"
      description="开源 SVG 矢量编辑器。画布能力来自 tools 项目中的 SVG-edit，现已独立抽离为可部署的开源仓库。"
      :links="links"
    >
      <template #headline>
        <UBadge
          label="Open Source · SVG-edit · Nuxt UI v4"
          variant="subtle"
          color="primary"
        />
      </template>
    </UPageHero>

    <UPageSection
      id="features"
      title="开箱即用的 SVG 编辑能力"
      description="编辑器静态内核位于 public/svg-edit，通过 /editor 页面嵌入；原 tools 项目代码保持不变。"
      :features="features"
    />

    <UPageSection id="getting-started">
      <div class="mx-auto max-w-2xl text-center space-y-6">
        <div class="space-y-2">
          <h2 class="text-2xl font-semibold text-highlighted">
            本地启动
          </h2>
          <p class="text-muted">
            安装依赖后启动开发服务器，访问 /editor 即可使用完整 SVG 编辑器。
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
