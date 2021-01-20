import axios from 'axios';
import _ from 'lodash';
import checkFormValidity from './checkFormValidity.js';
import watch from './watch.js';
import initialRender from './locales/initLang.js';

const parseRSS = (data) => {
  const parser = new DOMParser();
  const rssDataDocument = parser.parseFromString(data, 'text/xml');
  const feedTitle = rssDataDocument.querySelector('title').textContent;
  const feedDescription = rssDataDocument.querySelector('description').textContent;
  const feed = { feedTitle, feedDescription };
  const items = rssDataDocument.querySelectorAll('item');
  const posts = [...items].map((el) => {
    const titlePost = el.querySelector('title').textContent;
    const linkPost = el.querySelector('link').textContent;
    const descriptionPost = el.querySelector('description').textContent;
    return { titlePost, linkPost, descriptionPost };
  });
  return { feed, posts };
};

const downloadContent = (newLink) => {
  const proxy = 'https://api.allorigins.win/get?url=';
  return axios.get(`${proxy}${encodeURIComponent(newLink)}`);
};

const updatePosts = (watchedState, timeout = 5000) => {
  const requests = watchedState.links.map((url, index) => downloadContent(url)
    .then((result) => {
      const newPosts = parseRSS(result.data.contents).posts;
      const oldPosts = watchedState.posts[index];
      const difference = _.differenceWith(newPosts, oldPosts, _.isEqual);
      return difference;
    })
    .catch((error) => {
      watchedState.update.error = error;
      watchedState.update.status = 'unsuccess';
    }));
  return Promise.all(requests).then((result) => {
    result.map((difference, index) => {
      if (difference.length > 0) {
        const posts = watchedState.posts[index];
        const newPosts = [...difference, ...posts];
        watchedState.posts[index] = newPosts;
        return newPosts;
      }
      return difference;
    });
    if (result.flat(Infinity).length > 0) {
      watchedState.update.status = 'success';
      watchedState.update.status = 'idle';
    }
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
    modalWindow: document.querySelector('[aria-labelledby="exampleModal"]'),
    modalWindowTitle: document.querySelector('.modal-title'),
    modalWindowContent: document.querySelector('.modal-text'),
    modalWindowCloseButton: document.querySelector('.btn-secondary'),
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

  initialRender('en').then(() => {
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
        downloadContent(url)
          .then((result) => {
            const content = parseRSS(result.data.contents);
            watchedState.feeds.unshift(content.feed);
            watchedState.posts.unshift(content.posts);
            /* Подскажите, пожалуйста, если убрать присваивание статуса 'success', то не будет
            рендера. Не очень понимаю как избавиться от обновления поля в стейте сразу же несколько
            раз. Наверное, необходимо перенести измения статуса с 'success' на 'idle' после
            осуществления рендера, но мы обсуждали, что так делать нельзя. Подскажите, пожалуйста,
            в какую сторону размышлять при реорганизации кода. */
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
        watchedState.update.status = 'success';
        watchedState.update.status = 'idle';
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
      initialRender('ru').then(() => {
        watchedState.language = 'ru';
        if (watchedState.links.length > 0) {
          watchedState.update.status = 'success';
          watchedState.update.status = 'idle';
        }
      });
    });

    docElements.en.addEventListener('click', (e) => {
      e.preventDefault();
      initialRender('en').then(() => {
        watchedState.language = 'en';
        if (watchedState.links.length > 0) {
          watchedState.update.status = 'success';
          watchedState.update.status = 'idle';
        }
      });
    });
  });
};

export default init;
