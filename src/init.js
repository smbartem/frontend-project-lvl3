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

const updatePosts = (links, watchedState, state) => {
  const proxy = 'https://api.allorigins.win/get?url=';
  const timeout = 5000;
  const requests = links.map((url, index) => axios.get(`${proxy}${encodeURIComponent(url)}`)
    .then((result) => {
      const newPosts = parseRSS(result.data.contents).posts;
      const oldPosts = state.feedDownload.posts[index];
      const difference = _.differenceWith(newPosts, oldPosts, _.isEqual);
      return difference;
    })
    .catch((error) => {
      watchedState.feed.requestErrors = error;
      watchedState.feed.state = 'unsuccess';
    }));
  return Promise.all(requests).then((result) => {
    setTimeout(() => updatePosts(links, watchedState, state), timeout);
    return result;
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
    form: {
      status: 'valid',
      error: null,
    },
    feedDownload: {
      status: 'editing',
      error: null,
      links: [],
      feeds: [],
      posts: [],
      viewedPosts: [],
      modal: {
        status: 'closed',
        title: '',
        description: '',
        link: '',
      },
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
        downloadContent(formData.get('url'))
          .then((result) => {
            const content = parseRSS(result.data.contents);
            watchedState.feedDownload.links.push(formData.get('url'));
            watchedState.feedDownload.feeds.push(content.feed);
            watchedState.feedDownload.posts.push(content.posts);
            watchedState.feedDownload.status = 'success';
            watchedState.feedDownload.status = 'editing';
          })
          .then(() => updatePosts(state.feedDownload.links, watchedState, state)
            .then((result) => {
              result.forEach((elem, index) => {
                if (elem.length > 0) {
                  const difference = elem;
                  const posts = state.feedDownload.posts[index];
                  watchedState.feedDownload.posts[index] = [...difference, ...posts];
                  watchedState.feedDownload.status = 'update';
                  watchedState.feedDownload.status = 'editing';
                }
              });
            }))
          .catch((error) => {
            watchedState.feedDownload.error = error;
            watchedState.feedDownload.status = 'unsuccess';
          });
      }
    });

    docElements.posts.addEventListener('click', (event) => {
      if (event.target.type === 'button') {
        const clickedPost = event.target.previousSibling;
        if (state.feedDownload.viewedPosts.indexOf(clickedPost.href) === -1) {
          watchedState.feedDownload.viewedPosts.push(clickedPost.href);
        }
        const clickedPostNum = clickedPost.id.split('-')[1];
        const postsReverse = [...state.feedDownload.posts].reverse();
        const title = postsReverse.flat(Infinity)[clickedPostNum].titlePost;
        const description = postsReverse.flat(Infinity)[clickedPostNum].descriptionPost;
        watchedState.feedDownload.modal.title = title;
        watchedState.feedDownload.modal.description = description;
        watchedState.feedDownload.modal.link = clickedPost.href;
        watchedState.feedDownload.modal.status = 'open';
      }
    });

    docElements.modalWindowCloseButton.addEventListener('click', () => {
      watchedState.feedDownload.modal.status = 'closed';
      watchedState.feedDownload.modal.title = '';
      watchedState.feedDownload.modal.description = '';
      watchedState.feedDownload.modal.link = '';
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
