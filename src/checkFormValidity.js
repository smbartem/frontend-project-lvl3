import * as yup from 'yup';
import i18next from 'i18next';

export default (url, urlList) => {
  const schema = yup.string()
    .url(i18next.t('notURL'))
    .required()
    .notOneOf(urlList, i18next.t('alreadyExists'));
  try {
    schema.validateSync(url);
    return null;
  } catch (error) {
    return error.message;
  }
};
