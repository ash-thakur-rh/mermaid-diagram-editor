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