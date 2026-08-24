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
