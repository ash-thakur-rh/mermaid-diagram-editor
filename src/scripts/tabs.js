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
