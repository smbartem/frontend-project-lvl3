import i18next from 'i18next';
import resources from './locales.js';

const initialRender = (language, docElements) => i18next.init({
  lng: `${language}`,
  debug: true,
  resources,
}).then(() => {
  docElements.title.textContent = i18next.t('title');
  docElements.lead.textContent = i18next.t('lead');
  docElements.input.placeholder = i18next.t('inputPlaceholder');
  docElements.submitButton.textContent = i18next.t('button');
  docElements.exampleLink.textContent = i18next.t('exampleLink');
  docElements.modalWindowCloseButton.textContent = i18next.t('сloseButton');
  docElements.modalWindowOpenButton.textContent = i18next.t('openButton');
});

export default initialRender;
