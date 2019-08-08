import {TJSONValue} from '../types/json';


const LOCAL_STATE_CUR_VERSION_NUM = 4;
const LOCAL_STATE_MIN_VERSION_NUM = 4;
const LOCAL_STATE_VERSION_NUM_KEY = '__stateVersionNum';
const URL_STATE_SEARCH_PARAM_KEY = 'state';

const localStateVersionNum = parseInt(window.localStorage.getItem(LOCAL_STATE_VERSION_NUM_KEY) || '', 10);
if (isNaN(localStateVersionNum) || localStateVersionNum < LOCAL_STATE_MIN_VERSION_NUM) {
  window.localStorage.clear();
}

window.localStorage.setItem(LOCAL_STATE_VERSION_NUM_KEY, LOCAL_STATE_CUR_VERSION_NUM.toString());

const state = new Map<string, TJSONValue>();
const initURLState = parseInitalURLState();


export function set(key: string, val: TJSONValue): TJSONValue {
  state.set(key, val);
  
  const jsonVal = JSON.stringify(val);
  
  window.localStorage.setItem(key, jsonVal);
  updateURLState();
  
  return val;
}

export function get(key: string): TJSONValue {
  let val: TJSONValue;
  
  if (state.has(key)) {
    val = state.get(key);
  }
  else if (initURLState.has(key)) {
    val = initURLState.get(key);
  }
  else {
    const valStr = window.localStorage.getItem(key);
    if (valStr !== null) {
      try {
        val = JSON.parse(valStr);
      } catch(err) {
        console.error(`Local storage item at key '${key}' is not valid JSON: ${valStr}`);
      }
    }
  }
  
  state.set(key, val);
  updateURLState();
  
  return val;
}

export function depricate(newKey:string, ...oldKeys:string[]): TJSONValue {
  const val = get(newKey);
  if (typeof val !== 'undefined') {
    remove(...oldKeys);
    return val;
  }
  
  for (const oldKey of oldKeys) {
    const val = get(oldKey);
    if (typeof val !== 'undefined') {
      remove(...oldKeys);
      set(newKey, val);
      return val;
    }
  }
  
  remove(...oldKeys);
}

export function remove(...keys: string[]): void {
  for (const key of keys) {
    state.delete(key);
    window.localStorage.removeItem(key);
  }
  updateURLState();
}

export function clear(): void {
  state.clear();
  window.localStorage.clear();
  updateURLState();
}

function parseInitalURLState(): Map<string, TJSONValue> {
  const searchParams = new URLSearchParams(location.search);
  
  const initURLStateStr = (searchParams.get(URL_STATE_SEARCH_PARAM_KEY) || '').trim();
  if (!initURLStateStr) {
    return new Map();
  }
  
  let sInitURLState: TJSONValue;
  try {
    sInitURLState = JSON.parse(initURLStateStr);
  } catch(err) {
    console.error(`Inital URL state is not valid JSON: ${initURLStateStr}`);
    return new Map();
  }
  
  if (typeof sInitURLState !== 'object' || sInitURLState === null || Array.isArray(sInitURLState)) {
    console.error(`Inital URL state is not an object: ${initURLStateStr}`);
    return new Map();
  }
  
  return new Map<string, TJSONValue>(Object.entries(sInitURLState));
}

function updateURLState(): void {
  const searchParams = new URLSearchParams(location.search);
  searchParams.set(URL_STATE_SEARCH_PARAM_KEY, JSON.stringify(Object.fromEntries(state.entries())));
  window.history.replaceState({}, '', `${location.pathname}?${searchParams}${location.hash}`);
}
