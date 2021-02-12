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
    feedTitle.textContent = el.channelTitle;
    const feedDescription = document.createElement('p');
    feedDescription.textContent = el.channelDescription;
    point.append(feedTitle);
    point.append(feedDescription);
    list.append(point);
  });
  container.innerHTML = '';
  container.append(title);
  container.append(list);
};

const generatePosts = (posts, viewedPosts, container) => {
  const title = document.createElement('h2');
  title.textContent = i18next.t('posts');
  const list = document.createElement('ul');
  list.classList.add('list-group');
  [...posts].flat(Infinity).forEach((el, index) => {
    const point = document.createElement('li');
    point.classList.add('list-group-item', 'd-flex', 'justify-content-between');
    const post = document.createElement('a');
    const previewBtn = document.createElement('button');
    previewBtn.setAttribute('type', 'button');
    previewBtn.classList.add('btn', 'btn-primary', 'btn-sm');
    previewBtn.textContent = i18next.t('viewButton');
    post.textContent = el.itemTitle;
    post.href = el.itemLink;
    post.id = `post-${index}`;
    const fontWeightStyle = viewedPosts.has(el.itemLink) ? 'font-weight-normal' : 'font-weight-bold';
    post.classList.add(`${fontWeightStyle}`);
    point.prepend(previewBtn);
    point.prepend(post);
    list.append(point);
  });
  container.innerHTML = '';
  container.prepend(list);
  container.prepend(title);
};

const handleFormError = (formValidationError, docElements) => {
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

const handleFeedDownloadStatus = (feedStatus, docElements) => {
  switch (feedStatus) {
    case 'success':
      docElements.input.readOnly = false;
      break;
    case 'sending':
      docElements.input.readOnly = true;
      break;
    case 'unsuccess':
      docElements.input.readOnly = false;
      docElements.feedback.classList.add('text-danger');
      docElements.feedback.textContent = i18next.t('downloadError');
      break;
    case 'idle':
      break;
    default:
      throw new Error(`Unknown feed status: '${feedStatus}'!`);
  }
};

const handleUpdateStatus = (updateStatus, docElements) => {
  switch (updateStatus) {
    case 'success':
      docElements.feedback.classList.remove('text-danger');
      docElements.feedback.textContent = '';
      break;
    case 'unsuccess':
      docElements.feedback.classList.add('text-danger');
      docElements.feedback.textContent = i18next.t('downloadError');
      break;
    case 'idle':
      break;
    default:
      throw new Error(`Unknown feed status: '${updateStatus}'!`);
  }
};

const handleModalWindowStatus = (docElements, watchedState, value) => {
  if (value === 'open') {
    const post = [...watchedState.posts].flat(Infinity)[watchedState.modal.postId];
    const title = post.itemTitle;
    const description = post.itemDescription;
    docElements.modalWindowTitle.textContent = title;
    docElements.modalWindowContent.textContent = description;
    docElements.modalWindowOpenButton.href = post.itemLink;
    docElements.modalWindow.classList.add('show', 'd-block');
    docElements.modalWindowBackdrop.classList.add('modal-backdrop', 'fade', 'show');
    docElements.body.classList.add('modal-open');
  } else {
    docElements.modalWindow.classList.remove('show', 'd-block');
    docElements.modalWindowBackdrop.classList.remove('modal-backdrop', 'fade', 'show');
    docElements.body.classList.remove('modal-open');
  }
};

const handlelanguage = (docElements, value, watchedState) => {
  docElements.title.textContent = i18next.t('title');
  docElements.lead.textContent = i18next.t('lead');
  docElements.input.placeholder = i18next.t('inputPlaceholder');
  docElements.submitButton.textContent = i18next.t('button');
  docElements.exampleLink.textContent = i18next.t('exampleLink');
  docElements.modalWindowCloseButton.textContent = i18next.t('сloseButton');
  docElements.modalWindowOpenButton.textContent = i18next.t('openButton');
  if (watchedState.feeds.length > 0) {
    generateFeeds(watchedState.feeds, docElements.feeds);
  }
  if (watchedState.posts.length > 0) {
    generatePosts(watchedState.posts, watchedState.viewedPosts, docElements.posts);
  }
  if (value === 'ru') {
    docElements.ru.classList.add('text-secondary');
    docElements.ru.classList.remove('text-white');
    docElements.en.classList.remove('text-secondary');
    docElements.en.classList.add('text-white');
  } else {
    docElements.en.classList.add('text-secondary');
    docElements.en.classList.remove('text-white');
    docElements.ru.classList.remove('text-secondary');
    docElements.ru.classList.add('text-white');
  }
};

export default (state, docElements) => {
  const watchedState = onChange(state, (path, value) => {
    switch (path) {
      case 'feeds':
        generateFeeds(value, docElements.feeds);
        break;
      case 'posts':
        generatePosts(value, watchedState.viewedPosts, docElements.posts);
        break;
      case 'viewedPosts':
        generatePosts(watchedState.posts, value, docElements.posts);
        break;
      case 'links':
        docElements.feedback.classList.add('text-success');
        docElements.feedback.classList.remove('text-danger');
        docElements.feedback.textContent = i18next.t('succeed');
        docElements.input.value = '';
        docElements.input.focus();
        break;
      case 'form.error':
        handleFormError(value, docElements);
        break;
      case 'feedDownload.status':
        handleFeedDownloadStatus(value, docElements);
        break;
      case 'update.status':
        handleUpdateStatus(value, docElements);
        break;
      case 'modal.status':
        handleModalWindowStatus(docElements, watchedState, value);
        break;
      case 'language':
        handlelanguage(docElements, value, watchedState);
        break;
      default:
        break;
    }
  });
  return watchedState;
};
