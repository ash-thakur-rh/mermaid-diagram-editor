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
