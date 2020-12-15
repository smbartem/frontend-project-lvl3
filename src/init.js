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

const downloadContent = (newLink, urls, watchedState) => {
  const proxy = 'https://api.allorigins.win/get?url=';
  return axios.get(`${proxy}${encodeURIComponent(newLink)}`)
    .then((result) => {
      const content = parseRSS(result.data.contents);
      watchedState.feedDownload.links.push(newLink);
      watchedState.feedDownload.feeds.push(content.feed);
      watchedState.feedDownload.posts.push(content.posts);
      watchedState.feedDownload.status = 'success';
      watchedState.feedDownload.status = 'editing';
    });
};

// Мы пришли к плоской структуре хранения данных в стейте, новые посты добавляются
// просто сверху в ленте, либо туда же, где и предыдущие посты от данной ссылки?
// Если второй вариант, поясните, пожалуйста, чуть подробнее замечание к функции
// обновления постов.

const updatePosts = (links, watchedState) => {
  const proxy = 'https://api.allorigins.win/get?url=';
  const timeout = 5000;
  const requests = links.map((url) => axios.get(`${proxy}${encodeURIComponent(url)}`)
    .catch((error) => {
      watchedState.feed.requestErrors = error;
      watchedState.feed.state = 'unsuccess';
    }));
  return Promise.all(requests)
    .then((results) => results.map((elem, index) => {
      const content = parseRSS(elem.data.contents);
      const rObj = {};
      rObj[index] = content.posts;
      return rObj;
    }))
    .then((results) => {
      const allDifference = results.map((elem) => {
        const [key, value] = _.toPairs(elem).flat(Infinity);
        const difference = _.difference(value, watchedState.feedDownload.posts[key]);
        if (difference.length > 0) {
          watchedState.feedDownload.posts[key] = value;
        }
        return difference;
      });
      if (allDifference.flat(Infinity).length > 0) {
        watchedState.feedDownload.status = 'update';
        watchedState.feedDownload.status = 'editing';
      }
      setTimeout(() => updatePosts(links, watchedState), timeout);
    });
};

const init = async () => {
  const docElements = {
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
    en: document.querySelector('.en'),
    ru: document.querySelector('.ru'),
  };
  const state = {
    form: {
      status: 'valid',
      error: null,
    },
    feedDownload: {
      status: 'editing',
      error: null,
      modalLinkNumber: null,
      links: [],
      feeds: [],
      posts: [],
    },
  };
  initialRender('en', docElements).then(() => {
    const watchedState = watch(state, docElements);

    docElements.form.addEventListener('submit', (e) => {
      e.preventDefault();
      const formData = new FormData(docElements.form);
      const formValidationError = checkFormValidity(formData.get('url'), state.feedDownload.links);
      if (formValidationError) {
        watchedState.form.status = 'invalid';
        watchedState.form.error = formValidationError;
      } else {
        watchedState.form.status = 'valid';
        watchedState.form.error = null;
        watchedState.feedDownload.status = 'sending';
        downloadContent(formData.get('url'), state.feedDownload.links, watchedState).then(() => {
          updatePosts(state.feedDownload.links, watchedState)
            .then(() => {
              const modalButtons = docElements.posts.querySelectorAll('[data-toggle="modal"]');
              modalButtons.forEach((elem) => {
                elem.addEventListener('click', (event) => {
                  watchedState.feedDownload.modalLinkNumber = event.target.getAttribute('data-target').slice(-1);
                });
              });
            })
            .catch((error) => {
              watchedState.feedDownload.error = error;
              watchedState.feedDownload.status = 'unsuccess';
            });
        }).catch((error) => {
          watchedState.feedDownload.error = error;
          watchedState.feedDownload.status = 'unsuccess';
        });
      }
    });
    docElements.ru.addEventListener('click', (e) => {
      e.preventDefault();
      initialRender('ru', docElements).then(() => {
        docElements.ru.classList.add('text-secondary');
        docElements.ru.classList.remove('text-white');
        docElements.en.classList.remove('text-secondary');
        docElements.en.classList.add('text-white');
        watchedState.feedDownload.status = 'update';
        watchedState.feedDownload.status = 'editing';
      });
    });
    docElements.en.addEventListener('click', (e) => {
      e.preventDefault();
      initialRender('en', docElements).then(() => {
        docElements.en.classList.add('text-secondary');
        docElements.en.classList.remove('text-white');
        docElements.ru.classList.remove('text-secondary');
        docElements.ru.classList.add('text-white');
        watchedState.feedDownload.status = 'update';
        watchedState.feedDownload.status = 'editing';
      });
    });
  });
};

export default init;
