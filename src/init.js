/* eslint no-param-reassign:
["error", { "props": true, "ignorePropertyModificationsForRegex": ["watchedState"] }] */
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
  axios.get(`${proxy}${encodeURIComponent(newLink)}`)
    .then((result) => {
      const content = parseRSS(result.data.contents);
      watchedState.feed.data.links.push(newLink);
      watchedState.feed.data.feeds.push(content.feed);
      watchedState.feed.data.posts.push(content.posts);
      watchedState.feed.state = 'success';
    })
    .catch((error) => {
      watchedState.feed.requestErrors = error;
      watchedState.feed.state = 'unsuccess';
    });
};

// Насколько я понимаю, мое разделение функции не очень правильное,
// нет ли необходимости начинать обновление, после загрузки ленты?
const updatePosts = (links, watchedState) => {
  const proxy = 'https://api.allorigins.win/get?url=';
  const requests = links.map((url) => axios.get(`${proxy}${encodeURIComponent(url)}`)
    .catch((error) => {
      watchedState.feed.requestErrors = error;
      watchedState.feed.state = 'unsuccess';
    }));
  Promise.all(requests)
    .then((results) => results.map((elem, index) => {
      const content = parseRSS(elem.data.contents);
      const rObj = {};
      rObj[index] = content.posts;
      return rObj;
    }))
    .then((results) => {
      const allDifference = results.map((elem) => {
        const [key, value] = _.toPairs(elem).flat(Infinity);
        const difference = _.difference(value, watchedState.feed.data.posts[key]);
        if (difference.length > 0) {
          watchedState.feed.data.posts[key] = value;
        }
        return difference;
      });
      if (allDifference.flat(Infinity).length > 0) {
        watchedState.feed.state = 'update';
      }
      setTimeout(() => updatePosts(links, watchedState), 5000);
    });
};

const init = () => {
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
    en: document.querySelector('.en'),
    ru: document.querySelector('.ru'),
  };
  const state = {
    form: {
      validationState: 'valid',
      validationErr: null,
    },
    feed: {
      state: 'editing',
      requestErrors: null,
      data: {
        links: [],
        feeds: [],
        posts: [],
      },
    },
  };
  initialRender('en', docElements);

  const watchedState = watch(state, docElements);

  docElements.form.addEventListener('submit', (e) => {
    e.preventDefault();
    const formData = new FormData(docElements.form);
    const validationErr = checkFormValidity(formData.get('url'), state.feed.data.links);
    if (validationErr) {
      watchedState.form.validationState = 'invalid';
      watchedState.form.validationErr = validationErr;
    } else {
      watchedState.form.validationState = 'valid';
      watchedState.form.validationErr = null;
      watchedState.feed.state = 'sending';
      downloadContent(formData.get('url'), state.feed.data.links, watchedState);
      updatePosts(state.feed.data.links, watchedState);
    }
  });
  docElements.ru.addEventListener('click', (e) => {
    e.preventDefault();
    initialRender('ru', docElements);
    docElements.ru.classList.add('text-secondary');
    docElements.ru.classList.remove('text-white');
    docElements.en.classList.remove('text-secondary');
    docElements.en.classList.add('text-white');
  });
  docElements.en.addEventListener('click', (e) => {
    e.preventDefault();
    initialRender('en', docElements);
    docElements.en.classList.add('text-secondary');
    docElements.en.classList.remove('text-white');
    docElements.ru.classList.remove('text-secondary');
    docElements.ru.classList.add('text-white');
  });
};

export default init;
