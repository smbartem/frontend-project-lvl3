/* eslint-disable no-param-reassign */
import i18next from 'i18next';
import resources from './locales.js';

const initLanguage = (language, docElements) => {
  i18next.init({
    lng: `${language}`,
    debug: true,
    resources,
  }).then(() => {
    docElements.title.textContent = i18next.t('title');
    docElements.lead.textContent = i18next.t('lead');
    docElements.input.placeholder = i18next.t('inputPlaceholder');
    docElements.submitButton.textContent = i18next.t('button');
    docElements.exampleLink.textContent = i18next.t('exampleLink');
  }).catch((err) => {
    console.log('Language loading error');
    throw err;
  });
};

export default initLanguage;
