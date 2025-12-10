# 📄 PDF Splitter

[English](./README.md) | [简体中文](./README_zh-CN.md)


A premium, privacy-focused web application for splitting PDF files, built with a modern stack. Process your sensitive documents entirely in your browser without uploading them to any server.

![License](https://img.shields.io/badge/license-MIT-blue.svg)
![Vue](https://img.shields.io/badge/Vue.js-3.x-green.svg)
![Vite](https://img.shields.io/badge/Vite-latest-purple.svg)
![TailwindCSS](https://img.shields.io/badge/TailwindCSS-3.x-cyan.svg)

## ✨ Features

- **🔒 100% Client-Side**: Files never leave your device. All processing happens locally in your browser.
- **⚡ Blazing Fast**: Powered by `pdf-lib` and `pdfjs-dist` for efficient handling.
- **🎨 Modern UI**: Beautiful Glassmorphism design with TailwindCSS.
- **🖱️ Drag & Drop**: Intuitive file handling, including dropping new files to replace current work.
- **✂️ Flexible Splitting**: 
  - Split all pages into individual files.
  - Define custom ranges (e.g., `1-5, 8, 11-13`).
- **👀 Live Preview**: 
  - View thumbnails of start and end pages based on your range selection.
  - **High-Res Zoom**: Click thumbnails to view full-screen high-quality previews.
- **📦 Auto-Zip**: Automatically packages split files into a downloadable `.zip` archive.

## 🛠️ Technology Stack

This project is structured as a **Monorepo** using modern engineering practices:

- **Core Framework**: [Vue 3](https://vuejs.org/) (Composition API)
- **Build Tool**: [Vite](https://vitejs.dev/)
- **Styling**: [TailwindCSS](https://tailwindcss.com/)
- **PDF Engines**:
  - [pdf-lib](https://pdf-lib.js.org/) for modification/splitting.
  - [pdf.js](https://mozilla.github.io/pdf.js/) for rendering previews.
- **Monorepo Management**: [Pnpm Workspaces](https://pnpm.io/workspaces) + [TurboRepo](https://turbo.build/).
- **Code Quality**: ESLint, Prettier, Stylelint, CSpell.

## 🚀 Getting Started

### Prerequisites

- [Node.js](https://nodejs.org/) (Latest LTS recommended)
- [pnpm](https://pnpm.io/) (Enabled via Corepack or installed globally)

### Installation

1. Clone the repository:
   ```bash
   git clone <repository-url>
   cd pdf-splitter
   ```

2. Install dependencies:
   ```bash
   pnpm install
   ```

### Development

Start the development server:

```bash
pnpm dev
# or specifically for the web app
turbo dev
```

Visit `http://localhost:5173` to view the app.

### Build

Build the project for production:

```bash
pnpm build
```

The output will be located in `apps/web/dist`.

## 📂 Project Structure

```
pdf-splitter/
├── apps/
│   └── web/             # Main Vue.js application
│       ├── src/
│       │   ├── components/  # DropZone, PdfPreview, etc.
│       │   └── ...
│       └── ...
├── .vscode/             # VS Code settings
├── package.json         # Root configuration
├── pnpm-workspace.yaml  # Workspace definitions
├── turbo.json           # TurboRepo pipeline config
└── ...
```

## 🤝 Contributing

1. Fork the project
2. Create your feature branch (`git checkout -b feature/AmazingFeature`)
3. Commit your changes (`git commit -m 'feat: Add some AmazingFeature'`)
4. Push to the branch (`git push origin feature/AmazingFeature`)
5. Open a Pull Request

## 📄 License

Distributed under the MIT License.
