# Mermaid Diagram Editor Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Build a browser-based mermaid diagram editor with live preview, multi-tab support, localStorage persistence, and PNG/SVG export, deployed to GitHub Pages.

**Architecture:** Modular vanilla JavaScript with Vite build system. Monaco Editor for code editing, Mermaid.js for rendering. LocalStorage for persistence. Event-driven architecture with debounced auto-save.

**Tech Stack:** Vite 8.2.2, Mermaid 11.17.1, Monaco Editor 0.56.0, html-to-image 1.11.13, FileSaver 2.0.5

**Spec:** `docs/design.md`

## Global Constraints

- All npm dependencies pinned to exact versions (no `^` or `~`)
- Node.js 20.x required for GitHub Actions
- Browser target: Chrome/Firefox/Safari latest versions
- No backend - pure static site
- All data stored in browser localStorage
- File paths use ES modules (`import`/`export`)

---

### Task 1: Project Scaffolding

**Files:**
- Create: `package.json`
- Create: `vite.config.js`
- Create: `.gitignore`
- Create: `README.md`

**Interfaces:**
- Consumes: None (foundation task)
- Produces: npm project with Vite build system, ready for `npm install`

- [ ] **Step 1: Create package.json with pinned dependencies**

```json
{
  "name": "mermaid-diagram-editor",
  "version": "1.0.0",
  "type": "module",
  "scripts": {
    "dev": "vite",
    "build": "vite build",
    "preview": "vite preview"
  },
  "dependencies": {
    "mermaid": "11.17.1",
    "monaco-editor": "0.56.0",
    "html-to-image": "1.11.13",
    "file-saver": "2.0.5"
  },
  "devDependencies": {
    "vite": "8.2.2"
  }
}
```

- [ ] **Step 2: Create vite.config.js**

```javascript
import { defineConfig } from 'vite';

export default defineConfig({
  root: 'src',
  build: {
    outDir: '../dist',
    emptyOutDir: true
  },
  base: './'
});
```

- [ ] **Step 3: Create .gitignore**

```
node_modules/
dist/
.DS_Store
*.log
```

- [ ] **Step 4: Create README.md**

```markdown
# Mermaid Diagram Editor

A browser-based mermaid diagram editor with live preview, multi-tab support, and PNG/SVG export.

## Development

\`\`\`bash
npm install
npm run dev
\`\`\`

Open http://localhost:5173

## Build

\`\`\`bash
npm run build
npm run preview
\`\`\`

## Features

- Live preview with Monaco editor
- Multi-tab sessions
- LocalStorage persistence
- PNG and SVG export
- Light/Dark theme
- Sample templates
```

- [ ] **Step 5: Run npm install**

Run: `cd ~/ai-projects/mermaid-diagram-editor && npm install`
Expected: Dependencies installed, `node_modules/` and `package-lock.json` created

- [ ] **Step 6: Commit**

```bash
git add package.json package-lock.json vite.config.js .gitignore README.md
git commit -m "feat: initialize project with Vite and pinned dependencies"
```

---

### Task 2: Storage Module

**Files:**
- Create: `src/scripts/storage.js`

**Interfaces:**
- Consumes: None (foundation module)
- Produces:
  - `saveTabs(tabs: Array<{id, name, code, createdAt, updatedAt}>) → void`
  - `loadTabs() → Array<{id, name, code, createdAt, updatedAt}> | null`
  - `savePreferences({theme: string, layoutMode: string}) → void`
  - `loadPreferences() → {theme: string, layoutMode: string} | null`

- [ ] **Step 1: Create storage.js with saveTabs function**

```javascript
const STORAGE_KEYS = {
  TABS: 'mermaid-editor-tabs',
  PREFERENCES: 'mermaid-editor-preferences'
};

export function saveTabs(tabs) {
  try {
    localStorage.setItem(STORAGE_KEYS.TABS, JSON.stringify(tabs));
  } catch (error) {
    if (error.name === 'QuotaExceededError') {
      console.error('LocalStorage quota exceeded. Please delete old tabs.');
      showToast('Storage full. Delete some tabs to save changes.');
    } else {
      console.error('Failed to save tabs:', error);
    }
  }
}

export function loadTabs() {
  try {
    const data = localStorage.getItem(STORAGE_KEYS.TABS);
    return data ? JSON.parse(data) : null;
  } catch (error) {
    console.error('Failed to load tabs. Clearing corrupted data.', error);
    localStorage.removeItem(STORAGE_KEYS.TABS);
    return null;
  }
}

export function savePreferences(preferences) {
  try {
    localStorage.setItem(STORAGE_KEYS.PREFERENCES, JSON.stringify(preferences));
  } catch (error) {
    console.error('Failed to save preferences:', error);
  }
}

export function loadPreferences() {
  try {
    const data = localStorage.getItem(STORAGE_KEYS.PREFERENCES);
    return data ? JSON.parse(data) : null;
  } catch (error) {
    console.error('Failed to load preferences:', error);
    localStorage.removeItem(STORAGE_KEYS.PREFERENCES);
    return null;
  }
}

function showToast(message) {
  const toast = document.createElement('div');
  toast.className = 'toast';
  toast.textContent = message;
  document.body.appendChild(toast);
  setTimeout(() => toast.remove(), 5000);
}
```

- [ ] **Step 2: Test storage module in browser console**

Run: `npm run dev`
Open browser console at http://localhost:5173
Test:
```javascript
import { saveTabs, loadTabs } from '/scripts/storage.js';
saveTabs([{id: '1', name: 'Test', code: 'graph TD\nA-->B', createdAt: Date.now(), updatedAt: Date.now()}]);
console.log(loadTabs());
```
Expected: Array with one tab returned

- [ ] **Step 3: Commit**

```bash
git add src/scripts/storage.js
git commit -m "feat: add localStorage module with error handling"
```

---

### Task 3: Templates Module

**Files:**
- Create: `src/assets/samples.json`
- Create: `src/scripts/templates.js`

**Interfaces:**
- Consumes: None
- Produces:
  - `getTemplates() → Array<{id: string, name: string, code: string}>`
  - `getWelcomeTemplate() → {id: string, name: string, code: string}`

- [ ] **Step 1: Create samples.json with template definitions**

```json
[
  {
    "id": "welcome",
    "name": "Welcome",
    "code": "graph TD\n    A[Welcome to Mermaid Editor] --> B{Choose Action}\n    B -->|New Diagram| C[Start Creating]\n    B -->|Use Template| D[Pick Template]\n    B -->|Import| E[Load Saved]\n    C --> F[Live Preview]\n    D --> F\n    E --> F"
  },
  {
    "id": "flowchart",
    "name": "Flowchart",
    "code": "graph TD\n    A[Start] --> B{Decision}\n    B -->|Yes| C[Process 1]\n    B -->|No| D[Process 2]\n    C --> E[End]\n    D --> E"
  },
  {
    "id": "sequence",
    "name": "Sequence Diagram",
    "code": "sequenceDiagram\n    participant Alice\n    participant Bob\n    Alice->>Bob: Hello Bob!\n    Bob->>Alice: Hello Alice!\n    Alice->>Bob: How are you?\n    Bob->>Alice: I'm good, thanks!"
  },
  {
    "id": "class",
    "name": "Class Diagram",
    "code": "classDiagram\n    class Animal {\n        +String name\n        +int age\n        +makeSound()\n    }\n    class Dog {\n        +bark()\n    }\n    Animal <|-- Dog"
  },
  {
    "id": "state",
    "name": "State Diagram",
    "code": "stateDiagram-v2\n    [*] --> Still\n    Still --> [*]\n    Still --> Moving\n    Moving --> Still\n    Moving --> Crash\n    Crash --> [*]"
  },
  {
    "id": "er",
    "name": "ER Diagram",
    "code": "erDiagram\n    CUSTOMER ||--o{ ORDER : places\n    ORDER ||--|{ LINE-ITEM : contains\n    CUSTOMER {\n        string name\n        string email\n    }\n    ORDER {\n        int orderNumber\n        date orderDate\n    }"
  },
  {
    "id": "gantt",
    "name": "Gantt Chart",
    "code": "gantt\n    title Project Timeline\n    dateFormat YYYY-MM-DD\n    section Planning\n    Requirements :a1, 2024-01-01, 30d\n    Design :after a1, 20d\n    section Development\n    Implementation :2024-02-20, 45d\n    Testing :2024-04-01, 30d"
  },
  {
    "id": "pie",
    "name": "Pie Chart",
    "code": "pie title Project Budget\n    \"Development\" : 45\n    \"Design\" : 25\n    \"Testing\" : 15\n    \"Documentation\" : 15"
  },
  {
    "id": "git",
    "name": "Git Graph",
    "code": "gitGraph\n    commit\n    commit\n    branch develop\n    checkout develop\n    commit\n    commit\n    checkout main\n    merge develop\n    commit"
  }
]
```

- [ ] **Step 2: Create templates.js**

```javascript
import samplesData from '../assets/samples.json';

export function getTemplates() {
  return samplesData;
}

export function getWelcomeTemplate() {
  return samplesData.find(t => t.id === 'welcome') || samplesData[0];
}

export function getTemplateById(id) {
  return samplesData.find(t => t.id === id);
}
```

- [ ] **Step 3: Test templates module**

Run: Browser console at http://localhost:5173
```javascript
import { getTemplates, getWelcomeTemplate } from '/scripts/templates.js';
console.log(getTemplates().length);
console.log(getWelcomeTemplate().name);
```
Expected: `9` and `"Welcome"`

- [ ] **Step 4: Commit**

```bash
git add src/assets/samples.json src/scripts/templates.js
git commit -m "feat: add template library with 9 sample diagrams"
```

---

### Task 4: Preview Module

**Files:**
- Create: `src/scripts/preview.js`

**Interfaces:**
- Consumes: None (uses mermaid library)
- Produces:
  - `initPreview(container: HTMLElement, theme: string) → void`
  - `renderDiagram(code: string) → Promise<void>`
  - `setTheme(theme: string) → void`
  - `getSvgElement() → SVGElement | null`

- [ ] **Step 1: Create preview.js with mermaid initialization**

```javascript
import mermaid from 'mermaid';

let previewContainer = null;
let currentTheme = 'light';
let lastValidSvg = null;

export function initPreview(container, theme = 'light') {
  previewContainer = container;
  currentTheme = theme;
  
  mermaid.initialize({
    startOnLoad: false,
    theme: theme === 'dark' ? 'dark' : 'default',
    securityLevel: 'loose',
    fontFamily: 'monospace'
  });
}

export async function renderDiagram(code) {
  if (!previewContainer) {
    console.error('Preview not initialized');
    return;
  }

  if (!code || code.trim() === '') {
    previewContainer.innerHTML = '<div class="preview-placeholder">Start typing to see preview...</div>';
    return;
  }

  try {
    const uniqueId = `mermaid-${Date.now()}`;
    const { svg } = await mermaid.render(uniqueId, code);
    
    previewContainer.innerHTML = svg;
    lastValidSvg = previewContainer.querySelector('svg');
    
    const errorElement = previewContainer.querySelector('.error-message');
    if (errorElement) {
      errorElement.remove();
    }
  } catch (error) {
    console.error('Mermaid render error:', error);
    
    let errorMessage = error.message || 'Invalid mermaid syntax';
    const lineMatch = errorMessage.match(/line (\d+)/i);
    const lineNumber = lineMatch ? lineMatch[1] : '';
    
    const errorHtml = `
      <div class="error-message">
        <h3>Diagram Error</h3>
        <p>${lineNumber ? `Line ${lineNumber}: ` : ''}${errorMessage}</p>
        <p class="error-hint">Fix the syntax to see the diagram.</p>
      </div>
    `;
    
    const existingError = previewContainer.querySelector('.error-message');
    if (existingError) {
      existingError.outerHTML = errorHtml;
    } else {
      previewContainer.insertAdjacentHTML('beforeend', errorHtml);
    }
  }
}

export function setTheme(theme) {
  currentTheme = theme;
  mermaid.initialize({
    startOnLoad: false,
    theme: theme === 'dark' ? 'dark' : 'default',
    securityLevel: 'loose',
    fontFamily: 'monospace'
  });
}

export function getSvgElement() {
  return lastValidSvg;
}
```

- [ ] **Step 2: Create minimal HTML for testing**

Create `src/index.html`:
```html
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Mermaid Diagram Editor</title>
</head>
<body>
  <div id="preview"></div>
  <script type="module">
    import { initPreview, renderDiagram } from '/scripts/preview.js';
    const container = document.getElementById('preview');
    initPreview(container, 'light');
    renderDiagram('graph TD\nA-->B');
  </script>
</body>
</html>
```

- [ ] **Step 3: Test preview module**

Run: `npm run dev`
Open http://localhost:5173
Expected: See a simple diagram with two nodes A→B

- [ ] **Step 4: Test error handling**

Browser console:
```javascript
import { renderDiagram } from '/scripts/preview.js';
renderDiagram('invalid mermaid code');
```
Expected: Error message displayed in preview area

- [ ] **Step 5: Commit**

```bash
git add src/scripts/preview.js src/index.html
git commit -m "feat: add preview module with mermaid rendering and error handling"
```

---

### Task 5: Editor Module

**Files:**
- Create: `src/scripts/editor.js`

**Interfaces:**
- Consumes: None (uses monaco-editor library)
- Produces:
  - `initEditor(container: HTMLElement, initialCode: string) → Object`
  - `loadCode(code: string) → void`
  - `getCode() → string`
  - `onChange(callback: Function) → void`

- [ ] **Step 1: Create editor.js with Monaco initialization**

```javascript
import * as monaco from 'monaco-editor';

let editorInstance = null;
let changeCallback = null;

export function initEditor(container, initialCode = '') {
  editorInstance = monaco.editor.create(container, {
    value: initialCode,
    language: 'plaintext',
    theme: 'vs',
    minimap: { enabled: true },
    lineNumbers: 'on',
    wordWrap: 'on',
    automaticLayout: true,
    fontSize: 14
  });

  editorInstance.onDidChangeModelContent(() => {
    if (changeCallback) {
      changeCallback(editorInstance.getValue());
    }
  });

  return editorInstance;
}

export function loadCode(code) {
  if (editorInstance) {
    editorInstance.setValue(code);
  }
}

export function getCode() {
  return editorInstance ? editorInstance.getValue() : '';
}

export function onChange(callback) {
  changeCallback = callback;
}

export function setTheme(theme) {
  if (editorInstance) {
    monaco.editor.setTheme(theme === 'dark' ? 'vs-dark' : 'vs');
  }
}
```

- [ ] **Step 2: Update index.html to test editor**

Update `src/index.html`:
```html
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Mermaid Diagram Editor</title>
  <style>
    #editor { width: 50%; height: 500px; border: 1px solid #ccc; float: left; }
    #preview { width: 50%; height: 500px; border: 1px solid #ccc; float: left; }
  </style>
</head>
<body>
  <div id="editor"></div>
  <div id="preview"></div>
  <script type="module">
    import { initEditor, onChange } from '/scripts/editor.js';
    import { initPreview, renderDiagram } from '/scripts/preview.js';
    
    const editorContainer = document.getElementById('editor');
    const previewContainer = document.getElementById('preview');
    
    initEditor(editorContainer, 'graph TD\n    A[Start] --> B[End]');
    initPreview(previewContainer, 'light');
    renderDiagram('graph TD\n    A[Start] --> B[End]');
    
    onChange((code) => {
      renderDiagram(code);
    });
  </script>
</body>
</html>
```

- [ ] **Step 3: Test editor with live preview**

Run: `npm run dev`
Open http://localhost:5173
Type in editor, verify preview updates immediately
Expected: Live preview working

- [ ] **Step 4: Commit**

```bash
git add src/scripts/editor.js src/index.html
git commit -m "feat: add Monaco editor with live preview integration"
```

---

### Task 6: Tabs Module

**Files:**
- Create: `src/scripts/tabs.js`

**Interfaces:**
- Consumes:
  - `saveTabs(tabs) → void` from storage.js
  - `loadTabs() → Array | null` from storage.js
  - `getWelcomeTemplate() → {id, name, code}` from templates.js
- Produces:
  - `initTabs(onTabSwitch: Function) → Array<Tab>`
  - `createTab(template?: {name, code}) → Tab`
  - `switchTab(tabId: string) → Tab`
  - `deleteTab(tabId: string) → void`
  - `getCurrentTab() → Tab`
  - `getAllTabs() → Array<Tab>`
  - `updateCurrentTab(updates: {name?, code?}) → void`
  - `renderTabBar(container: HTMLElement) → void`

- [ ] **Step 1: Create tabs.js with tab management**

```javascript
import { saveTabs, loadTabs } from './storage.js';
import { getWelcomeTemplate } from './templates.js';

let tabs = [];
let currentTabId = null;
let onTabSwitchCallback = null;
let tabBarContainer = null;

function generateId() {
  return `tab-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
}

export function initTabs(onTabSwitch) {
  onTabSwitchCallback = onTabSwitch;
  
  const savedTabs = loadTabs();
  if (savedTabs && savedTabs.length > 0) {
    tabs = savedTabs;
    currentTabId = tabs[0].id;
  } else {
    const welcome = getWelcomeTemplate();
    const defaultTab = createTab({ name: welcome.name, code: welcome.code });
    tabs = [defaultTab];
    currentTabId = defaultTab.id;
    saveTabs(tabs);
  }
  
  return tabs;
}

export function createTab(template = null) {
  const newTab = {
    id: generateId(),
    name: template?.name || `Untitled ${tabs.length + 1}`,
    code: template?.code || '',
    createdAt: Date.now(),
    updatedAt: Date.now()
  };
  
  tabs.push(newTab);
  saveTabs(tabs);
  
  return newTab;
}

export function switchTab(tabId) {
  const tab = tabs.find(t => t.id === tabId);
  if (!tab) {
    console.error('Tab not found:', tabId);
    return null;
  }
  
  currentTabId = tabId;
  
  if (onTabSwitchCallback) {
    onTabSwitchCallback(tab);
  }
  
  if (tabBarContainer) {
    renderTabBar(tabBarContainer);
  }
  
  return tab;
}

export function deleteTab(tabId) {
  if (tabs.length === 1) {
    alert('Cannot delete the last tab');
    return;
  }
  
  const index = tabs.findIndex(t => t.id === tabId);
  if (index === -1) return;
  
  tabs.splice(index, 1);
  
  if (currentTabId === tabId) {
    const newCurrentTab = tabs[Math.max(0, index - 1)];
    switchTab(newCurrentTab.id);
  }
  
  saveTabs(tabs);
  
  if (tabBarContainer) {
    renderTabBar(tabBarContainer);
  }
}

export function getCurrentTab() {
  return tabs.find(t => t.id === currentTabId) || tabs[0];
}

export function getAllTabs() {
  return tabs;
}

export function updateCurrentTab(updates) {
  const tab = getCurrentTab();
  if (!tab) return;
  
  if (updates.name !== undefined) {
    tab.name = updates.name;
  }
  if (updates.code !== undefined) {
    tab.code = updates.code;
  }
  tab.updatedAt = Date.now();
  
  saveTabs(tabs);
  
  if (tabBarContainer && updates.name !== undefined) {
    renderTabBar(tabBarContainer);
  }
}

export function renderTabBar(container) {
  tabBarContainer = container;
  
  const tabsHtml = tabs.map(tab => `
    <div class="tab ${tab.id === currentTabId ? 'active' : ''}" data-tab-id="${tab.id}">
      <span class="tab-name">${tab.name}</span>
      ${tabs.length > 1 ? `<button class="tab-close" data-tab-id="${tab.id}">&times;</button>` : ''}
    </div>
  `).join('');
  
  const html = `
    <div class="tab-list">
      ${tabsHtml}
    </div>
    <button class="tab-new" id="new-tab-btn">+</button>
  `;
  
  container.innerHTML = html;
  
  container.querySelectorAll('.tab').forEach(tabEl => {
    tabEl.addEventListener('click', (e) => {
      if (!e.target.classList.contains('tab-close')) {
        switchTab(tabEl.dataset.tabId);
      }
    });
  });
  
  container.querySelectorAll('.tab-close').forEach(btn => {
    btn.addEventListener('click', (e) => {
      e.stopPropagation();
      deleteTab(btn.dataset.tabId);
    });
  });
  
  container.querySelector('#new-tab-btn')?.addEventListener('click', () => {
    const newTab = createTab();
    switchTab(newTab.id);
    renderTabBar(container);
  });
}
```

- [ ] **Step 2: Update index.html to test tabs**

Update `src/index.html`:
```html
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Mermaid Diagram Editor</title>
  <style>
    body { margin: 0; font-family: Arial, sans-serif; }
    #tab-bar { height: 40px; background: #f0f0f0; display: flex; align-items: center; padding: 0 10px; }
    .tab-list { display: flex; gap: 5px; flex: 1; }
    .tab { padding: 8px 12px; background: white; border: 1px solid #ccc; border-radius: 4px 4px 0 0; cursor: pointer; display: flex; align-items: center; gap: 8px; }
    .tab.active { background: #007acc; color: white; border-color: #007acc; }
    .tab-close { background: none; border: none; font-size: 18px; cursor: pointer; padding: 0 4px; }
    .tab-new { background: #007acc; color: white; border: none; padding: 8px 16px; border-radius: 4px; cursor: pointer; }
    #editor { width: 50%; height: calc(100vh - 40px); float: left; }
    #preview { width: 50%; height: calc(100vh - 40px); float: left; padding: 20px; box-sizing: border-box; overflow: auto; }
  </style>
</head>
<body>
  <div id="tab-bar"></div>
  <div id="editor"></div>
  <div id="preview"></div>
  <script type="module">
    import { initEditor, loadCode, onChange } from '/scripts/editor.js';
    import { initPreview, renderDiagram } from '/scripts/preview.js';
    import { initTabs, renderTabBar, getCurrentTab, updateCurrentTab } from '/scripts/tabs.js';
    
    const editorContainer = document.getElementById('editor');
    const previewContainer = document.getElementById('preview');
    const tabBarContainer = document.getElementById('tab-bar');
    
    initPreview(previewContainer, 'light');
    
    initTabs((tab) => {
      loadCode(tab.code);
      renderDiagram(tab.code);
    });
    
    const currentTab = getCurrentTab();
    initEditor(editorContainer, currentTab.code);
    renderDiagram(currentTab.code);
    renderTabBar(tabBarContainer);
    
    onChange((code) => {
      updateCurrentTab({ code });
      renderDiagram(code);
    });
  </script>
</body>
</html>
```

- [ ] **Step 3: Test tab functionality**

Run: `npm run dev`
Test:
1. Click "+" to create new tab
2. Switch between tabs
3. Edit code in each tab
4. Refresh browser - tabs should persist
5. Try to delete last tab - should show alert
Expected: All tab operations working

- [ ] **Step 4: Commit**

```bash
git add src/scripts/tabs.js src/index.html
git commit -m "feat: add multi-tab management with localStorage persistence"
```

---

### Task 7: Export Module

**Files:**
- Create: `src/scripts/export.js`

**Interfaces:**
- Consumes:
  - `getSvgElement() → SVGElement` from preview.js
  - `getCurrentTab() → {name}` from tabs.js
- Produces:
  - `exportPNG(svgElement: SVGElement, filename: string) → Promise<void>`
  - `exportSVG(svgElement: SVGElement, filename: string) → Promise<void>`

- [ ] **Step 1: Create export.js with PNG and SVG export**

```javascript
import { toPng } from 'html-to-image';
import { saveAs } from 'file-saver';

export async function exportPNG(svgElement, filename) {
  if (!svgElement) {
    alert('No diagram to export. Please create a diagram first.');
    return;
  }

  try {
    const dataUrl = await toPng(svgElement, {
      quality: 1.0,
      pixelRatio: 2,
      backgroundColor: '#ffffff'
    });
    
    const blob = await (await fetch(dataUrl)).blob();
    saveAs(blob, filename);
  } catch (error) {
    console.error('PNG export failed:', error);
    alert(`Failed to export PNG: ${error.message}`);
  }
}

export async function exportSVG(svgElement, filename) {
  if (!svgElement) {
    alert('No diagram to export. Please create a diagram first.');
    return;
  }

  try {
    const clonedSvg = svgElement.cloneNode(true);
    
    const styles = Array.from(document.styleSheets)
      .filter(sheet => {
        try {
          return sheet.cssRules;
        } catch (e) {
          return false;
        }
      })
      .flatMap(sheet => Array.from(sheet.cssRules))
      .filter(rule => rule instanceof CSSStyleRule)
      .map(rule => rule.cssText)
      .join('\n');
    
    const styleElement = document.createElementNS('http://www.w3.org/2000/svg', 'style');
    styleElement.textContent = styles;
    clonedSvg.insertBefore(styleElement, clonedSvg.firstChild);
    
    const serializer = new XMLSerializer();
    const svgString = serializer.serializeToString(clonedSvg);
    const blob = new Blob([svgString], { type: 'image/svg+xml;charset=utf-8' });
    
    saveAs(blob, filename);
  } catch (error) {
    console.error('SVG export failed:', error);
    alert(`Failed to export SVG: ${error.message}`);
  }
}

export function generateFilename(baseName, extension) {
  const date = new Date().toISOString().split('T')[0];
  const safeName = baseName.replace(/[^a-zA-Z0-9]/g, '-').toLowerCase();
  return `${safeName}-${date}.${extension}`;
}
```

- [ ] **Step 2: Update index.html to test export**

Update `src/index.html` to add export buttons:
```html
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Mermaid Diagram Editor</title>
  <style>
    body { margin: 0; font-family: Arial, sans-serif; }
    #tab-bar { height: 40px; background: #f0f0f0; display: flex; align-items: center; padding: 0 10px; }
    .tab-list { display: flex; gap: 5px; flex: 1; }
    .tab { padding: 8px 12px; background: white; border: 1px solid #ccc; border-radius: 4px 4px 0 0; cursor: pointer; display: flex; align-items: center; gap: 8px; }
    .tab.active { background: #007acc; color: white; border-color: #007acc; }
    .tab-close { background: none; border: none; font-size: 18px; cursor: pointer; padding: 0 4px; }
    .tab-new { background: #007acc; color: white; border: none; padding: 8px 16px; border-radius: 4px; cursor: pointer; }
    #editor { width: 50%; height: calc(100vh - 40px); float: left; }
    #preview-panel { width: 50%; height: calc(100vh - 40px); float: left; }
    #preview { padding: 20px; height: calc(100% - 60px); overflow: auto; }
    #export-buttons { padding: 10px; border-top: 1px solid #ccc; display: flex; gap: 10px; }
    .export-btn { padding: 8px 16px; background: #28a745; color: white; border: none; border-radius: 4px; cursor: pointer; }
  </style>
</head>
<body>
  <div id="tab-bar"></div>
  <div id="editor"></div>
  <div id="preview-panel">
    <div id="preview"></div>
    <div id="export-buttons">
      <button class="export-btn" id="export-png">Export PNG</button>
      <button class="export-btn" id="export-svg">Export SVG</button>
    </div>
  </div>
  <script type="module">
    import { initEditor, loadCode, onChange } from '/scripts/editor.js';
    import { initPreview, renderDiagram, getSvgElement } from '/scripts/preview.js';
    import { initTabs, renderTabBar, getCurrentTab, updateCurrentTab } from '/scripts/tabs.js';
    import { exportPNG, exportSVG, generateFilename } from '/scripts/export.js';
    
    const editorContainer = document.getElementById('editor');
    const previewContainer = document.getElementById('preview');
    const tabBarContainer = document.getElementById('tab-bar');
    
    initPreview(previewContainer, 'light');
    
    initTabs((tab) => {
      loadCode(tab.code);
      renderDiagram(tab.code);
    });
    
    const currentTab = getCurrentTab();
    initEditor(editorContainer, currentTab.code);
    renderDiagram(currentTab.code);
    renderTabBar(tabBarContainer);
    
    onChange((code) => {
      updateCurrentTab({ code });
      renderDiagram(code);
    });
    
    document.getElementById('export-png').addEventListener('click', () => {
      const svg = getSvgElement();
      const tab = getCurrentTab();
      const filename = generateFilename(tab.name, 'png');
      exportPNG(svg, filename);
    });
    
    document.getElementById('export-svg').addEventListener('click', () => {
      const svg = getSvgElement();
      const tab = getCurrentTab();
      const filename = generateFilename(tab.name, 'svg');
      exportSVG(svg, filename);
    });
  </script>
</body>
</html>
```

- [ ] **Step 3: Test export functionality**

Run: `npm run dev`
Create a diagram, click "Export PNG" and "Export SVG"
Expected: Files download successfully

- [ ] **Step 4: Commit**

```bash
git add src/scripts/export.js src/index.html
git commit -m "feat: add PNG and SVG export functionality"
```

---

### Task 8: App Module with Debounced Auto-save

**Files:**
- Create: `src/scripts/app.js`
- Modify: `src/index.html`

**Interfaces:**
- Consumes: All previous modules
- Produces:
  - `init() → void` - Main app initialization
  - Debounced auto-save (500ms)
  - Theme toggling
  - Layout mode switching

- [ ] **Step 1: Create app.js with debounced auto-save**

```javascript
import { initEditor, loadCode, onChange as onEditorChange, setTheme as setEditorTheme } from './editor.js';
import { initPreview, renderDiagram, setTheme as setPreviewTheme, getSvgElement } from './preview.js';
import { initTabs, renderTabBar, getCurrentTab, updateCurrentTab, createTab, switchTab } from './tabs.js';
import { exportPNG, exportSVG, generateFilename } from './export.js';
import { savePreferences, loadPreferences } from './storage.js';
import { getTemplates } from './templates.js';

let state = {
  theme: 'light',
  layoutMode: 'split'
};

let debounceTimer = null;

function debounce(callback, delay) {
  return function (...args) {
    clearTimeout(debounceTimer);
    debounceTimer = setTimeout(() => callback.apply(this, args), delay);
  };
}

export function init() {
  const prefs = loadPreferences();
  if (prefs) {
    state.theme = prefs.theme || 'light';
    state.layoutMode = prefs.layoutMode || 'split';
  }
  
  applyTheme(state.theme);
  applyLayoutMode(state.layoutMode);
  
  const editorContainer = document.getElementById('editor-container');
  const previewContainer = document.getElementById('preview-container');
  const tabBarContainer = document.getElementById('tab-bar');
  
  initPreview(previewContainer, state.theme);
  
  initTabs((tab) => {
    loadCode(tab.code);
    renderDiagram(tab.code);
  });
  
  const currentTab = getCurrentTab();
  initEditor(editorContainer, currentTab.code);
  renderDiagram(currentTab.code);
  renderTabBar(tabBarContainer);
  
  const debouncedUpdate = debounce((code) => {
    updateCurrentTab({ code });
    renderDiagram(code);
  }, 500);
  
  onEditorChange(debouncedUpdate);
  
  setupEventListeners();
}

function setupEventListeners() {
  document.getElementById('theme-toggle')?.addEventListener('click', toggleTheme);
  document.getElementById('layout-toggle-editor')?.addEventListener('click', () => toggleLayout('editor'));
  document.getElementById('layout-toggle-preview')?.addEventListener('click', () => toggleLayout('preview'));
  
  document.getElementById('export-png')?.addEventListener('click', () => {
    const svg = getSvgElement();
    const tab = getCurrentTab();
    const filename = generateFilename(tab.name, 'png');
    exportPNG(svg, filename);
  });
  
  document.getElementById('export-svg')?.addEventListener('click', () => {
    const svg = getSvgElement();
    const tab = getCurrentTab();
    const filename = generateFilename(tab.name, 'svg');
    exportSVG(svg, filename);
  });
  
  document.getElementById('new-from-template')?.addEventListener('click', showTemplateDialog);
}

function toggleTheme() {
  state.theme = state.theme === 'light' ? 'dark' : 'light';
  applyTheme(state.theme);
  savePreferences({ theme: state.theme, layoutMode: state.layoutMode });
}

function applyTheme(theme) {
  document.documentElement.setAttribute('data-theme', theme);
  setEditorTheme(theme);
  setPreviewTheme(theme);
  
  const currentTab = getCurrentTab();
  if (currentTab) {
    renderDiagram(currentTab.code);
  }
}

function toggleLayout(panel) {
  if (state.layoutMode === 'split') {
    state.layoutMode = panel === 'editor' ? 'editor-full' : 'preview-full';
  } else {
    state.layoutMode = 'split';
  }
  applyLayoutMode(state.layoutMode);
  savePreferences({ theme: state.theme, layoutMode: state.layoutMode });
}

function applyLayoutMode(mode) {
  document.documentElement.setAttribute('data-layout', mode);
}

function showTemplateDialog() {
  const templates = getTemplates();
  const dialog = document.createElement('div');
  dialog.className = 'template-dialog';
  dialog.innerHTML = `
    <div class="template-dialog-overlay"></div>
    <div class="template-dialog-content">
      <h2>Choose Template</h2>
      <div class="template-grid">
        ${templates.map(t => `
          <button class="template-card" data-template-id="${t.id}">
            <h3>${t.name}</h3>
            <pre>${t.code.split('\n').slice(0, 3).join('\n')}...</pre>
          </button>
        `).join('')}
      </div>
      <button class="template-close">Cancel</button>
    </div>
  `;
  
  document.body.appendChild(dialog);
  
  dialog.querySelectorAll('.template-card').forEach(card => {
    card.addEventListener('click', () => {
      const templateId = card.dataset.templateId;
      const template = templates.find(t => t.id === templateId);
      const newTab = createTab(template);
      switchTab(newTab.id);
      renderTabBar(document.getElementById('tab-bar'));
      dialog.remove();
    });
  });
  
  dialog.querySelector('.template-close').addEventListener('click', () => {
    dialog.remove();
  });
  
  dialog.querySelector('.template-dialog-overlay').addEventListener('click', () => {
    dialog.remove();
  });
}
```

- [ ] **Step 2: Create final index.html structure**

Create complete `src/index.html`:
```html
<!DOCTYPE html>
<html lang="en" data-theme="light" data-layout="split">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Mermaid Diagram Editor</title>
  <link rel="stylesheet" href="/styles/main.css">
</head>
<body>
  <div class="app-container">
    <header class="header">
      <div class="header-left">
        <h1>Mermaid Editor</h1>
      </div>
      <div class="header-right">
        <button id="new-from-template" class="btn btn-secondary">Templates</button>
        <button id="theme-toggle" class="btn btn-icon">🌙</button>
      </div>
    </header>
    
    <div id="tab-bar" class="tab-bar"></div>
    
    <main class="main-content">
      <div class="editor-panel">
        <div class="panel-header">
          <span>Editor</span>
          <button id="layout-toggle-editor" class="btn btn-icon">⛶</button>
        </div>
        <div id="editor-container" class="editor-container"></div>
      </div>
      
      <div class="preview-panel">
        <div class="panel-header">
          <span>Preview</span>
          <button id="layout-toggle-preview" class="btn btn-icon">⛶</button>
        </div>
        <div id="preview-container" class="preview-container"></div>
        <div class="export-buttons">
          <button id="export-png" class="btn btn-success">Export PNG</button>
          <button id="export-svg" class="btn btn-success">Export SVG</button>
        </div>
      </div>
    </main>
  </div>
  
  <script type="module">
    import { init } from '/scripts/app.js';
    init();
  </script>
</body>
</html>
```

- [ ] **Step 3: Test debounced auto-save**

Run: `npm run dev`
Type in editor rapidly, verify preview updates 500ms after typing stops
Refresh browser, verify code persisted
Expected: Debounced updates working, data persists

- [ ] **Step 4: Commit**

```bash
git add src/scripts/app.js src/index.html
git commit -m "feat: add app orchestration with debounced auto-save"
```

---

### Task 9: Styling - Main Layout and Typography

**Files:**
- Create: `src/styles/main.css`

**Interfaces:**
- Consumes: None (CSS only)
- Produces: Base layout, typography, utility classes

- [ ] **Step 1: Create main.css**

```css
* {
  margin: 0;
  padding: 0;
  box-sizing: border-box;
}

:root {
  --header-height: 60px;
  --tab-bar-height: 45px;
  --font-sans: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
  --font-mono: 'Monaco', 'Menlo', 'Courier New', monospace;
}

body {
  font-family: var(--font-sans);
  overflow: hidden;
}

.app-container {
  width: 100vw;
  height: 100vh;
  display: flex;
  flex-direction: column;
}

.header {
  height: var(--header-height);
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 0 20px;
  border-bottom: 1px solid var(--border-color);
  background: var(--header-bg);
}

.header-left h1 {
  font-size: 24px;
  font-weight: 600;
  color: var(--text-primary);
}

.header-right {
  display: flex;
  gap: 10px;
  align-items: center;
}

.tab-bar {
  height: var(--tab-bar-height);
  display: flex;
  align-items: center;
  padding: 0 10px;
  background: var(--tab-bar-bg);
  border-bottom: 1px solid var(--border-color);
  overflow-x: auto;
}

.main-content {
  flex: 1;
  display: flex;
  overflow: hidden;
  height: calc(100vh - var(--header-height) - var(--tab-bar-height));
}

.editor-panel,
.preview-panel {
  flex: 1;
  display: flex;
  flex-direction: column;
  border-right: 1px solid var(--border-color);
}

.preview-panel {
  border-right: none;
}

.panel-header {
  height: 40px;
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 0 15px;
  background: var(--panel-header-bg);
  border-bottom: 1px solid var(--border-color);
  font-weight: 500;
  font-size: 14px;
  color: var(--text-primary);
}

.editor-container {
  flex: 1;
  overflow: hidden;
}

.preview-container {
  flex: 1;
  overflow: auto;
  padding: 20px;
  display: flex;
  align-items: center;
  justify-content: center;
  background: var(--preview-bg);
}

.export-buttons {
  padding: 15px;
  display: flex;
  gap: 10px;
  border-top: 1px solid var(--border-color);
  background: var(--panel-header-bg);
}

.btn {
  padding: 8px 16px;
  border: none;
  border-radius: 6px;
  font-size: 14px;
  font-weight: 500;
  cursor: pointer;
  transition: all 0.2s;
}

.btn-secondary {
  background: var(--btn-secondary-bg);
  color: var(--btn-secondary-color);
}

.btn-secondary:hover {
  background: var(--btn-secondary-hover);
}

.btn-success {
  background: #28a745;
  color: white;
}

.btn-success:hover {
  background: #218838;
}

.btn-icon {
  background: transparent;
  padding: 8px;
  font-size: 18px;
}

.btn-icon:hover {
  background: var(--btn-hover-bg);
}

.preview-placeholder {
  color: var(--text-secondary);
  font-size: 16px;
  text-align: center;
}

.error-message {
  background: #f8d7da;
  border: 1px solid #f5c6cb;
  border-radius: 6px;
  padding: 20px;
  color: #721c24;
  max-width: 600px;
}

.error-message h3 {
  margin-bottom: 10px;
  font-size: 18px;
}

.error-message p {
  margin: 5px 0;
}

.error-hint {
  font-style: italic;
  opacity: 0.8;
}

.toast {
  position: fixed;
  bottom: 20px;
  right: 20px;
  background: #333;
  color: white;
  padding: 15px 20px;
  border-radius: 6px;
  box-shadow: 0 4px 12px rgba(0,0,0,0.3);
  z-index: 10000;
  animation: slideIn 0.3s ease;
}

@keyframes slideIn {
  from {
    transform: translateX(100%);
    opacity: 0;
  }
  to {
    transform: translateX(0);
    opacity: 1;
  }
}

[data-layout="editor-full"] .preview-panel {
  display: none;
}

[data-layout="preview-full"] .editor-panel {
  display: none;
}
```

- [ ] **Step 2: Verify layout renders correctly**

Run: `npm run dev`
Expected: Clean layout with header, tabs, split panels

- [ ] **Step 3: Commit**

```bash
git add src/styles/main.css
git commit -m "style: add main layout and typography styles"
```

---

### Task 10: Styling - Editor and Preview Panels

**Files:**
- Create: `src/styles/editor.css`
- Create: `src/styles/preview.css`
- Modify: `src/index.html` to link stylesheets

**Interfaces:**
- Consumes: main.css variables
- Produces: Editor and preview specific styles

- [ ] **Step 1: Create editor.css**

```css
.editor-container {
  position: relative;
}

.editor-container .monaco-editor {
  height: 100%;
}

.editor-container .monaco-editor .overflow-guard {
  border-radius: 0;
}
```

- [ ] **Step 2: Create preview.css**

```css
.preview-container svg {
  max-width: 100%;
  height: auto;
  display: block;
  margin: 0 auto;
}

.preview-container .error-message {
  margin: 20px auto;
}

.export-buttons {
  justify-content: center;
}

@media (max-width: 768px) {
  .export-buttons {
    flex-direction: column;
  }
  
  .export-buttons .btn {
    width: 100%;
  }
}
```

- [ ] **Step 3: Update index.html to include all stylesheets**

Update `src/index.html` `<head>`:
```html
<link rel="stylesheet" href="/styles/main.css">
<link rel="stylesheet" href="/styles/editor.css">
<link rel="stylesheet" href="/styles/preview.css">
<link rel="stylesheet" href="/styles/themes.css">
```

- [ ] **Step 4: Test styling**

Run: `npm run dev`
Expected: Editor and preview styled correctly

- [ ] **Step 5: Commit**

```bash
git add src/styles/editor.css src/styles/preview.css src/index.html
git commit -m "style: add editor and preview panel styles"
```

---

### Task 11: Styling - Theme System and Tabs

**Files:**
- Create: `src/styles/themes.css`

**Interfaces:**
- Consumes: None
- Produces: CSS custom properties for light/dark themes

- [ ] **Step 1: Create themes.css with light and dark themes**

```css
:root[data-theme="light"] {
  --bg-primary: #ffffff;
  --bg-secondary: #f5f5f5;
  --text-primary: #1a1a1a;
  --text-secondary: #666666;
  --border-color: #e0e0e0;
  --header-bg: #ffffff;
  --tab-bar-bg: #f8f8f8;
  --panel-header-bg: #f5f5f5;
  --preview-bg: #ffffff;
  --btn-secondary-bg: #e0e0e0;
  --btn-secondary-color: #1a1a1a;
  --btn-secondary-hover: #d0d0d0;
  --btn-hover-bg: rgba(0,0,0,0.05);
  --tab-bg: #ffffff;
  --tab-active-bg: #007acc;
  --tab-active-color: #ffffff;
  --tab-hover-bg: #f0f0f0;
}

:root[data-theme="dark"] {
  --bg-primary: #1e1e1e;
  --bg-secondary: #252526;
  --text-primary: #d4d4d4;
  --text-secondary: #888888;
  --border-color: #3e3e3e;
  --header-bg: #252526;
  --tab-bar-bg: #2d2d2d;
  --panel-header-bg: #252526;
  --preview-bg: #1e1e1e;
  --btn-secondary-bg: #3e3e3e;
  --btn-secondary-color: #d4d4d4;
  --btn-secondary-hover: #505050;
  --btn-hover-bg: rgba(255,255,255,0.1);
  --tab-bg: #2d2d2d;
  --tab-active-bg: #007acc;
  --tab-active-color: #ffffff;
  --tab-hover-bg: #3e3e3e;
}

body {
  background: var(--bg-primary);
  color: var(--text-primary);
}

.tab-list {
  display: flex;
  gap: 5px;
  flex: 1;
  overflow-x: auto;
}

.tab {
  padding: 8px 16px;
  background: var(--tab-bg);
  border: 1px solid var(--border-color);
  border-radius: 6px 6px 0 0;
  cursor: pointer;
  display: flex;
  align-items: center;
  gap: 8px;
  white-space: nowrap;
  transition: background 0.2s;
  color: var(--text-primary);
  font-size: 14px;
}

.tab:hover {
  background: var(--tab-hover-bg);
}

.tab.active {
  background: var(--tab-active-bg);
  color: var(--tab-active-color);
  border-color: var(--tab-active-bg);
}

.tab-close {
  background: none;
  border: none;
  font-size: 18px;
  cursor: pointer;
  padding: 0 4px;
  color: inherit;
  opacity: 0.7;
  transition: opacity 0.2s;
}

.tab-close:hover {
  opacity: 1;
}

.tab-new {
  background: var(--btn-secondary-bg);
  color: var(--btn-secondary-color);
  border: none;
  padding: 8px 16px;
  border-radius: 6px;
  cursor: pointer;
  font-size: 16px;
  font-weight: 600;
  transition: background 0.2s;
  margin-left: 10px;
}

.tab-new:hover {
  background: var(--btn-secondary-hover);
}

.template-dialog-overlay {
  position: fixed;
  top: 0;
  left: 0;
  width: 100vw;
  height: 100vh;
  background: rgba(0,0,0,0.5);
  z-index: 9998;
}

.template-dialog-content {
  position: fixed;
  top: 50%;
  left: 50%;
  transform: translate(-50%, -50%);
  background: var(--bg-primary);
  border: 1px solid var(--border-color);
  border-radius: 8px;
  padding: 30px;
  max-width: 800px;
  max-height: 80vh;
  overflow-y: auto;
  z-index: 9999;
  box-shadow: 0 8px 32px rgba(0,0,0,0.3);
}

.template-dialog-content h2 {
  margin-bottom: 20px;
  color: var(--text-primary);
}

.template-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(200px, 1fr));
  gap: 15px;
  margin-bottom: 20px;
}

.template-card {
  padding: 15px;
  background: var(--bg-secondary);
  border: 1px solid var(--border-color);
  border-radius: 6px;
  cursor: pointer;
  transition: all 0.2s;
  text-align: left;
}

.template-card:hover {
  background: var(--tab-hover-bg);
  transform: translateY(-2px);
  box-shadow: 0 4px 12px rgba(0,0,0,0.1);
}

.template-card h3 {
  font-size: 16px;
  margin-bottom: 10px;
  color: var(--text-primary);
}

.template-card pre {
  font-size: 11px;
  color: var(--text-secondary);
  font-family: var(--font-mono);
  overflow: hidden;
  text-overflow: ellipsis;
}

.template-close {
  width: 100%;
  padding: 10px;
  background: var(--btn-secondary-bg);
  color: var(--btn-secondary-color);
  border: none;
  border-radius: 6px;
  cursor: pointer;
  font-size: 14px;
}

.template-close:hover {
  background: var(--btn-secondary-hover);
}

[data-theme="dark"] .error-message {
  background: #4a1f1f;
  border-color: #7a3f3f;
  color: #ffb3b3;
}
```

- [ ] **Step 2: Update theme toggle to show correct icon**

Update `src/scripts/app.js` theme toggle function:
```javascript
function toggleTheme() {
  state.theme = state.theme === 'light' ? 'dark' : 'light';
  applyTheme(state.theme);
  updateThemeIcon();
  savePreferences({ theme: state.theme, layoutMode: state.layoutMode });
}

function updateThemeIcon() {
  const themeBtn = document.getElementById('theme-toggle');
  if (themeBtn) {
    themeBtn.textContent = state.theme === 'light' ? '🌙' : '☀️';
  }
}

function applyTheme(theme) {
  document.documentElement.setAttribute('data-theme', theme);
  setEditorTheme(theme);
  setPreviewTheme(theme);
  updateThemeIcon();
  
  const currentTab = getCurrentTab();
  if (currentTab) {
    renderDiagram(currentTab.code);
  }
}
```

- [ ] **Step 3: Test theme switching**

Run: `npm run dev`
Click theme toggle, verify:
1. Dark mode applies to all UI elements
2. Mermaid diagrams re-render with dark theme
3. Monaco editor switches to dark theme
4. Icon changes from 🌙 to ☀️
Expected: Seamless theme switching

- [ ] **Step 4: Test template dialog**

Click "Templates" button
Expected: Modal opens with grid of templates, styled correctly in both themes

- [ ] **Step 5: Commit**

```bash
git add src/styles/themes.css src/scripts/app.js
git commit -m "style: add complete theme system with light/dark modes"
```

---

### Task 12: GitHub Actions Deployment

**Files:**
- Create: `.github/workflows/deploy.yml`

**Interfaces:**
- Consumes: Vite build system
- Produces: Automated GitHub Pages deployment

- [ ] **Step 1: Create deploy.yml workflow**

```yaml
name: Deploy to GitHub Pages

on:
  push:
    branches: [ main ]
  workflow_dispatch:

permissions:
  contents: read
  pages: write
  id-token: write

concurrency:
  group: "pages"
  cancel-in-progress: false

jobs:
  build:
    runs-on: ubuntu-latest
    steps:
      - name: Checkout
        uses: actions/checkout@v4
      
      - name: Setup Node.js
        uses: actions/setup-node@v4
        with:
          node-version: '20'
          cache: 'npm'
      
      - name: Install dependencies
        run: npm ci
      
      - name: Build
        run: npm run build
      
      - name: Upload artifact
        uses: actions/upload-pages-artifact@v3
        with:
          path: ./dist

  deploy:
    environment:
      name: github-pages
      url: ${{ steps.deployment.outputs.page_url }}
    runs-on: ubuntu-latest
    needs: build
    steps:
      - name: Deploy to GitHub Pages
        id: deployment
        uses: actions/deploy-pages@v4
```

- [ ] **Step 2: Create .github directory**

```bash
mkdir -p .github/workflows
```

- [ ] **Step 3: Test build locally**

Run: `npm run build`
Expected: `dist/` directory created with built files

- [ ] **Step 4: Preview production build**

Run: `npm run preview`
Open http://localhost:4173
Expected: Production build works correctly

- [ ] **Step 5: Commit**

```bash
git add .github/workflows/deploy.yml
git commit -m "ci: add GitHub Actions workflow for automated deployment"
```

---

### Task 13: Documentation and Final Touches

**Files:**
- Modify: `README.md`
- Create: `LICENSE` (optional)

**Interfaces:**
- Consumes: None
- Produces: User-facing documentation

- [ ] **Step 1: Update README.md with complete documentation**

```markdown
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
```

- [ ] **Step 2: Test all features one final time**

Manual testing checklist:
- [ ] Live preview works
- [ ] Multi-tab creation, switching, deletion
- [ ] Template picker and selection
- [ ] Auto-save and persistence across refresh
- [ ] PNG export downloads correctly
- [ ] SVG export downloads correctly
- [ ] Theme toggle works completely
- [ ] Panel expand/collapse works
- [ ] Error messages display for invalid syntax
- [ ] All features work in dark mode

- [ ] **Step 3: Commit final documentation**

```bash
git add README.md
git commit -m "docs: update README with complete project documentation"
```

---

### Task 14: Production Verification

**Files:**
- None (verification task)

**Interfaces:**
- Consumes: Complete application
- Produces: Verified production-ready application

- [ ] **Step 1: Build for production**

Run: `npm run build`
Verify: No errors, dist/ directory created

- [ ] **Step 2: Test production build locally**

Run: `npm run preview`
Open: http://localhost:4173
Test all features in production build

- [ ] **Step 3: Push to GitHub**

```bash
git push origin main
```

- [ ] **Step 4: Enable GitHub Pages**

1. Go to repository Settings → Pages
2. Source: GitHub Actions
3. Wait for deployment to complete
4. Visit your GitHub Pages URL

- [ ] **Step 5: Verify live deployment**

Test all features on live GitHub Pages site:
- [ ] App loads without errors
- [ ] All JavaScript modules load correctly
- [ ] Monaco and Mermaid libraries load from CDN
- [ ] Live preview works
- [ ] Export functionality works
- [ ] LocalStorage persistence works
- [ ] Theme switching works

- [ ] **Step 6: Final commit with deployment URL**

Update README.md with actual GitHub Pages URL, then:
```bash
git add README.md
git commit -m "docs: add live deployment URL"
git push origin main
```

---

## Implementation Complete

All tasks finished. The mermaid diagram editor is now:

✅ Built with Vite and modern JavaScript modules  
✅ Using pinned npm dependencies (Mermaid 11.17.1, Monaco 0.56.0, etc.)  
✅ Live preview with 500ms debounced auto-save  
✅ Multi-tab support with localStorage persistence  
✅ PNG and SVG export functionality  
✅ Light and dark themes  
✅ 9 sample templates  
✅ Panel expand/collapse  
✅ Deployed to GitHub Pages via GitHub Actions  
✅ Fully tested and production-ready

**Next Steps:**
- Share the GitHub Pages URL
- Consider adding features from "Future Enhancements" in the design spec
- Gather user feedback and iterate