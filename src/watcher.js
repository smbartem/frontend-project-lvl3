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
  _.values(posts).reverse().flat(Infinity).forEach((el, index) => {
    const point = document.createElement('li');
    point.classList.add('list-group-item', 'd-flex', 'justify-content-between');
    point.innerHTML = `<div class="modal fade" id="modal${index}" tabindex="-1" aria-labelledby="exampleModal" aria-hidden="true">
    <div class="modal-dialog">
      <div class="modal-content">
        <div class="modal-header">
          <h5 class="modal-title" id="exampleModalLabel">${el.titlePost}</h5>
          <button type="button" class="close" data-dismiss="modal" aria-label="Close">
            <span aria-hidden="true">&times;</span>
          </button>
        </div>
        <div class="modal-body">
        <p>${el.descriptionPost}</p>
        </div>
        <div class="modal-footer">
          <button type="button" class="btn btn-secondary" data-dismiss="modal">${i18next.t('сloseButton')}</button>
        </div>
      </div>
    </div>
  </div>`;
    const post = document.createElement('a');
    const previewBtn = document.createElement('button');
    previewBtn.setAttribute('type', 'button');
    previewBtn.classList.add('btn', 'btn-primary', 'btn-sm');
    previewBtn.setAttribute('data-toggle', 'modal');
    previewBtn.setAttribute('data-target', `#modal${index}`);
    previewBtn.textContent = i18next.t('viewButton');
    post.textContent = el.titlePost;
    post.href = el.linkPost;
    post.classList.add('font-weight-bold');
    point.prepend(previewBtn);
    point.prepend(post);
    list.append(point);
  });
  insertPlace.innerHTML = '';
  insertPlace.append(title);
  insertPlace.append(list);
  const modalButtonsClose = insertPlace.querySelectorAll('[data-dismiss="modal"]');
  modalButtonsClose.forEach((elem) => {
    elem.addEventListener('click', (e) => {
      const closestList = e.target.closest('li');
      const postTitle = closestList.querySelector('a');
      postTitle.classList.add('font-weight-normal');
      postTitle.classList.remove('font-weight-bold');
    });
  });
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
      if (value === 'update') {
        generatePosts(state.data.posts, docElements.posts);
      }
    }
  });
  return watchedState;
};
