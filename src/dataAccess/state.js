const searchParams = new URLSearchParams(location.search);
const urlStateSearchParamKey = 'state';

const state = {};

let initURLState = {};
try {
  initURLState = JSON.parse(searchParams.get(urlStateSearchParamKey));
} catch(err) {/*noop*/}
initURLState = initURLState && typeof initURLState === 'object'? initURLState : {};


export function set(key, val) {
  state[key] = val;
  
  const jsonVal = JSON.stringify(val);
  
  window.localStorage.setItem(key, jsonVal);
  updateURLState();
}

export function get(key) {
  let val = null;
  
  if (key in state) {
    val = state[key];
  }
  else if (key in initURLState) {
    val = initURLState[key];
  }
  else {
    try {
      val = JSON.parse(window.localStorage.getItem(key));
    } catch(err) {/*noop*/}
  }
  
  state[key] = val;
  updateURLState();
  
  return val;
}

export function remove(key) {
  delete state[key];
  window.localStorage.removeItem(key);
  updateURLState();
}

export function clear() {
  for (const key in state) {
    delete state[key];
  }
  window.localStorage.clear();
  updateURLState();
}

function updateURLState() {
  searchParams.set(urlStateSearchParamKey, JSON.stringify(state));
  window.history.replaceState({}, '', `${location.pathname}?${searchParams}`);
}