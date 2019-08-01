/** @returns {number} */
function startLoading() {
  const ellipsisElem = /** @type {HTMLElement} */(document.querySelector('.loading-indicator__ellipsis'));
  const ellipsisStr = '...';
  let len = 0;
  
  const loadingTimerId = window.setInterval(() => {
    ellipsisElem.innerText = ellipsisStr.substring(0, len);
    len = (len + 1) % (ellipsisStr.length + 1);
  }, 200);
  
  return loadingTimerId;
}

/** @param {number} [loadingTimerId] */
function stopLoading(loadingTimerId) {
  if (typeof loadingTimerId === 'number') {
    window.clearInterval(loadingTimerId);
  }
  
  /** @type {HTMLElement} */(document.querySelector('.loading-indicator')).classList.add   ('hidden');
  /** @type {HTMLElement} */(document.querySelector('.content'          )).classList.remove('hidden');
}


/** @type {number|undefined} */
let loadingTimerId;
document.addEventListener('DOMContentLoaded', () => {
  loadingTimerId = startLoading();
});

export function doneLoading() {
  stopLoading(loadingTimerId);
}
