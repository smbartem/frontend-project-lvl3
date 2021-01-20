import i18next from 'i18next';
import resources from './locales.js';

const initialRender = (language) => i18next.init({
  lng: `${language}`,
  debug: true,
  resources,
});

export default initialRender;
