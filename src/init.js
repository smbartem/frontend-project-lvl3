import axios from 'axios';
import _ from 'lodash';
import checkFormValidity from './checkFormValidity.js';
import watch from './watch.js';
import initTranslation from './locales/initLang.js';
import 'bootstrap';

const parseRSS = (data, id, url) => {
  const parser = new DOMParser();
  const rssDataDocument = parser.parseFromString(data, 'text/xml');
  const parsererror = rssDataDocument.querySelector('parsererror');
  if (parsererror) throw new Error('parsingError');
  const channelTitle = rssDataDocument.querySelector('title').textContent;
  const channelDescription = rssDataDocument.querySelector('description').textContent;
  const channel = {
    channelTitle, channelDescription, url, id,
  };
  const items = [...rssDataDocument.querySelectorAll('item')].map((el) => {
    const itemTitle = el.querySelector('title').textContent;
    const itemLink = el.querySelector('link').textContent;
    const itemDescription = el.querySelector('description').textContent;
    return {
      itemTitle, itemLink, itemDescription, id,
    };
  });
  console.log({ channel, items });
  return { channel, items };
};

const addProxy = (link) => {
  const proxy = 'https://hexlet-allorigins.herokuapp.com/get?disableCache=true&url=';
  const newUrl = new URL(`${proxy}${link}`);
  return newUrl;
};

const downloadContent = (newLink) => axios.get(addProxy(newLink));

const updatePosts = (watchedState, timeout = 5000) => {
  const requests = watchedState.feeds.map((feed) => downloadContent(feed.url)
    .then((result) => {
      const newPosts = parseRSS(result.data.contents, feed.id).items;
      const oldPosts = watchedState.posts;
      const difference = _.differenceWith(newPosts, oldPosts, _.isEqual);
      watchedState.posts = [...difference, ...oldPosts];
      return difference;
    })
    .catch((error) => {
      watchedState.update.error = error;
      watchedState.update.status = 'unsuccess';
    }));
  return Promise.all(requests).then(() => {
    watchedState.update.status = 'success';
    setTimeout(() => updatePosts(watchedState), timeout);
  });
};

const init = () => {
  const docElements = {
    body: document.querySelector('body'),
    form: document.querySelector('.rss-form'),
    feedback: document.querySelector('.feedback'),
    submitButton: document.querySelector('.sub-btn'),
    feeds: document.querySelector('.feeds'),
    input: document.querySelector('.form-control'),
    posts: document.querySelector('.posts'),
    modalWindow: document.querySelector('[aria-labelledby="modal"]'),
    modalWindowTitle: document.querySelector('.modal-title'),
    modalWindowContent: document.querySelector('.modal-text'),
    modalWindowCloseButton: document.querySelector('[data-dismiss="modal"]'),
    modalWindowOpenButton: document.querySelector('.full-article'),
    modalWindowBackdrop: document.querySelector('#modal-backdrop'),
    en: document.querySelector('.en'),
    ru: document.querySelector('.ru'),
    data18nElements: document.querySelectorAll('[data-i18n]'),
  };

  const state = {
    language: '',
    form: {
      status: 'valid',
      error: null,
    },
    feedDownload: {
      status: 'idle',
      error: null,
    },
    update: {
      status: 'idle',
      error: null,
    },
    links: [],
    feeds: [],
    posts: [],
    viewedPosts: new Set(),
    modal: {
      status: 'closed',
      postId: '',
    },
  };

  initTranslation('ru').then(() => {
    const watchedState = watch(state, docElements);
    watchedState.language = 'ru';
    updatePosts(watchedState)
      .catch((error) => {
        watchedState.update.error = error;
        watchedState.update.status = 'unsuccess';
      });
    docElements.form.addEventListener('submit', (e) => {
      e.preventDefault();
      const url = new FormData(docElements.form).get('url');
      const formValidationError = checkFormValidity(url, watchedState.links);
      if (formValidationError) {
        watchedState.form.status = 'invalid';
        watchedState.form.error = formValidationError;
        return;
      }
      watchedState.form.status = 'valid';
      watchedState.form.error = null;
      watchedState.feedDownload.status = 'sending';
      downloadContent(url)
        .then((result) => {
          const feedId = _.uniqueId();
          const content = parseRSS(result.data.contents, feedId, url);
          watchedState.feeds.unshift(content.channel);
          watchedState.posts = [...content.items, ...watchedState.posts];
          watchedState.feedDownload.status = 'success';
          watchedState.feedDownload.status = 'idle';
          watchedState.links.unshift(url);
        })
        .catch((error) => {
          watchedState.feedDownload.error = error;
          watchedState.feedDownload.status = 'unsuccess';
        });
    });

    docElements.posts.addEventListener('click', (event) => {
      if (event.target.type === 'button') {
        const clickedPost = event.target.previousSibling;
        const clickedPostNum = clickedPost.getAttribute('data-id');
        watchedState.viewedPosts.add(clickedPost.href);
        watchedState.modal.postId = clickedPostNum;
        watchedState.modal.link = clickedPost.href;
        watchedState.modal.status = 'open';
      }
    });

    docElements.modalWindowCloseButton.addEventListener('click', () => {
      watchedState.modal.status = 'closed';
      watchedState.modal.link = '';
      watchedState.modal.postId = '';
    });

    docElements.ru.addEventListener('click', (e) => {
      e.preventDefault();
      initTranslation('ru').then(() => {
        watchedState.language = 'ru';
      });
    });

    docElements.en.addEventListener('click', (e) => {
      e.preventDefault();
      initTranslation('en').then(() => {
        watchedState.language = 'en';
      });
    });
  });
};

export default init;
