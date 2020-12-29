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

const generatePosts = (posts, viewedPosts, container) => {
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
    const fontWeightStyle = viewedPosts.includes(el.linkPost) ? 'font-weight-normal' : 'font-weight-bold';
    post.classList.add(`${fontWeightStyle}`);
    point.prepend(previewBtn);
    point.prepend(post);
    list.append(point);
  });
  container.innerHTML = '';
  container.prepend(list);
  container.prepend(title);
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

const handleFeeds = (watchedState, feedStatus, docElements) => {
  switch (feedStatus) {
    case 'success':
      generateFeeds(watchedState.feeds, docElements.feeds);
      generatePosts(watchedState.posts, watchedState.viewedPosts, docElements.posts);
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
      generateFeeds(watchedState.feeds, docElements.feeds);
      generatePosts(watchedState.posts, watchedState.viewedPosts, docElements.posts);
      break;
    case 'sending':
      break;
    case 'unsuccess':
      docElements.feedback.classList.add('text-danger');
      docElements.feedback.textContent = i18next.t('downloadError');
      break;
    case 'editing':
      break;
    case 'none':
      break;
    default:
      throw new Error(`Unknown feed status: '${feedStatus}'!`);
  }
};

const handleModalWindow = (docElements, watchedState, value) => {
  if (value === 'open') {
    const postsReverse = [...watchedState.posts].reverse().flat(Infinity);
    const title = postsReverse[watchedState.modal.postId].titlePost;
    const description = postsReverse[watchedState.modal.postId].descriptionPost;
    docElements.modalWindowTitle.textContent = title;
    docElements.modalWindowContent.textContent = description;
    docElements.modalWindowOpenButton.href = watchedState.modal.link;
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
        handleFeeds(watchedState, value, docElements);
        break;
      case 'modal.status':
        handleModalWindow(docElements, watchedState, value);
        break;
      default:
        break;
    }
  });
  return watchedState;
};
