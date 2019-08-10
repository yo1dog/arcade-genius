import {
  TJSONValue,
  IJSONObject
} from './json';


export function deserializeNullable<T>(
  serializedVal: TJSONValue,
  propLabel    : string,
  deserializeFn: (serializedVal:TJSONValue, propLabel:string) => T
): T | null {
  if (serializedVal === null) return null;
  return deserializeFn(serializedVal, propLabel);
}
export function deserializeOptional<T>(
  serializedVal: TJSONValue,
  propLabel    : string,
  deserializeFn: (serializedVal:TJSONValue, propLabel:string) => T
): T | undefined {
  if (serializedVal === undefined) return undefined;
  return deserializeFn(serializedVal, propLabel);
}
export function deserializeNullableOptional<T>(
  serializedVal: TJSONValue,
  propLabel    : string,
  deserializeFn: (serializedVal:TJSONValue, propLabel:string) => T
): T | null | undefined {
  if (serializedVal === null     ) return null;
  if (serializedVal === undefined) return undefined;
  return deserializeFn(serializedVal, propLabel);
}


export function deserializeString(serializedVal: TJSONValue, propLabel: string): string {
  if (serializedVal === null           ) throw new Error(`${propLabel} === null`);
  if (serializedVal === undefined      ) throw new Error(`${propLabel} === undefined`);
  if (typeof serializedVal !== 'string') throw new Error(`typeof ${propLabel} !== 'string'`);
  return serializedVal;
}
export function deserializeStringOptional(serializedVal: TJSONValue, propLabel: string): string | undefined {
  return deserializeOptional(serializedVal, propLabel, deserializeString);
}
export function deserializeStringNullable(serializedVal: TJSONValue, propLabel: string): string | null {
  return deserializeNullable(serializedVal, propLabel, deserializeString);
}
export function deserializeStringNullableOptional(serializedVal: TJSONValue, propLabel: string): string | null | undefined {
  return deserializeNullableOptional(serializedVal, propLabel, deserializeString);
}

export function deserializeNumber(serializedVal: TJSONValue, propLabel: string): number {
  if (serializedVal === null           ) throw new Error(`${propLabel} === null`);
  if (serializedVal === undefined      ) throw new Error(`${propLabel} === undefined`);
  if (typeof serializedVal !== 'number') throw new Error(`typeof ${propLabel} !== 'number'`);
  return serializedVal;
}
export function deserializeNumberOptional(serializedVal: TJSONValue, propLabel: string): number | undefined {
  return deserializeOptional(serializedVal, propLabel, deserializeNumber);
}
export function deserializeNumberNullable(serializedVal: TJSONValue, propLabel: string): number | null {
  return deserializeNullable(serializedVal, propLabel, deserializeNumber);
}
export function deserializeNumberNullableOptional(serializedVal: TJSONValue, propLabel: string): number | null | undefined {
  return deserializeNullableOptional(serializedVal, propLabel, deserializeNumber);
}

export function deserializeBoolean(serializedVal: TJSONValue, propLabel: string): boolean {
  if (serializedVal === null            ) throw new Error(`${propLabel} === null`);
  if (serializedVal === undefined       ) throw new Error(`${propLabel} === undefined`);
  if (typeof serializedVal !== 'boolean') throw new Error(`typeof ${propLabel} !== 'boolean'`);
  return serializedVal;
}
export function deserializeBooleanOptional(serializedVal: TJSONValue, propLabel: string): boolean | undefined {
  return deserializeOptional(serializedVal, propLabel, deserializeBoolean);
}
export function deserializeBooleanNullable(serializedVal: TJSONValue, propLabel: string): boolean | null {
  return deserializeNullable(serializedVal, propLabel, deserializeBoolean);
}
export function deserializeBooleanNullableOptional(serializedVal: TJSONValue, propLabel: string): boolean | null | undefined {
  return deserializeNullableOptional(serializedVal, propLabel, deserializeBoolean);
}

export function deserializeObject(serializedVal: TJSONValue, propLabel: string): IJSONObject {
  if (serializedVal === null           ) throw new Error(`${propLabel} === null`);
  if (serializedVal === undefined      ) throw new Error(`${propLabel} === undefined`);
  if (typeof serializedVal !== 'object') throw new Error(`typeof ${propLabel} !== 'object'`);
  if (Array.isArray(serializedVal)     ) throw new Error(`Array.isArray(${propLabel})`);
  
  return serializedVal;
}
export function deserializeObjectOptional(serializedVal: TJSONValue, propLabel: string): IJSONObject | undefined {
  return deserializeOptional(serializedVal, propLabel, deserializeObject);
}
export function deserializeObjectNullable(serializedVal: TJSONValue, propLabel: string): IJSONObject | null {
  return deserializeNullable(serializedVal, propLabel, deserializeObject);
}
export function deserializeObjectNullableOptional(serializedVal: TJSONValue, propLabel: string): IJSONObject | null | undefined {
  return deserializeNullableOptional(serializedVal, propLabel, deserializeObject);
}

export function deserializeArray<T>(
  serializedVal: TJSONValue,
  propLabel    : string,
  deserializeFn: (serializedVal:TJSONValue, propLabel:string) => T
): T[] {
  if (serializedVal === null       ) throw new Error(`${propLabel} === null`);
  if (serializedVal === undefined  ) throw new Error(`${propLabel} === undefined`);
  if (!Array.isArray(serializedVal)) throw new Error(`!Array.isArray(${propLabel})`);
  
  return serializedVal.map((x, i) => deserializeFn(x, `${propLabel}[${i}]`));
}
export function deserializeArrayNullable<T>(
  serializedVal: TJSONValue,
  propLabel    : string,
  deserializeFn: (serializedVal:TJSONValue, propLabel:string) => T
): T[] | null {
  if (serializedVal === null) return null;
  return deserializeArray(serializedVal, propLabel, deserializeFn);
}
export function deserializeArrayOptional<T>(
  serializedVal: TJSONValue,
  propLabel    : string,
  deserializeFn: (serializedVal:TJSONValue, propLabel:string) => T
): T[] | undefined {
  if (serializedVal === undefined) return undefined;
  return deserializeArray(serializedVal, propLabel, deserializeFn);
}
export function deserializeArrayNullableOptional<T>(
  serializedVal: TJSONValue,
  propLabel    : string,
  deserializeFn: (serializedVal:TJSONValue, propLabel:string) => T
): T[] | null | undefined {
  if (serializedVal === null     ) return null;
  if (serializedVal === undefined) return undefined;
  return deserializeArray(serializedVal, propLabel, deserializeFn);
}

export function deserializeMap<T>(
  serializedVal: TJSONValue,
  propLabel    : string,
  deserializeFn: (serializedVal:TJSONValue, propLabel:string, key:string) => T
): Map<string, T> {
  const obj = deserializeObject(serializedVal, propLabel);
  
  const map = new Map<string, T>();
  for (const key in obj) {
    map.set(key, deserializeFn(obj[key], `${propLabel}['${key}']`, key));
  }
  return map;
}
export function deserializeMapNullable<T>(
  serializedVal: TJSONValue,
  propLabel    : string,
  deserializeFn: (serializedVal:TJSONValue, propLabel:string, key:string) => T
): Map<string, T> | null {
  if (serializedVal === null) return null;
  return deserializeMap(serializedVal, propLabel, deserializeFn);
}
export function deserializeMapOptional<T>(
  serializedVal: TJSONValue,
  propLabel    : string,
  deserializeFn: (serializedVal:TJSONValue, propLabel:string, key:string) => T
): Map<string, T> | undefined {
  if (serializedVal === undefined) return undefined;
  return deserializeMap(serializedVal, propLabel, deserializeFn);
}
export function deserializeMapNullableOptional<T>(
  serializedVal: TJSONValue,
  propLabel    : string,
  deserializeFn: (serializedVal:TJSONValue, propLabel:string, key:string) => T
): Map<string, T> | null | undefined {
  if (serializedVal === null     ) return null;
  if (serializedVal === undefined) return undefined;
  return deserializeMap(serializedVal, propLabel, deserializeFn);
}

export function deserializeObjectMap<T>(
  serializedVal: TJSONValue,
  propLabel    : string,
  deserializeFn: (serializedVal:TJSONValue, propLabel:string, key:string) => T
): {[key: string]: T} {
  const obj = deserializeObject(serializedVal, propLabel);
  
  const newObj: {[key: string]: T} = {};
  for (const key in obj) {
    newObj[key] = deserializeFn(obj[key], `${propLabel}['${key}']`, key);
  }
  return newObj;
}
export function deserializeObjectMapNullable<T>(
  serializedVal: TJSONValue,
  propLabel    : string,
  deserializeFn: (serializedVal:TJSONValue, propLabel:string, key:string) => T
): {[key: string]: T} | null {
  if (serializedVal === null) return null;
  return deserializeObjectMap(serializedVal, propLabel, deserializeFn);
}
export function deserializeObjectMapOptional<T>(
  serializedVal: TJSONValue,
  propLabel    : string,
  deserializeFn: (serializedVal:TJSONValue, propLabel:string, key:string) => T
): {[key: string]: T} | undefined {
  if (serializedVal === undefined) return undefined;
  return deserializeObjectMap(serializedVal, propLabel, deserializeFn);
}
export function deserializeObjectMapNullableOptional<T>(
  serializedVal: TJSONValue,
  propLabel    : string,
  deserializeFn: (serializedVal:TJSONValue, propLabel:string, key:string) => T
): {[key: string]: T} | null | undefined {
  if (serializedVal === null     ) return null;
  if (serializedVal === undefined) return undefined;
  return deserializeObjectMap(serializedVal, propLabel, deserializeFn);
}