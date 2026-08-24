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
