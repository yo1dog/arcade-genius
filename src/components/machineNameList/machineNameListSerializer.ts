import {TJSONValue} from '../../types/json';
import {IMachineNameListState} from './machineNameList';
import {
  deserializeObject,
  deserializeNumber,
  deserializeString
} from '../../types/jsonSerializer';


export function serializeState(state: IMachineNameListState): TJSONValue {
  return {
    __version: 2,
    inputStr: state.inputStr
  };
}




export function deserializeState(sState: TJSONValue, propLabel: string): IMachineNameListState {
  if (typeof sState === 'string') {
    return deserializeStateV1(sState, `${propLabel}(v1)`);
  }
  
  const stateJ = deserializeObject(sState, propLabel);
  
  const version = deserializeNumber(stateJ.__version, `${propLabel}.__version`);
  if (version === 2) {
    return deserializeStateV2(stateJ, `${propLabel}(v2)`);
  }
  
  throw new Error(`${propLabel} invalid version`);
}



// ========================================
// v1
// ========================================

export function deserializeStateV1(sState: TJSONValue, propLabel: string): IMachineNameListState {
  const sInputStr = sState;
  return {
    inputStr: deserializeString(sInputStr, propLabel)
  };
}



// ========================================
// v2
// ========================================

export function deserializeStateV2(sState: TJSONValue, propLabel: string): IMachineNameListState {
  const stateJ = deserializeObject(sState, propLabel);
  
  return {
    inputStr: deserializeString(stateJ.inputStr, `${propLabel}.inputStr`)
  };
}