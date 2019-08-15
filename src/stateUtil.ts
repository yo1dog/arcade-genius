import {TJSONValue} from './types/json';


const LOCAL_STATE_CUR_VERSION_NUM = 4;
const LOCAL_STATE_MIN_VERSION_NUM = 4;
const LOCAL_STATE_VERSION_NUM_KEY = '__stateVersionNum';
const URL_STATE_SEARCH_PARAM_KEY = 'state';

const localStateVersionNum = parseInt(window.localStorage.getItem(LOCAL_STATE_VERSION_NUM_KEY) || '', 10);
if (isNaN(localStateVersionNum) || localStateVersionNum < LOCAL_STATE_MIN_VERSION_NUM) {
  window.localStorage.clear();
}

window.localStorage.setItem(LOCAL_STATE_VERSION_NUM_KEY, LOCAL_STATE_CUR_VERSION_NUM.toString());

const state = parseInitalURLState();


export function set(key: string, val: TJSONValue): TJSONValue {
  state.set(key, val);
  
  const jsonVal = JSON.stringify(val);
  
  window.localStorage.setItem(key, jsonVal);
  updateURLState();
  
  return val;
}

export function get(key: string): TJSONValue {
  const val = state.has(key)? state.get(key) : getFromLocalStorage(key);
  
  state.set(key, val);
  updateURLState();
  
  return val;
}

export function depricate(newKey:string, ...oldKeys:string[]): TJSONValue {
  // favor the consumed state first, then local storate
  const getFns: ((key: string) => TJSONValue)[] = [
    key => state.get(key),
    key => getFromLocalStorage(key)
  ];
  
  for (const getFn of getFns) {
    const val = getFn(newKey);
    if (val !== undefined) {
      remove(...oldKeys);
      set(newKey, val);
      return val;
    }
    
    for (const oldKey of oldKeys) {
      const val = getFn(oldKey);
      if (val !== undefined) {
        remove(...oldKeys);
        set(newKey, val);
        return val;
      }
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

function getFromLocalStorage(key: string): TJSONValue {
  const valStr = window.localStorage.getItem(key);
  if (valStr === null) return;
  
  try {
    return JSON.parse(valStr);
  } catch(err) {
    console.error(`Local storage item at key '${key}' is not valid JSON: ${valStr}`);
  }
}
