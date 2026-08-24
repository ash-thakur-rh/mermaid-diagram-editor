# Mermaid Diagram Editor

A browser-based mermaid diagram editor with live preview, multi-tab support, localStorage persistence, and PNG/SVG export capabilities.

![Screenshot](https://via.placeholder.com/800x400?text=Screenshot+Coming+Soon)

## Features

- ✨ **Live Preview** - See your diagrams update in real-time as you type
- 📝 **Monaco Editor** - Professional code editor with syntax highlighting
- 🎨 **9 Templates** - Flowcharts, sequence diagrams, class diagrams, and more
- 💾 **Auto-save** - Your work is automatically saved to browser storage
- 📑 **Multi-tab** - Work on multiple diagrams simultaneously
- 🌓 **Dark Mode** - Easy on the eyes with full dark theme support
- 📤 **Export** - Download diagrams as PNG or SVG
- ⛶ **Expand Panels** - Maximize editor or preview for focused work
- 🚀 **No Backend** - Runs entirely in your browser, works offline

## Quick Start

Visit the live app: **[Your GitHub Pages URL]**

Or run locally:

```bash
git clone https://github.com/yourusername/mermaid-diagram-editor.git
cd mermaid-diagram-editor
npm install
npm run dev
```

Open http://localhost:5173 in your browser.

## Development

### Prerequisites

- Node.js 20.x or higher
- npm 10.x or higher

### Commands

```bash
npm install          # Install dependencies
npm run dev         # Start development server
npm run build       # Build for production
npm run preview     # Preview production build
```

### Project Structure

```
src/
├── index.html           # Main HTML entry point
├── scripts/
│   ├── app.js          # Application orchestrator
│   ├── editor.js       # Monaco editor module
│   ├── preview.js      # Mermaid rendering module
│   ├── storage.js      # LocalStorage persistence
│   ├── export.js       # PNG/SVG export handlers
│   ├── tabs.js         # Multi-tab management
│   └── templates.js    # Sample diagram library
├── styles/
│   ├── main.css        # Base layout and typography
│   ├── editor.css      # Editor panel styles
│   ├── preview.css     # Preview panel styles
│   └── themes.css      # Light/dark theme variables
└── assets/
    └── samples.json    # Template definitions
```

## Deployment

This project uses GitHub Actions for automated deployment to GitHub Pages.

1. Push to `main` branch
2. GitHub Actions builds the project
3. Deploys to GitHub Pages automatically

Enable GitHub Pages in your repository settings:
- Settings → Pages → Source: GitHub Actions

## Technology Stack

- **Vite 8.2.2** - Build tool and dev server
- **Mermaid 11.17.1** - Diagram rendering
- **Monaco Editor 0.56.0** - Code editor
- **html-to-image 1.11.13** - PNG export
- **FileSaver 2.0.5** - File downloads

All dependencies are pinned to exact versions for reproducibility.

## Browser Compatibility

- Chrome/Edge (latest)
- Firefox (latest)
- Safari (latest)

## Contributing

Contributions are welcome! Please feel free to submit a Pull Request.

## License

MIT License - see LICENSE file for details

## Acknowledgments

- [Mermaid.js](https://mermaid.js.org/) - Amazing diagram library
- [Monaco Editor](https://microsoft.github.io/monaco-editor/) - VS Code's editor
- Inspired by the need for a simple, offline-capable diagram tool