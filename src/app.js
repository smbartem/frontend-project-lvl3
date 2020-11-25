/* eslint-disable no-undef */
import axios from 'axios';
import checkFormValidity from './checkFormValidity.js';
import watcher from './watcher.js';

const docElements = {
  form: document.querySelector('.rss-form'),
  feedback: document.querySelector('.feedback'),
  submitButton: document.querySelector('.btn'),
  feeds: document.querySelector('.feeds'),
  input: document.querySelector('.form-control'),
  posts: document.querySelector('.posts'),
};

const parseRSS = (data) => {
  const parser = new DOMParser();
  const rssDataDocument = parser.parseFromString(data, 'text/xml');
  const titleFeed = rssDataDocument.querySelector('title').textContent;
  const descriptionFeed = rssDataDocument.querySelector('description').textContent;
  const feed = { titleFeed, descriptionFeed };
  const items = rssDataDocument.querySelectorAll('item');
  const posts = [...items].map((el) => {
    const titlePost = el.querySelector('title').textContent;
    const linkPost = el.querySelector('link').textContent;
    return { titlePost, linkPost };
  });
  return { feed, posts };
};

const app = () => {
  const state = {
    state: 'editing',
    validationState: 'valid',
    errors: [],
    validationErr: null,
    links: [],
    data: {
      feeds: {},
      posts: {},
    },
  };

  const watchedState = watcher(state, docElements);

  const makeHttpRequests = (links) => {
    axios.all(links.map((url) => axios.get(url)))
      .then((results) => results.forEach((elem, index) => {
        const content = parseRSS(elem.data);
        watchedState.data.feeds[index] = content.feed;
        watchedState.data.posts[index] = content.posts;
      }))
      .catch((error) => console.log(error));
  };

  docElements.form.addEventListener('submit', (e) => {
    e.preventDefault();
    const urlList = watchedState.links.map((el) => el);
    const validationErr = checkFormValidity(docElements.input.value, urlList);
    if (validationErr) {
      watchedState.validationState = 'invalid';
      watchedState.validationErr = validationErr;
    } else {
      watchedState.validationState = 'valid';
      watchedState.links.push(docElements.input.value);
      watchedState.validationErr = null;
      watchedState.state = 'sending';
      makeHttpRequests(watchedState.links);
      watchedState.state = 'success';
    }
  });
};

export default app;
