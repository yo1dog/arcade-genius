const LOCAL_STATE_CUR_VERSION_NUM = 3;
const LOCAL_STATE_MIN_VERSION_NUM = 3;
const LOCAL_STATE_VERSION_NUM_KEY = '__stateVersionNum';

const localStateVersionNum = parseInt(window.localStorage.getItem(LOCAL_STATE_VERSION_NUM_KEY), 10);
if (isNaN(localStateVersionNum) || localStateVersionNum < LOCAL_STATE_MIN_VERSION_NUM) {
  window.localStorage.clear();
}

window.localStorage.setItem(LOCAL_STATE_VERSION_NUM_KEY, LOCAL_STATE_CUR_VERSION_NUM);

const state = {};


let initURLState = {};
try {
  initURLState = JSON.parse(decodeURIComponent(window.location.hash));
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
  window.history.replaceState(null, null, `#${encodeURIComponent(JSON.stringify(state))}`);
}