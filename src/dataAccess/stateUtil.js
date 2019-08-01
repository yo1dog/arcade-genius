import {TJSONValue} from '../types/json';


const LOCAL_STATE_CUR_VERSION_NUM = 4;
const LOCAL_STATE_MIN_VERSION_NUM = 4;
const LOCAL_STATE_VERSION_NUM_KEY = '__stateVersionNum';

const localStateVersionNum = parseInt(window.localStorage.getItem(LOCAL_STATE_VERSION_NUM_KEY) || '', 10);
if (isNaN(localStateVersionNum) || localStateVersionNum < LOCAL_STATE_MIN_VERSION_NUM) {
  window.localStorage.clear();
}

window.localStorage.setItem(LOCAL_STATE_VERSION_NUM_KEY, LOCAL_STATE_CUR_VERSION_NUM.toString());

/** @type {{[key:string]: TJSONValue}} */
const state = {};

const searchParams = new URLSearchParams(location.search);
const urlStateSearchParamKey = 'state';


/** @type {{[key:string]: TJSONValue}} */
let initURLState = {};
try {
  initURLState = JSON.parse(searchParams.get(urlStateSearchParamKey) || '');
} catch(err) {/*noop*/}
initURLState = initURLState && typeof initURLState === 'object'? initURLState : {};


/**
 * @param {string} key
 * @param {TJSONValue} val
 */
export function set(key, val) {
  state[key] = val;
  
  const jsonVal = JSON.stringify(val);
  
  window.localStorage.setItem(key, jsonVal);
  updateURLState();
}

/**
 * @param {string} key
 * @returns {TJSONValue}
 */
export function get(key) {
  /** @type {TJSONValue} */
  let val;
  
  if (key in state) {
    val = state[key];
  }
  else if (key in initURLState) {
    val = initURLState[key];
  }
  else {
    try {
      val = JSON.parse(window.localStorage.getItem(key) || '');
    } catch(err) {/*noop*/}
  }
  
  state[key] = val;
  updateURLState();
  
  return val;
}

/** @param {string} key */
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
  window.history.replaceState({}, '', `${location.pathname}?${searchParams}${location.hash}`);
}
