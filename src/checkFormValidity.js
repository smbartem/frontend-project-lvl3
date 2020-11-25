import * as yup from 'yup';

export default (url, urlList) => {
  const schema = yup.string()
    .url()
    .required()
    .notOneOf(urlList, 'Rss already exists');
  try {
    schema.validateSync(url);
    return false;
  } catch (error) {
    return error.message;
  }
};
