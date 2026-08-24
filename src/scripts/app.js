import { initEditor, loadCode, onChange as onEditorChange, setTheme as setEditorTheme } from './editor.js';
import { initPreview, renderDiagram, setTheme as setPreviewTheme, getSvgElement } from './preview.js';
import { initTabs, renderTabBar, getCurrentTab, updateCurrentTab, createTab, switchTab } from './tabs.js';
import { exportPNG, exportSVG, generateFilename, generatePreview } from './export.js';
import { savePreferences, loadPreferences } from './storage.js';
import { getTemplates } from './templates.js';

function getSvgDimensions(svgElement) {
  let width = null;
  let height = null;

  // Priority 1: viewBox (gives true diagram dimensions regardless of CSS)
  const viewBox = svgElement.getAttribute('viewBox');
  if (viewBox) {
    const parts = viewBox.split(/\s+/);
    if (parts.length === 4) {
      width = parseFloat(parts[2]);
      height = parseFloat(parts[3]);
    }
  }

  // Priority 2: Explicit width/height attributes
  if (!width || !height) {
    const attrWidth = svgElement.getAttribute('width');
    const attrHeight = svgElement.getAttribute('height');

    if (attrWidth) width = parseFloat(attrWidth);
    if (attrHeight) height = parseFloat(attrHeight);
  }

  // Priority 3: Temporarily remove CSS constraints and measure natural size
  if (!width || !height) {
    const originalMaxWidth = svgElement.style.maxWidth;
    const originalWidth = svgElement.style.width;

    svgElement.style.maxWidth = 'none';
    svgElement.style.width = 'auto';

    const rect = svgElement.getBoundingClientRect();
    width = width || rect.width;
    height = height || rect.height;

    // Restore original styles
    svgElement.style.maxWidth = originalMaxWidth;
    svgElement.style.width = originalWidth;
  }

  // Final fallback: getBBox
  if (!width || !height) {
    try {
      const bbox = svgElement.getBBox();
      width = width || bbox.width;
      height = height || bbox.height;
    } catch (e) {
      console.warn('[getSvgDimensions] getBBox failed:', e);
    }
  }

  return { width, height };
}

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
    showExportDialog('png');
  });

  document.getElementById('export-svg')?.addEventListener('click', () => {
    showExportDialog('svg');
  });

  document.getElementById('new-from-template')?.addEventListener('click', showTemplateDialog);
}

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

let currentExportFormat = 'png';
let previewDebounceTimer = null;

function showExportDialog(format) {
  currentExportFormat = format;
  const dialog = document.getElementById('export-dialog');
  const formatDisplay = document.getElementById('export-format-display');
  const scaleSelect = document.getElementById('export-scale');
  const widthInput = document.getElementById('export-width');
  const heightInput = document.getElementById('export-height');
  const previewContainer = document.getElementById('export-preview-container');

  formatDisplay.textContent = format.toUpperCase();

  // Get current SVG dimensions
  const svg = getSvgElement();
  if (svg) {
    const dims = getSvgDimensions(svg);
    widthInput.placeholder = `Auto (${Math.round(dims.width)}px)`;
    heightInput.placeholder = `Auto (${Math.round(dims.height)}px)`;
  }

  dialog.style.display = 'block';

  // Generate initial preview
  updateExportPreview();

  // Update preview on option change with debouncing for inputs
  const debouncedPreviewUpdate = () => {
    clearTimeout(previewDebounceTimer);
    previewDebounceTimer = setTimeout(updateExportPreview, 300);
  };

  scaleSelect.addEventListener('change', updateExportPreview);
  widthInput.addEventListener('input', debouncedPreviewUpdate);
  heightInput.addEventListener('input', debouncedPreviewUpdate);

  // Handle confirm
  const confirmBtn = document.getElementById('export-confirm');
  const newConfirmBtn = confirmBtn.cloneNode(true);
  confirmBtn.parentNode.replaceChild(newConfirmBtn, confirmBtn);

  newConfirmBtn.addEventListener('click', () => {
    performExport();
    dialog.style.display = 'none';
  });

  // Handle cancel
  const cancelBtn = document.getElementById('export-cancel');
  const newCancelBtn = cancelBtn.cloneNode(true);
  cancelBtn.parentNode.replaceChild(newCancelBtn, cancelBtn);

  newCancelBtn.addEventListener('click', () => {
    dialog.style.display = 'none';
  });

  // Handle overlay click
  const overlay = dialog.querySelector('.export-dialog-overlay');
  const newOverlay = overlay.cloneNode(true);
  overlay.parentNode.replaceChild(newOverlay, overlay);

  newOverlay.addEventListener('click', () => {
    dialog.style.display = 'none';
  });
}

async function updateExportPreview() {
  const svg = getSvgElement();
  if (!svg) {
    const previewContainer = document.getElementById('export-preview-container');
    previewContainer.innerHTML = '<div class="export-preview-error">No diagram to preview</div>';
    return;
  }

  const previewContainer = document.getElementById('export-preview-container');
  const scaleSelect = document.getElementById('export-scale');
  const widthInput = document.getElementById('export-width');
  const heightInput = document.getElementById('export-height');

  const options = {
    scale: parseFloat(scaleSelect.value),
    width: widthInput.value ? parseInt(widthInput.value) : undefined,
    height: heightInput.value ? parseInt(heightInput.value) : undefined
  };

  previewContainer.innerHTML = '<div class="export-preview-loading">Generating preview...</div>';

  try {
    const previewDataUrl = await generatePreview(svg, options);

    if (previewDataUrl) {
      const dims = getSvgDimensions(svg);
      const actualWidth = options.width || dims.width;
      const actualHeight = options.height || dims.height;
      const scaledWidth = Math.round(actualWidth * options.scale);
      const scaledHeight = Math.round(actualHeight * options.scale);

      previewContainer.innerHTML = `
        <img src="${previewDataUrl}" alt="Export Preview" class="export-preview-image" />
        <div class="export-preview-info">
          Original: ${Math.round(actualWidth)} × ${Math.round(actualHeight)}px<br>
          Export (${options.scale}x): ${scaledWidth} × ${scaledHeight}px
        </div>
      `;
    } else {
      previewContainer.innerHTML = '<div class="export-preview-error">Preview generation failed. The diagram may be too complex or large.</div>';
    }
  } catch (error) {
    console.error('Preview update error:', error);
    previewContainer.innerHTML = `<div class="export-preview-error">Error: ${error.message}</div>`;
  }
}

function performExport() {
  const svg = getSvgElement();
  const tab = getCurrentTab();
  const filename = generateFilename(tab.name, currentExportFormat);

  const scaleSelect = document.getElementById('export-scale');
  const widthInput = document.getElementById('export-width');
  const heightInput = document.getElementById('export-height');

  const options = {
    scale: parseFloat(scaleSelect.value),
    width: widthInput.value ? parseInt(widthInput.value) : undefined,
    height: heightInput.value ? parseInt(heightInput.value) : undefined
  };

  if (currentExportFormat === 'png') {
    exportPNG(svg, filename, options);
  } else {
    exportSVG(svg, filename, options);
  }
}
