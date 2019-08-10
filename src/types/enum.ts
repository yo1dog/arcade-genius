import {TJSONValue} from './json';
import {
  deserializeString,
  deserializeNumber
} from './jsonSerializer';


export class EnumValue<R> {
  public readonly label: string;
  public readonly val  : R;
  
  public constructor(label: string, val: R) {
    this.label = label;
    this.val = val;
  }
  
  public isEqual(otherVal: R): boolean {
    return this.val === otherVal;
  }
  
  public toString(): string {
    return this.label;
  }
  public toJSON(): R {
    return this.val;
  }
  
  public getDescription(): string {
    return `${this.label} (${this.val})`;
  }
}

export class StringEnumValue extends EnumValue<string> {
  public serialize(): string {
    return this.val;
  }
}

export class NumberEnumValue extends EnumValue<number> {
  public serialize(): number {
    return this.val;
  }
}


export class Enum<R, V extends EnumValue<R>> {
  private readonly _map: {[key:string]: V};
  
  public constructor(map: {[key:string]: V}) {
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
  
  public values(): V[] {
    return Object.values(this._map);
  }
  
  public get(val: R): V | undefined {
    for (const label in this._map) {
      if (this._map[label].isEqual(val)) {
        return this._map[label];
      }
    }
  }
  
  public getByLabel(label: string): V | undefined {
    return this._map[label];
  }
}

export class StringEnum<V extends StringEnumValue> extends Enum<string, V> {
  public deserialize(serializedVal: TJSONValue, propLabel: string): V {
    const val = deserializeString(serializedVal, propLabel);
    const eVal = this.get(val);
    if (!eVal) throw new Error(`${propLabel} invalid ${this.constructor.name} value: '${val}'`);
    
    return eVal;
  }
}

export class NumberEnum<V extends NumberEnumValue> extends Enum<number, V> {
  public deserialize(serializedVal: TJSONValue, propLabel: string): V {
    const val = deserializeNumber(serializedVal, propLabel);
    const eVal = this.get(val);
    if (!eVal) throw new Error(`${propLabel} invalid ${this.constructor.name} value: ${val}`);
    
    return eVal;
  }
  
  public min(...eVals: V[]): V {
    let min = eVals[0];
    for (let i = 1; i < eVals.length; ++i) {
      if (eVals[i].val < min.val) {
        min = eVals[i];
      }
    }
    
    return min;
  }
  
  public max(...eVals: V[]): V {
    let max = eVals[0];
    for (let i = 1; i < eVals.length; ++i) {
      if (eVals[i].val > max.val) {
        max = eVals[i];
      }
    }
    
    return max;
  }
}

export function createStringEnum<
  V extends StringEnumValue,
  M extends {[key:string]: string}
>(
  ValClass: new (label: string, val: string) => V,
  valMap: M
): StringEnum<V> & {[P in keyof M]: V} {
  const map: {[key:string]: V} = {};
  for (const label in valMap) {
    map[label] = new ValClass(label, valMap[label]);
  }
  
  const _enum = Object.assign(
    new StringEnum(map),
    map as {[P in keyof M]: V}
  );
  return _enum; 
}

export function createNumberEnum<
  V extends NumberEnumValue,
  L extends string
>(
  ValClass: new (label: string, val: number) => V,
  items: (L | number)[]
): NumberEnum<V> & {[P in L]: V} {
  const map: {[key:string]: V} = {};
  
  let curVal = 0;
  for (const item of items) {
    if (typeof item === 'number') {
      curVal = item;
    }
    else {
      const label = item;
      map[label] = new ValClass(label, curVal);
      ++curVal;
    }
  }
  
  const _enum = Object.assign(
    new NumberEnum(map),
    map as {[P in L]: V}
  );
  return _enum;
}