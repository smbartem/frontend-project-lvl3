/* eslint-disable no-undef */
/* eslint-disable no-param-reassign */
import onChange, { target } from 'on-change';

const generateFeeds = (feeds, insertPlace) => {
  const title = document.createElement('h2');
  title.textContent = 'Feeds';
  const list = document.createElement('ul');
  list.classList.add('list-group', 'mb-5');
  console.log(feeds)/*.forEach((el) => {
    const point = document.createElement('li');
    list.classList.add('list-group-item');
    const titleFeed = document.createElement('h3');
    titleFeed.textContent = el.titleFeed;
    const descriptionFeed = document.createElement('p');
    descriptionFeed.textContent = el.descriptionFeed;
    point.append(titleFeed);
    point.append(descriptionFeed);
    list.append(point);
  });
  insertPlace.append(title);
  insertPlace.append(list);*/
};

export default (state, docElements) => {
  const watchedState = onChange(state, (path, value) => {
    if (path === 'validationErr') {
      if (value !== null) {
        console.log('invalid');
        docElements.input.classList.add('is-invalid');
        docElements.feedback.classList.add('text-danger');
        docElements.feedback.textContent = value;
      }
      if (value === null) {
        console.log('valid');
        docElements.input.classList.remove('is-invalid');
        docElements.feedback.classList.remove('text-danger');
        docElements.feedback.textContent = value;
      }
    }
    if (path === 'state') {
      if (value === 'success') {
        for (eee in state.data.feeds) {
          console.log(eee);
        }
        //generateFeeds(aaa, docElements.feeds);
      }
    }
  });
  return watchedState;
};
