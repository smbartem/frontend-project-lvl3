import i18next from 'i18next';
import resources from './locales.js';

const initTranslation = (language) => i18next.init({
  lng: `${language}`,
  debug: true,
  resources,
});

export default initTranslation;
