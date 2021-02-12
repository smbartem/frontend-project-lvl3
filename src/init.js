import axios from 'axios';
import _ from 'lodash';
import checkFormValidity from './checkFormValidity.js';
import watch from './watch.js';
import initTranslation from './locales/initLang.js';
import 'bootstrap';

const parseRSS = (data) => {
  const parser = new DOMParser();
  const rssDataDocument = parser.parseFromString(data, 'text/xml');
  const channelTitle = rssDataDocument.querySelector('title').textContent;
  const channelDescription = rssDataDocument.querySelector('description').textContent;
  const channel = { channelTitle, channelDescription };
  const items = [...rssDataDocument.querySelectorAll('item')].map((el) => {
    const itemTitle = el.querySelector('title').textContent;
    const itemLink = el.querySelector('link').textContent;
    const itemDescription = el.querySelector('description').textContent;
    return { itemTitle, itemLink, itemDescription };
  });
  return { channel, items };
};

const downloadContent = (newLink) => {
  const proxy = 'https://hexlet-allorigins.herokuapp.com/get?disableCache=true&url=';
  return axios.get(`${proxy}${encodeURIComponent(newLink)}`);
};

const updatePosts = (watchedState, timeout = 5000) => {
  const requests = watchedState.links.map((url, index) => downloadContent(url)
    .then((result) => {
      const newPosts = parseRSS(result.data.contents).items;
      const oldPosts = watchedState.posts[index];
      const difference = _.differenceWith(newPosts, oldPosts, _.isEqual);
      if (difference.length > 0) {
        const newPostsState = [...watchedState.posts];
        newPostsState[index] = [...difference, ...oldPosts];
        watchedState.posts = [...newPostsState];
      }
      return difference;
    })
    .catch((error) => {
      watchedState.update.error = error;
      watchedState.update.status = 'unsuccess';
    }));
  return Promise.all(requests).then(() => {
    watchedState.update.status = 'success';
    return setTimeout(() => updatePosts(watchedState), timeout);
  });
};

const init = async () => {
  const docElements = {
    body: document.querySelector('body'),
    title: document.querySelector('h1'),
    lead: document.querySelector('.lead'),
    exampleLink: document.querySelector('.text-muted'),
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

  initTranslation('en').then(() => {
    const watchedState = watch(state, docElements);
    watchedState.language = 'en';
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
      } else {
        watchedState.form.status = 'valid';
        watchedState.form.error = null;
        watchedState.feedDownload.status = 'sending';
        downloadContent(url)
          .then((result) => {
            const content = parseRSS(result.data.contents);
            watchedState.feeds.unshift(content.channel);
            watchedState.posts.unshift(content.items);
            watchedState.feedDownload.status = 'success';
            watchedState.feedDownload.status = 'idle';
            watchedState.links.unshift(url);
          })
          .catch((error) => {
            watchedState.feedDownload.error = error;
            watchedState.feedDownload.status = 'unsuccess';
          });
      }
    });

    docElements.posts.addEventListener('click', (event) => {
      if (event.target.type === 'button') {
        const clickedPost = event.target.previousSibling;
        const clickedPostNum = clickedPost.id.split('-')[1];
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
