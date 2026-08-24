// Test script for storage module
import { saveTabs, loadTabs, savePreferences, loadPreferences } from './scripts/storage.js';

console.log('=== Testing Storage Module ===');

// Test 1: Save and load tabs
console.log('\nTest 1: Save and load tabs');
const testTab = {
  id: '1',
  name: 'Test',
  code: 'graph TD\nA-->B',
  createdAt: Date.now(),
  updatedAt: Date.now()
};

saveTabs([testTab]);
const loadedTabs = loadTabs();
console.log('Saved tab:', testTab);
console.log('Loaded tabs:', loadedTabs);
console.log('Test 1 PASSED:', JSON.stringify(loadedTabs[0]) === JSON.stringify(testTab));

// Test 2: Save and load preferences
console.log('\nTest 2: Save and load preferences');
const testPreferences = {
  theme: 'dark',
  layoutMode: 'split'
};

savePreferences(testPreferences);
const loadedPreferences = loadPreferences();
console.log('Saved preferences:', testPreferences);
console.log('Loaded preferences:', loadedPreferences);
console.log('Test 2 PASSED:', JSON.stringify(loadedPreferences) === JSON.stringify(testPreferences));

// Test 3: Load non-existent tabs (should return null)
console.log('\nTest 3: Load non-existent tabs');
localStorage.removeItem('mermaid-editor-tabs');
const emptyTabs = loadTabs();
console.log('Empty tabs result:', emptyTabs);
console.log('Test 3 PASSED:', emptyTabs === null);

// Test 4: Load non-existent preferences (should return null)
console.log('\nTest 4: Load non-existent preferences');
localStorage.removeItem('mermaid-editor-preferences');
const emptyPreferences = loadPreferences();
console.log('Empty preferences result:', emptyPreferences);
console.log('Test 4 PASSED:', emptyPreferences === null);

console.log('\n=== All Tests Completed ===');