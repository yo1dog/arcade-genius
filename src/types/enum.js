import {TJSONValue} from './json';
import {
  deserializeString,
  deserializeNumber
} from './jsonSerializer';


/**
 * @template R
 */
export class EnumValue {
  /**
   * @param {string} label
   * @param {R} val
   */
  constructor(label, val) {
    this.label = label;
    this.val = val;
  }
  
  /**
   * @param {R} otherVal
   * @returns {boolean}
   */
  isEqual(otherVal) {
    return this.val === otherVal;
  }
  
  toString() {
    return this.label;
  }
  toJSON() {
    return this.val;
  }
  
  getDescription() {
    return `${this.label} (${this.val})`;
  }
}

/** @extends EnumValue<string> */
export class StringEnumValue extends EnumValue {
  serialize() {
    return this.val;
  }
}

/** @extends EnumValue<number> */
export class NumberEnumValue extends EnumValue {
  serialize() {
    return this.val;
  }
}


/**
 * @template R
 * @template {EnumValue<R>} V
 */
export class Enum {
  /** @param {{[key:string]: V}} map */
  constructor(map) {
    this._map = map;
    
    // check labels
    for (const key in this._map) {
      const eVal = this._map[key];
      if (eVal.label !== key) {
        throw new Error(`Enum value has label '${eVal.label}' but is under key '${key}': ${eVal.getDescription()}`);
      }
    }
    
    // check for duplicate values
    const eVals = Object.values(this._map);
    for (let i = 0; i < eVals.length - 1; ++i) {
      for (let j = i + 1; j < eVals.length; ++j) {
        if (eVals[i].isEqual(eVals[j].val)) {
          throw new Error(`Duplicate enum values: ${eVals[i].getDescription()} ${eVals[j].getDescription()}`);
        }
      }
    }
  }
  
  /**
   * @param {V} eVal 
   * @returns {string}
   */
  getLabel(eVal) {
    for (const label in this._map) {
      if (this._map[label].isEqual(eVal.val)) {
        return label;
      }
    }
    throw new Error(`Invalid value. This should not be possible: ${eVal.getDescription()}`);
  }
  
  /**
   * @param {R} val
   * @returns {V | undefined}
   */
  get(val) {
    for (const label in this._map) {
      if (this._map[label].isEqual(val)) {
        return this._map[label];
      }
    }
  }
  
  /**
   * @param {string} label
   * @returns {V | undefined}
   */
  getByLabel(label) {
    return this._map[label];
  }
}

/**
 * @template {StringEnumValue} V
 * @extends Enum<string, V>
 */
export class StringEnum extends Enum {
  /**
   * @param {TJSONValue} serializedVal
   * @param {string}     propLabel
   * @returns {V}
   */
  deserialize(serializedVal, propLabel) {
    const val = deserializeString(serializedVal, propLabel);
    const eVal = this.get(val);
    if (!eVal) throw new Error(`${propLabel} invalid ${this.constructor.name} value: '${val}'`);
    
    return eVal;
  }
}

/**
 * @template {NumberEnumValue} V
 * @extends Enum<number, V>
 */
export class NumberEnum extends Enum {
  /**
   * @param {TJSONValue} serializedVal
   * @param {string}     propLabel
   * @returns {V}
   */
  deserialize(serializedVal, propLabel) {
    const val = deserializeNumber(serializedVal, propLabel);
    const eVal = this.get(val);
    if (!eVal) throw new Error(`${propLabel} invalid ${this.constructor.name} value: ${val}`);
    
    return eVal;
  }
  
  /**
   * @param  {...V} eVals 
   * @returns {V}
   */
  min(...eVals) {
    let min = eVals[0];
    for (let i = 1; i < eVals.length; ++i) {
      if (eVals[i].val < min.val) {
        min = eVals[i];
      }
    }
    
    return min;
  }
  
  /**
   * @param  {...V} eVals 
   * @returns {V}
   */
  max(...eVals) {
    let max = eVals[0];
    for (let i = 1; i < eVals.length; ++i) {
      if (eVals[i].val > max.val) {
        max = eVals[i];
      }
    }
    
    return max;
  }
}

/**
 * @template {StringEnumValue} V
 * @template {{[key:string]: string}} M
 * @param {{new (label:string, val:string): V}} valConstructor
 * @param {M} valMap
 * @returns {StringEnum<V> & {[P in keyof M]: V}}
 */
export function createStringEnum(valConstructor, valMap) {
  /** @type {{[key:string]: V}} */
  const map = {};
  for (const label in valMap) {
    map[label] = new valConstructor(label, valMap[label]);
  }
  
  const _enum = new StringEnum(map);
  Object.assign(_enum, map);
  
  // @ts-ignore
  return _enum;
}

/**
 * @template {NumberEnumValue} V
 * @template {string} L
 * @param {{new (label:string, val:number): V}} valConstructor
 * @param {Array<L | number>} items
 * @returns {NumberEnum<V> & {[P in L]: V}}
 */
export function createNumberEnum(valConstructor, items) {
  /** @type {{[key:string]: V}} */
  const map = {};
  
  let curVal = 0;
  for (const item of items) {
    if (typeof item === 'number') {
      curVal = item;
    }
    else {
      const label = item;
      map[label] = new valConstructor(label, curVal);
      ++curVal;
    }
  }
  
  const _enum = new NumberEnum(map);
  Object.assign(_enum, map);
  
  // @ts-ignore
  return _enum;
}