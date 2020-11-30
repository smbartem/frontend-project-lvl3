/* eslint-disable no-undef */
import axios from 'axios';
import checkFormValidity from './checkFormValidity.js';
import watcher from './watcher.js';
import initLanguage from './locales/initLang.js';

const docElements = {
  title: document.querySelector('h1'),
  lead: document.querySelector('.lead'),
  exampleLink: document.querySelector('.text-muted'),
  form: document.querySelector('.rss-form'),
  feedback: document.querySelector('.feedback'),
  submitButton: document.querySelector('.btn'),
  feeds: document.querySelector('.feeds'),
  input: document.querySelector('.form-control'),
  posts: document.querySelector('.posts'),
  en: document.querySelector('.en'),
  ru: document.querySelector('.ru'),
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
    requestErrors: null,
    validationErr: null,
    links: [],
    data: {
      feeds: {},
      posts: {},
    },
  };
  initLanguage('en', docElements);
  const watchedState = watcher(state, docElements);
  const makeHttpRequests = (newLink, links) => {
    axios.get(`https://api.allorigins.win/get?url=${encodeURIComponent(newLink)}`)
      .then((result) => {
        parseRSS(result.data.contents);
      })
      .then(() => {
        watchedState.links.push(newLink);
        axios.all(links.map((url) => axios.get(`https://api.allorigins.win/get?url=${encodeURIComponent(url)}`)))
          .then((results) => {
            results.forEach((elem, index) => {
              const content = parseRSS(elem.data.contents);
              watchedState.data.feeds[index] = content.feed;
              watchedState.data.posts[index] = content.posts;
            });
            watchedState.state = 'success';
          });
      })
      .catch((error) => {
        watchedState.requestErrors = error;
        watchedState.state = 'unsuccess';
      });
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
      watchedState.validationErr = null;
      watchedState.state = 'sending';
      makeHttpRequests(docElements.input.value, watchedState.links);
    }
  });
  docElements.ru.addEventListener('click', (e) => {
    e.preventDefault();
    initLanguage('ru', docElements);
    docElements.ru.classList.add('text-secondary');
    docElements.ru.classList.remove('text-white');
    docElements.en.classList.remove('text-secondary');
    docElements.en.classList.add('text-white');
  });
  docElements.en.addEventListener('click', (e) => {
    e.preventDefault();
    initLanguage('en', docElements);
    docElements.en.classList.add('text-secondary');
    docElements.en.classList.remove('text-white');
    docElements.ru.classList.remove('text-secondary');
    docElements.ru.classList.add('text-white');
  });
};

export default app;
