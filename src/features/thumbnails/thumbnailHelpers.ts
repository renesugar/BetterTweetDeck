import ReactDOM from 'react-dom';
import {Key} from 'ts-key-enum';

import {emptyNode, isHTMLElement, maybeDoOnNode, setStylesOnNode} from '../../helpers/domHelpers';
import {Handler, insertDomChefElement} from '../../helpers/typeHelpers';
import {
  BTDModalUuidAttribute,
  getFullscreenNodeRoot,
} from '../../types/betterTweetDeck/btdCommonTypes';

const onFullscreenKeyDown = (e: KeyboardEvent, onClose?: Handler) => {
  if (e.key !== Key.Escape) {
    return;
  }

  closeFullscreenModal();

  if (onClose) {
    onClose();
  }
};

const modalObserver = new ResizeObserver((entries) => {
  const rect = entries[0].contentRect;

  const mediaElement = document.querySelector<HTMLImageElement | HTMLVideoElement>(
    '[data-btd-modal-content-sizer] img, [data-btd-modal-content-sizer] video'
  )!;

  setStylesOnNode(mediaElement, {
    maxWidth: rect.width,
    maxHeight: rect.height,
  });
});

export function closeFullscreenModal() {
  document.removeEventListener('keydown', onFullscreenKeyDown, true);
  modalObserver.disconnect();
  maybeDoOnNode(getFullscreenNodeRoot(), (node) => {
    emptyNode(node);
    node.classList.remove('open');
  });
}

function maybeCloseFullscreenModalOnClick(e: MouseEvent, onClose?: Handler) {
  if (
    isHTMLElement(e.target) &&
    e.target.closest('.js-mediatable .js-modal-panel .js-mediaembed, .med-tweet, .mdl-btn-media')
  ) {
    return;
  }

  closeFullscreenModal();

  if (onClose) {
    onClose();
  }
}

export function openFullscreenModal(content: JSX.Element, btdUuid?: string) {
  const fullscreenNode = getFullscreenNodeRoot();

  if (!fullscreenNode) {
    return;
  }

  fullscreenNode.classList.add('open');
  if (btdUuid) {
    fullscreenNode.setAttribute(BTDModalUuidAttribute, btdUuid);
  }
  fullscreenNode.addEventListener('click', maybeCloseFullscreenModalOnClick);
  document.addEventListener('keydown', onFullscreenKeyDown, true);

  fullscreenNode.appendChild(insertDomChefElement(content));

  const target = document.querySelector('[data-btd-modal-content-sizer]');
  if (!target) {
    return;
  }

  modalObserver.observe(target);
}

export function openFullscreenModalWithReactElement(content: JSX.Element) {
  const fullscreenNode = getFullscreenNodeRoot();

  // Make sure to clean everything in the modal first
  closeFullscreenModal();

  if (!fullscreenNode) {
    return;
  }

  fullscreenNode.classList.add('open');

  const onClose = () => {
    ReactDOM.unmountComponentAtNode(fullscreenNode);
  };

  fullscreenNode.addEventListener('click', (e) => {
    return maybeCloseFullscreenModalOnClick(e, onClose);
  });
  document.addEventListener(
    'keydown',
    (e) => {
      return onFullscreenKeyDown(e, onClose);
    },
    true
  );
  ReactDOM.render(content, fullscreenNode);
}
