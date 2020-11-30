/* eslint-disable no-undef */
/* eslint-disable no-param-reassign */
import onChange from 'on-change';
import _ from 'lodash';
import i18next from 'i18next';

const generateFeeds = (feeds, insertPlace) => {
  const title = document.createElement('h2');
  title.textContent = i18next.t('feeds');
  const list = document.createElement('ul');
  list.classList.add('list-group', 'mb-5');
  _.values(feeds).forEach((el) => {
    const point = document.createElement('li');
    point.classList.add('list-group-item');
    const titleFeed = document.createElement('h3');
    titleFeed.textContent = el.titleFeed;
    const descriptionFeed = document.createElement('p');
    descriptionFeed.textContent = el.descriptionFeed;
    point.append(titleFeed);
    point.append(descriptionFeed);
    list.prepend(point);
  });
  insertPlace.innerHTML = '';
  insertPlace.append(title);
  insertPlace.append(list);
};

const generatePosts = (posts, insertPlace) => {
  const title = document.createElement('h2');
  title.textContent = i18next.t('posts');
  const list = document.createElement('ul');
  list.classList.add('list-group');
  _.values(posts).reverse().flat(Infinity).forEach((el) => {
    const point = document.createElement('li');
    point.classList.add('list-group-item');
    const post = document.createElement('a');
    post.textContent = el.titlePost;
    post.href = el.linkPost;
    point.append(post);
    list.append(point);
  });
  insertPlace.innerHTML = '';
  insertPlace.append(title);
  insertPlace.append(list);
};

export default (state, docElements) => {
  const watchedState = onChange(state, (path, value) => {
    if (path === 'validationErr') {
      if (value !== null) {
        docElements.input.classList.add('is-invalid');
        docElements.feedback.classList.add('text-danger');
        docElements.feedback.textContent = value;
      }
      if (value === null) {
        docElements.input.classList.remove('is-invalid');
        docElements.feedback.classList.remove('text-danger');
        docElements.feedback.textContent = value;
      }
    }
    if (path === 'state') {
      if (value === 'success') {
        generateFeeds(state.data.feeds, docElements.feeds);
        generatePosts(state.data.posts, docElements.posts);
        docElements.feedback.classList.add('text-success');
        docElements.feedback.classList.remove('text-danger');
        docElements.feedback.textContent = i18next.t('succeed');
        docElements.input.value = '';
        docElements.input.focus();
        value = 'editing';
      }
      if (value === 'unsuccess') {
        docElements.feedback.classList.add('text-danger');
        docElements.feedback.textContent = i18next.t('downloadError');
      }
    }
  });
  return watchedState;
};
