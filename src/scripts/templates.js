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
