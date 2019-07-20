function startLoading() {
  const ellipsisElem = document.querySelector('.loading-indicator__ellipsis');
  const ellipsisStr = '...';
  let len = 0;
  
  const loadingTimerId = window.setInterval(() => {
    ellipsisElem.innerText = ellipsisStr.substring(0, len);
    len = (len + 1) % (ellipsisStr.length + 1);
  }, 200);
  
  return loadingTimerId;
}

function doneLoading(loadingTimerId) {
  if (loadingTimerId) {
    window.clearInterval(loadingTimerId);
  }
  
  document.querySelector('.loading-indicator').classList.add('hidden');
  document.querySelector('.content').classList.remove('hidden');
}


let loadingTimerId = null;
document.addEventListener('DOMContentLoaded', () => {
  loadingTimerId = startLoading();
});

window.doneLoading = () => {
  doneLoading(loadingTimerId);
};