# SVGForge Editor

[License: MIT](./LICENSE)
[Nuxt UI](https://ui.nuxt.com)
[CI](https://github.com/liqiang88/svgforege-editor/actions/workflows/ci.yml)

开源 SVG 矢量编辑器，基于 **Nuxt 4** 与 **Nuxt UI v4** 构建。

## 在线演示

[https://svgforge.dev/svg-tools/editor/](https://svgforge.dev/svg-tools/editor/)

## 技术栈


| 类别    | 技术                          |
| ----- | --------------------------- |
| 框架    | Nuxt 4                      |
| UI    | Nuxt UI v4 + Tailwind CSS 4 |
| 编辑器内核 | SvgStudio（DOM SVG 编辑）       |
| 语言    | TypeScript                  |
| 包管理   | pnpm                        |


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

- 首页：`http://localhost:3000`
- 编辑器：`http://localhost:3000/editor`



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
│   ├── components/editor/   # 从 svgforge 抽离的 SvgStudio
│   ├── layouts/
│   ├── pages/
│   │   ├── index.vue
│   │   └── editor.vue
│   └── assets/css/main.css  # 含 --sf-* 主题变量
├── nuxt.config.ts
└── README.md
```



## 能力概览

- 上传 / 粘贴 SVG，或通过 Iconify key 加载
- 图层树、选中、拖拽移动、手柄缩放
- 尺寸 / 颜色 / 描边 / 透明度 / 圆角 / 旋转翻转
- 撤销重做
- 导出 SVG、JSX、TSX、HTML、CSS、Data URI、PNG、WEBP



## License

[MIT](./LICENSE) © SVGForge