# SVGForge Editor

[![License: MIT](https://img.shields.io/badge/License-MIT-skyblue.svg)](./LICENSE)
[![Nuxt UI](https://img.shields.io/badge/Made%20with-Nuxt%20UI%20v4-0ea5e9?logo=nuxt&labelColor=020420)](https://ui.nuxt.com)
[![CI](https://github.com/liqiang88/svgforege-editor/actions/workflows/ci.yml/badge.svg)](https://github.com/liqiang88/svgforege-editor/actions/workflows/ci.yml)

开源 SVG 矢量编辑器，基于 **Nuxt 4** 与 **Nuxt UI v4** 构建。

画布内核来自 `tools` 项目中的 **SVG-edit**（`laravel6Admin/public/frontend/svg-edit`），已完整抽离到本仓库的 `public/svg-edit`；原 `tools` 项目代码保持不变。

## 技术栈

| 类别 | 技术 |
| --- | --- |
| 框架 | Nuxt 4 |
| UI | Nuxt UI v4 + Tailwind CSS 4 |
| 编辑器内核 | SVG-edit（静态资源） |
| 语言 | TypeScript |
| 包管理 | pnpm |
| 质量 | ESLint（`@nuxt/eslint`） |

## 快速开始

### 环境要求

- Node.js `>= 22`
- pnpm `>= 9`

### 安装与开发

```bash
git clone https://github.com/liqiang88/svgforege-editor.git
cd svgforge-editor
pnpm install
pnpm dev
```

浏览器访问：

- 首页：`http://localhost:3000`
- 编辑器：`http://localhost:3000/editor`
- 独立静态页：`http://localhost:3000/svg-edit/index.html`

### 常用命令

```bash
pnpm dev          # 开发服务器
pnpm build        # 生产构建
pnpm preview      # 预览生产构建
pnpm lint         # ESLint
pnpm typecheck    # 类型检查
```

## 目录结构

```text
svgforge-editor/
├── app/
│   ├── assets/css/main.css
│   ├── components/
│   ├── layouts/
│   │   ├── default.vue       # 站点壳
│   │   └── editor.vue        # 全屏编辑器壳
│   ├── pages/
│   │   ├── index.vue         # 落地页
│   │   └── editor.vue        # 嵌入 SVG-edit
│   ├── app.config.ts
│   └── app.vue
├── public/
│   └── svg-edit/             # 从 tools 抽离的 SVG-edit 静态内核
├── .github/
├── nuxt.config.ts
├── LICENSE
└── README.md
```

## 开源协作

欢迎贡献代码、文档与想法：

1. Fork 本仓库并创建分支
2. 提交清晰的变更说明
3. 发起 Pull Request

详见 [CONTRIBUTING.md](./CONTRIBUTING.md)。

- Issue：[提交问题](https://github.com/liqiang88/svgforege-editor/issues)
- 讨论：欢迎通过 Issue 讨论功能方向与设计

## License

[MIT](./LICENSE) © SVGForge

SVG-edit 内核遵循其上游许可证；本仓库站点壳层为 MIT。
