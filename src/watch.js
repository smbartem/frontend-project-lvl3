import onChange from 'on-change';
import i18next from 'i18next';

const generateFeeds = (feeds, container) => {
  const title = document.createElement('h2');
  title.textContent = i18next.t('feeds');
  const list = document.createElement('ul');
  list.classList.add('list-group', 'mb-5');
  feeds.forEach((el) => {
    const point = document.createElement('li');
    point.classList.add('list-group-item');
    const feedTitle = document.createElement('h3');
    feedTitle.textContent = el.feedTitle;
    const feedDescription = document.createElement('p');
    feedDescription.textContent = el.feedDescription;
    point.append(feedTitle);
    point.append(feedDescription);
    list.prepend(point);
  });
  container.innerHTML = '';
  container.append(title);
  container.append(list);
};

const generatePosts = (posts, container) => {
  const title = document.createElement('h2');
  title.textContent = i18next.t('posts');
  const list = document.createElement('ul');
  list.classList.add('list-group');
  const postsListReverse = [...posts].reverse();
  postsListReverse.flat(Infinity).forEach((el, index) => {
    const point = document.createElement('li');
    point.classList.add('list-group-item', 'd-flex', 'justify-content-between');
    const post = document.createElement('a');
    const previewBtn = document.createElement('button');
    previewBtn.setAttribute('type', 'button');
    previewBtn.classList.add('btn', 'btn-primary', 'btn-sm');
    previewBtn.textContent = i18next.t('viewButton');
    post.textContent = el.titlePost;
    post.href = el.linkPost;
    post.id = `post-${index}`;
    post.classList.add('font-weight-bold');
    point.prepend(previewBtn);
    point.prepend(post);
    list.append(point);
  });
  container.innerHTML = '';
  container.prepend(list);
  container.prepend(title);
};

const markViewedPosts = (container, state) => {
  state.feedDownload.viewedPosts.forEach((el) => {
    const post = container.querySelector(`[href="${el}"]`);
    post.classList.add('font-weight-normal');
    post.classList.remove('font-weight-bold');
  });
};

const handleForm = (formValidationError, docElements) => {
  if (formValidationError === null) {
    docElements.input.classList.remove('is-invalid');
    docElements.feedback.classList.remove('text-danger');
    docElements.feedback.textContent = formValidationError;
  } else {
    docElements.input.classList.add('is-invalid');
    docElements.feedback.classList.add('text-danger');
    docElements.feedback.textContent = formValidationError;
  }
};

const handleFeeds = (state, feedStatus, docElements) => {
  switch (feedStatus) {
    case 'success':
      generateFeeds(state.feedDownload.feeds, docElements.feeds);
      generatePosts(state.feedDownload.posts, docElements.posts);
      markViewedPosts(docElements.posts, state);
      docElements.feedback.classList.add('text-success');
      docElements.feedback.classList.remove('text-danger');
      docElements.feedback.textContent = i18next.t('succeed');
      docElements.input.value = '';
      docElements.input.focus();
      break;
    case 'failed':
      docElements.feedback.classList.add('text-danger');
      docElements.feedback.textContent = i18next.t('downloadError');
      break;
    case 'update':
      generateFeeds(state.feedDownload.feeds, docElements.feeds);
      generatePosts(state.feedDownload.posts, docElements.posts);
      markViewedPosts(docElements.posts, state);
      break;
    case 'sending':
      break;
    case 'unsuccess':
      docElements.feedback.classList.add('text-danger');
      docElements.feedback.textContent = i18next.t('downloadError');
      break;
    case 'editing':
      break;
    default:
      throw new Error(`Unknown feed status: '${feedStatus}'!`);
  }
};

const handleModalWindow = (docElements, state, value) => {
  if (value === 'open') {
    docElements.modalWindowTitle.textContent = state.feedDownload.modal.title;
    docElements.modalWindowContent.textContent = state.feedDownload.modal.description;
    docElements.modalWindowOpenButton.href = state.feedDownload.modal.link;
    docElements.modalWindow.classList.add('show', 'd-block');
    docElements.modalWindowBackdrop.classList.add('modal-backdrop', 'fade', 'show');
    docElements.body.classList.add('modal-open');
  } else {
    docElements.modalWindow.classList.remove('show', 'd-block');
    docElements.modalWindowBackdrop.classList.remove('modal-backdrop', 'fade', 'show');
    docElements.body.classList.remove('modal-open');
  }
};

export default (state, docElements) => {
  const watchedState = onChange(state, (path, value) => {
    switch (path) {
      case 'form.error':
        handleForm(value, docElements);
        break;
      case 'feedDownload.status':
        handleFeeds(state, value, docElements);
        break;
      case 'feedDownload.modal.status':
        handleModalWindow(docElements, state, value);
        break;
      case 'feedDownload.viewedPosts':
        markViewedPosts(docElements.posts, state);
        break;
      default:
        break;
    }
  });
  return watchedState;
};
