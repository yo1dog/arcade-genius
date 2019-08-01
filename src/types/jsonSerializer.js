import {
  TJSONValue,
  IJSONObject
} from './json';


/**
 * @template T
 * @param {TJSONValue} serializedVal 
 * @param {string} propLabel 
 * @param {(serializedVal:TJSONValue, propLabel:string) => T} deserializeFn 
 * @returns {T | null}
 */
export function deserializeNullable(serializedVal, propLabel, deserializeFn) {
  if (serializedVal === null) return null;
  return deserializeFn(serializedVal, propLabel);
}
/**
 * @template T
 * @param {TJSONValue} serializedVal 
 * @param {string} propLabel 
 * @param {(serializedVal:TJSONValue, propLabel:string) => T} deserializeFn 
 * @returns {T | undefined}
 */
export function deserializeOptional(serializedVal, propLabel, deserializeFn) {
  if (typeof serializedVal === 'undefined') return undefined;
  return deserializeFn(serializedVal, propLabel);
}
/**
 * @template T
 * @param {TJSONValue} serializedVal 
 * @param {string} propLabel 
 * @param {(serializedVal:TJSONValue, propLabel:string) => T} deserializeFn 
 * @returns {T | null | undefined}
 */
export function deserializeNullableOptional(serializedVal, propLabel, deserializeFn) {
  if (serializedVal === null) return null;
  if (typeof serializedVal === 'undefined') return undefined;
  return deserializeFn(serializedVal, propLabel);
}


/**
 * @param {TJSONValue} serializedVal 
 * @param {string} propLabel 
 * @returns {string}
 */
export function deserializeString(serializedVal, propLabel) {
  if (serializedVal === null              ) throw new Error(`${propLabel} === null`);
  if (typeof serializedVal === 'undefined') throw new Error(`typeof ${propLabel} === 'undefined'`);
  if (typeof serializedVal !== 'string'   ) throw new Error(`typeof ${propLabel} !== 'string'`);
  return serializedVal;
}
/**
 * @param {TJSONValue} serializedVal 
 * @param {string} propLabel 
 * @returns {string | undefined}
 */
export function deserializeStringOptional(serializedVal, propLabel) {
  return deserializeOptional(serializedVal, propLabel, deserializeString);
}
/**
 * @param {TJSONValue} serializedVal 
 * @param {string} propLabel 
 * @returns {string | null}
 */
export function deserializeStringNullable(serializedVal, propLabel) {
  return deserializeNullable(serializedVal, propLabel, deserializeString);
}
/**
 * @param {TJSONValue} serializedVal 
 * @param {string} propLabel 
 * @returns {string | null | undefined}
 */
export function deserializeStringNullableOptional(serializedVal, propLabel) {
  return deserializeNullableOptional(serializedVal, propLabel, deserializeString);
}

/**
 * @param {TJSONValue} serializedVal 
 * @param {string} propLabel 
 * @returns {number}
 */
export function deserializeNumber(serializedVal, propLabel) {
  if (serializedVal === null              ) throw new Error(`${propLabel} === null`);
  if (typeof serializedVal === 'undefined') throw new Error(`typeof ${propLabel} === 'undefined'`);
  if (typeof serializedVal !== 'number'   ) throw new Error(`typeof ${propLabel} !== 'number'`);
  return serializedVal;
}
/**
 * @param {TJSONValue} serializedVal 
 * @param {string} propLabel 
 * @returns {number | undefined}
 */
export function deserializeNumberOptional(serializedVal, propLabel) {
  return deserializeOptional(serializedVal, propLabel, deserializeNumber);
}
/**
 * @param {TJSONValue} serializedVal 
 * @param {string} propLabel 
 * @returns {number | null}
 */
export function deserializeNumberNullable(serializedVal, propLabel) {
  return deserializeNullable(serializedVal, propLabel, deserializeNumber);
}
/**
 * @param {TJSONValue} serializedVal 
 * @param {string} propLabel 
 * @returns {number | null | undefined}
 */
export function deserializeNumberNullableOptional(serializedVal, propLabel) {
  return deserializeNullableOptional(serializedVal, propLabel, deserializeNumber);
}

/**
 * @param {TJSONValue} serializedVal 
 * @param {string} propLabel 
 * @returns {boolean}
 */
export function deserializeBoolean(serializedVal, propLabel) {
  if (serializedVal === null              ) throw new Error(`${propLabel} === null`);
  if (typeof serializedVal === 'undefined') throw new Error(`typeof ${propLabel} === 'undefined'`);
  if (typeof serializedVal !== 'boolean'  ) throw new Error(`typeof ${propLabel} !== 'boolean'`);
  return serializedVal;
}
/**
 * @param {TJSONValue} serializedVal 
 * @param {string} propLabel 
 * @returns {boolean | undefined}
 */
export function deserializeBooleanOptional(serializedVal, propLabel) {
  return deserializeOptional(serializedVal, propLabel, deserializeBoolean);
}
/**
 * @param {TJSONValue} serializedVal 
 * @param {string} propLabel 
 * @returns {boolean | null}
 */
export function deserializeBooleanNullable(serializedVal, propLabel) {
  return deserializeNullable(serializedVal, propLabel, deserializeBoolean);
}
/**
 * @param {TJSONValue} serializedVal 
 * @param {string} propLabel 
 * @returns {boolean | null | undefined}
 */
export function deserializeBooleanNullableOptional(serializedVal, propLabel) {
  return deserializeNullableOptional(serializedVal, propLabel, deserializeBoolean);
}

/**
 * @param {TJSONValue} serializedVal 
 * @param {string} propLabel 
 * @returns {IJSONObject}
 */
export function deserializeObject(serializedVal, propLabel) {
  if (serializedVal === null              ) throw new Error(`${propLabel} === null`);
  if (typeof serializedVal === 'undefined') throw new Error(`typeof ${propLabel} === 'undefined'`);
  if (typeof serializedVal !== 'object'   ) throw new Error(`typeof ${propLabel} !== 'object'`);
  if (Array.isArray(serializedVal)        ) throw new Error(`Array.isArray(${propLabel})`);
  
  return serializedVal;
}
/**
 * @param {TJSONValue} serializedVal 
 * @param {string} propLabel 
 * @returns {IJSONObject | undefined}
 */
export function deserializeObjectOptional(serializedVal, propLabel) {
  return deserializeOptional(serializedVal, propLabel, deserializeObject);
}
/**
 * @param {TJSONValue} serializedVal 
 * @param {string} propLabel 
 * @returns {IJSONObject | null}
 */
export function deserializeObjectNullable(serializedVal, propLabel) {
  return deserializeNullable(serializedVal, propLabel, deserializeObject);
}
/**
 * @param {TJSONValue} serializedVal 
 * @param {string} propLabel 
 * @returns {IJSONObject | null | undefined}
 */
export function deserializeObjectNullableOptional(serializedVal, propLabel) {
  return deserializeNullableOptional(serializedVal, propLabel, deserializeObject);
}

/**
 * @template T
 * @param {TJSONValue} serializedVal 
 * @param {string} propLabel 
 * @param {(serializedVal:TJSONValue, propLabel:string) => T} deserializeFn 
 * @returns {T[]}
 */
export function deserializeArray(serializedVal, propLabel, deserializeFn) {
  if (serializedVal === null              ) throw new Error(`${propLabel} === null`);
  if (typeof serializedVal === 'undefined') throw new Error(`typeof ${propLabel} === 'undefined'`);
  if (!Array.isArray(serializedVal)       ) throw new Error(`!Array.isArray(${propLabel})`);
  
  return serializedVal.map((x, i) => deserializeFn(x, `${propLabel}[${i}]`));
}
/**
 * @template T
 * @param {TJSONValue} serializedVal 
 * @param {string} propLabel 
 * @param {(serializedVal:TJSONValue, propLabel:string) => T} deserializeFn 
 * @returns {T[] | null}
 */
export function deserializeArrayNullable(serializedVal, propLabel, deserializeFn) {
  if (serializedVal === null) return null;
  return deserializeArray(serializedVal, propLabel, deserializeFn);
}
/**
 * @template T
 * @param {TJSONValue} serializedVal 
 * @param {string} propLabel 
 * @param {(serializedVal:TJSONValue, propLabel:string) => T} deserializeFn 
 * @returns {T[] | undefined}
 */
export function deserializeArrayOptional(serializedVal, propLabel, deserializeFn) {
  if (typeof serializedVal === 'undefined') return undefined;
  return deserializeArray(serializedVal, propLabel, deserializeFn);
}
/**
 * @template T
 * @param {TJSONValue} serializedVal 
 * @param {string} propLabel 
 * @param {(serializedVal:TJSONValue, propLabel:string) => T} deserializeFn 
 * @returns {T[] | null | undefined}
 */
export function deserializeArrayNullableOptional(serializedVal, propLabel, deserializeFn) {
  if (serializedVal === null) return null;
  if (typeof serializedVal === 'undefined') return undefined;
  return deserializeArray(serializedVal, propLabel, deserializeFn);
}

/**
 * @template T
 * @param {TJSONValue} serializedVal 
 * @param {string} propLabel 
 * @param {(serializedVal:TJSONValue, propLabel:string, key:string) => T} deserializeFn 
 * @returns {Map<string, T>}
 */
export function deserializeMap(serializedVal, propLabel, deserializeFn) {
  const obj = deserializeObject(serializedVal, propLabel);
  
  /** @type {Map<string, T>} */
  const map = new Map();
  for (const key in obj) {
    map.set(key, deserializeFn(obj[key], `${propLabel}['${key}']`, key));
  }
  return map;
}
/**
 * @template T
 * @param {TJSONValue} serializedVal 
 * @param {string} propLabel 
 * @param {(serializedVal:TJSONValue, propLabel:string) => T} deserializeFn 
 * @returns {Map<string, T> | null}
 */
export function deserializeMapNullable(serializedVal, propLabel, deserializeFn) {
  if (serializedVal === null) return null;
  return deserializeMap(serializedVal, propLabel, deserializeFn);
}
/**
 * @template T
 * @param {TJSONValue} serializedVal 
 * @param {string} propLabel 
 * @param {(serializedVal:TJSONValue, propLabel:string) => T} deserializeFn 
 * @returns {Map<string, T> | undefined}
 */
export function deserializeMapOptional(serializedVal, propLabel, deserializeFn) {
  if (typeof serializedVal === 'undefined') return undefined;
  return deserializeMap(serializedVal, propLabel, deserializeFn);
}
/**
 * @template T
 * @param {TJSONValue} serializedVal 
 * @param {string} propLabel 
 * @param {(serializedVal:TJSONValue, propLabel:string) => T} deserializeFn 
 * @returns {Map<string, T> | null | undefined}
 */
export function deserializeMapNullableOptional(serializedVal, propLabel, deserializeFn) {
  if (serializedVal === null) return null;
  if (typeof serializedVal === 'undefined') return undefined;
  return deserializeMap(serializedVal, propLabel, deserializeFn);
}