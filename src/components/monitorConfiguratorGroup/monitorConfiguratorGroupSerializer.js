import {TJSONValue} from '../../types/json';
import {IMonitorConfiguratorGroupState} from './monitorConfiguratorGroup';
import {
  deserializeObject,
  deserializeNumber,
  deserializeArray,
  deserializeString
} from '../../types/jsonSerializer';


/**
 * @param {IMonitorConfiguratorGroupState} state
 * @returns {TJSONValue}
 */
export function serializeState(state) {
  return {
    __version: 2,
    configuratorIds: state.configuratorIds
  };
}




/**
 * @param {TJSONValue} sState
 * @param {string}     propLabel
 * @returns {IMonitorConfiguratorGroupState}
 */
export function deserializeState(sState, propLabel) {
  if (Array.isArray(sState)) {
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
 * @returns {IMonitorConfiguratorGroupState}
 */
export function deserializeStateV1(sState, propLabel) {
  const sConfiguratorIds = sState;
  return {
    configuratorIds: deserializeArray(sConfiguratorIds, propLabel, deserializeString)
  };
}



// ========================================
// v2
// ========================================

/**
 * @param {TJSONValue} sState
 * @param {string}     propLabel
 * @returns {IMonitorConfiguratorGroupState}
 */
export function deserializeStateV2(sState, propLabel) {
  const stateJ = deserializeObject(sState, propLabel);
  
  return {
    configuratorIds: deserializeArray(stateJ.configuratorIds, `${propLabel}.configuratorIds`, deserializeString)
  };
}