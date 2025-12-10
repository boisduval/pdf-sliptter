# 📄 PDF Splitter (PDF 分割器)

[English](./README.md) | [简体中文](./README_zh-CN.md)

一款注重隐私的高级 Web 应用，用于将 PDF 文件拆分为单页，基于现代技术栈构建。所有的处理过程都在您的浏览器中本地完成，无需将敏感文件上传到任何服务器。

![License](https://img.shields.io/badge/license-MIT-blue.svg)
![Vue](https://img.shields.io/badge/Vue.js-3.x-green.svg)
![Vite](https://img.shields.io/badge/Vite-latest-purple.svg)
![TailwindCSS](https://img.shields.io/badge/TailwindCSS-3.x-cyan.svg)

## ✨ 功能特性

- **🔒 100% 客户端处理**：文件从未离开您的设备。所有处理均在本地浏览器中高效完成。
- **⚡ 极速体验**：由 `pdf-lib` 和 `pdfjs-dist` 驱动，处理速度极快。
- **🎨 现代 UI 设计**：使用 TailwindCSS 构建的精美玻璃拟态（Glassmorphism）设计。
- **🖱️ 拖拽交互**：直观的文件操作，支持直接拖入新文件以替换当前文件。
- **✂️ 灵活分割**：
  - 将所有页面分割为独立文件。
  - 自定义分割范围（例如：`1-5, 8, 11-13`）。
- **👀 实时预览**：
  - 根据选择的范围自动显示起始页和结束页的缩略图。
  - **高清大图**：点击缩略图即可查看全屏高清预览。
- **📦 自动打包**：自动将分割后的文件打包为 `.zip` 格式供下载。

## 🛠️ 技术栈

本项目采用了现代工程化实践，结构为 **Monorepo**：

- **核心框架**：[Vue 3](https://vuejs.org/) (Composition API)
- **构建工具**：[Vite](https://vitejs.dev/)
- **样式库**：[TailwindCSS](https://tailwindcss.com/)
- **PDF 引擎**：
  - [pdf-lib](https://pdf-lib.js.org/) 用于修改和分割 PDF。
  - [pdf.js](https://mozilla.github.io/pdf.js/) 用于渲染预览。
- **Monorepo 管理**：[Pnpm Workspaces](https://pnpm.io/workspaces) + [TurboRepo](https://turbo.build/)。
- **代码质量**：ESLint, Prettier, Stylelint, CSpell。

## 🚀 快速开始

### 前置要求 (Prerequisites)

- [Node.js](https://nodejs.org/) (建议最新 LTS 版本)
- [pnpm](https://pnpm.io/) (可通过 Corepack 启用或全局安装)

### 安装 (Installation)

1. 克隆仓库：
   ```bash
   git clone <repository-url>
   cd pdf-splitter
   ```

2. 安装依赖：
   ```bash
   pnpm install
   ```

### 开发 (Development)

启动开发服务器：

```bash
pnpm dev
# 或者专门启动 web 应用
turbo dev
```

访问 `http://localhost:5173` 查看应用。

### 构建 (Build)

构建生产版本：

```bash
pnpm build
```

构建产物将位于 `apps/web/dist` 目录。

## 📂 项目结构

```
pdf-splitter/
├── apps/
│   └── web/             # 主 Vue.js 应用程序
│       ├── src/
│       │   ├── components/  # DropZone, PdfPreview 等组件
│       │   └── ...
│       └── ...
├── .vscode/             # VS Code 设置
├── package.json         # 根目录配置
├── pnpm-workspace.yaml  # Workspace 定义
├── turbo.json           # TurboRepo 管道配置
└── ...
```

## 🤝 贡献指南

1. Fork 本项目
2. 创建您的特性分支 (`git checkout -b feature/AmazingFeature`)
3. 提交您的更改 (`git commit -m 'feat: Add some AmazingFeature'`)
4. 推送到分支 (`git push origin feature/AmazingFeature`)
5. 提交 Pull Request

## 📄 许可证

本项目基于 MIT 许可证分发。
