/* eslint-disable @typescript-eslint/no-explicit-any */
import {EnumValue} from '../types/enum';


export default function stringifyEnums(val: any): any {
  if (val instanceof EnumValue) {
    return val.toString();
  }
  
  if (typeof val === 'object') {
    if (val === null) {
      return null;
    }
    
    if (Array.isArray(val)) {
      return val.map(stringifyEnums);
    }
    
    const obj: any = {};
    for (const key in val) {
      obj[key] = stringifyEnums(val[key]);
    }
    
    return obj;
  }
  
  return val;
}