import * as yup from 'yup';

export default (url, urlList) => {
  const schema = yup.string()
    .url('notURL')
    .required()
    .notOneOf(urlList, 'alreadyExists');
  try {
    schema.validateSync(url);
    return null;
  } catch (error) {
    return error.message;
  }
};
