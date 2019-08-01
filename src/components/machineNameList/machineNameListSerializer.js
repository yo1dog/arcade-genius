import {TJSONValue} from '../../types/json';
import {IMachineNameListState} from './machineNameList';
import {
  deserializeObject,
  deserializeNumber,
  deserializeString
} from '../../types/jsonSerializer';


/**
 * @param {IMachineNameListState} state
 * @returns {TJSONValue}
 */
export function serializeState(state) {
  return {
    __version: 2,
    inputStr: state.inputStr
  };
}




/**
 * @param {TJSONValue} sState
 * @param {string}     propLabel
 * @returns {IMachineNameListState}
 */
export function deserializeState(sState, propLabel) {
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

/**
 * @param {TJSONValue} sState
 * @param {string}     propLabel
 * @returns {IMachineNameListState}
 */
export function deserializeStateV1(sState, propLabel) {
  const sInputStr = sState;
  return {
    inputStr: deserializeString(sInputStr, propLabel)
  };
}



// ========================================
// v2
// ========================================

/**
 * @param {TJSONValue} sState
 * @param {string}     propLabel
 * @returns {IMachineNameListState}
 */
export function deserializeStateV2(sState, propLabel) {
  const stateJ = deserializeObject(sState, propLabel);
  
  return {
    inputStr: deserializeString(stateJ.inputStr, `${propLabel}.inputStr`)
  };
}