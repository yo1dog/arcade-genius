import {TJSONValue} from '../types/json';


const LOCAL_STATE_CUR_VERSION_NUM = 4;
const LOCAL_STATE_MIN_VERSION_NUM = 4;
const LOCAL_STATE_VERSION_NUM_KEY = '__stateVersionNum';

const localStateVersionNum = parseInt(window.localStorage.getItem(LOCAL_STATE_VERSION_NUM_KEY) || '', 10);
if (isNaN(localStateVersionNum) || localStateVersionNum < LOCAL_STATE_MIN_VERSION_NUM) {
  window.localStorage.clear();
}

window.localStorage.setItem(LOCAL_STATE_VERSION_NUM_KEY, LOCAL_STATE_CUR_VERSION_NUM.toString());

const state = new Map<string, TJSONValue>();

const searchParams = new URLSearchParams(location.search);
const urlStateSearchParamKey = 'state';


let sInitURLState: TJSONValue;
try {
  sInitURLState = JSON.parse(searchParams.get(urlStateSearchParamKey) || '');
} catch(err) {/*noop*/}
const initURLState:  Map<string, TJSONValue> = (
  sInitURLState && typeof sInitURLState === 'object' && !Array.isArray(sInitURLState)
  ? new Map<string, TJSONValue>(Object.entries(sInitURLState))
  : new Map()
);


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
    try {
      val = JSON.parse(window.localStorage.getItem(key) || '');
    } catch(err) {/*noop*/}
  }
  
  state.set(key, val);
  updateURLState();
  
  return val;
}

export function remove(key: string): void {
  state.delete(key);
  window.localStorage.removeItem(key);
  updateURLState();
}

export function clear(): void {
  state.clear();
  window.localStorage.clear();
  updateURLState();
}

function updateURLState(): void {
  searchParams.set(urlStateSearchParamKey, JSON.stringify(Object.fromEntries(state.entries())));
  window.history.replaceState({}, '', `${location.pathname}?${searchParams}${location.hash}`);
}
