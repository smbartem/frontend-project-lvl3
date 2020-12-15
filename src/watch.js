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
  posts.reverse().flat(Infinity).forEach((el, index) => {
    const point = document.createElement('li');
    point.classList.add('list-group-item', 'd-flex', 'justify-content-between');
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
    list.prepend(point);
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

const handleFeeds = (watchedState, state, feedStatus, docElements) => {
  switch (feedStatus) {
    case 'success':
      generateFeeds(state.feedDownload.feeds, docElements.feeds);
      generatePosts(state.feedDownload.posts, docElements.posts);
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
      break;
    case 'sending':
      break;
    case 'unsuccess':
      break;
    case 'editing':
      break;
    default:
      throw new Error(`Unknown feed status: '${feedStatus}'!`);
  }
};

const handleModalWindow = (docElements, state, value) => {
  docElements.modalWindow.id = `modal${value}`;
  docElements.modalWindowTitle.textContent = state.feedDownload.posts[0][value].titlePost;
  docElements.modalWindowContent.textContent = state.feedDownload.posts[0][value]
    .descriptionPost;
  const modalButtonsClose = docElements.modalWindow.querySelectorAll('[data-dismiss="modal"]');
  modalButtonsClose.forEach((elem) => {
    elem.addEventListener('click', () => {
      const openedLink = docElements.posts.querySelector(`[data-target="#modal${value}"]`);
      const postTitle = openedLink.previousSibling;
      postTitle.classList.add('font-weight-normal');
      postTitle.classList.remove('font-weight-bold');
    });
  });
};

export default (state, docElements) => {
  // Исходя из замечания:
  // Необходимо изменить название или сделать три разных обработчика на каждый вариант?
  const watchedState = onChange(state, (path, value) => {
    switch (path) {
      case 'form.error':
        handleForm(value, docElements);
        break;
      case 'feedDownload.status':
        handleFeeds(watchedState, state, value, docElements);
        break;
      case 'feedDownload.modalLinkNumber':
        handleModalWindow(docElements, state, value);
        break;
      default:
        break;
    }
  });
  return watchedState;
};
