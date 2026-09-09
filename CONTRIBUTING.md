# 贡献指南

感谢你对 **SVGForge Editor** 的关注。欢迎提交 Bug、功能建议与代码贡献。

仓库地址：https://github.com/liqiang88/svgforege-editor

## 开发流程

1. Fork 仓库并克隆到本地
2. 安装依赖：`pnpm install`
3. 启动开发：`pnpm dev`
4. 创建分支，例如：`feat/canvas-toolbar` 或 `fix/header-link`
5. 提交前请运行：

```bash
pnpm lint
pnpm typecheck
pnpm build
```

6. 推送分支并发起 Pull Request

## 分支命名建议

| 前缀 | 用途 |
| --- | --- |
| `feat/` | 新功能 |
| `fix/` | Bug 修复 |
| `docs/` | 文档 |
| `chore/` | 构建 / 依赖 / 工具 |
| `refactor/` | 重构 |

## Commit 建议

使用简洁的祈使句，说明「为什么」：

```text
feat: 增加基础画布缩放
fix: 修复深色模式下页脚对比度
docs: 补充本地启动说明
```

## Pull Request 检查清单

- [ ] 变更范围聚焦，避免无关重构
- [ ] 本地 `lint` / `typecheck` / `build` 通过
- [ ] 如有 UI 变更，附上截图或简短说明
- [ ] 更新必要文档（README / 注释）

## Issue 建议

提交 Issue 时请尽量包含：

- 期望行为与实际行为
- 复现步骤
- 浏览器 / 系统 / Node 版本
- 相关截图或报错信息

## 行为准则

请保持友善、尊重与建设性讨论。我们希望社区对所有贡献者友好开放。
