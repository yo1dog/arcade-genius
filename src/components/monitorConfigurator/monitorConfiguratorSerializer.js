import {TJSONValue} from '../../types/json';
import {IMonitorConfiguratorState} from './monitorConfigurator';
import {
  serializeModelineConfig,
  deserializeModelineConfig
} from '../../types/modelineSerializer';
import {
  deserializeObject,
  deserializeNumberOptional
} from '../../types/jsonSerializer';


/**
 * @param {IMonitorConfiguratorState} state
 * @returns {TJSONValue}
 */
export function serializeState(state) {
  return {
    __version: 2,
    sModelineConfig: serializeModelineConfig(state.modelineConfig)
  };
}




/**
 * @param {TJSONValue} sState
 * @param {string}     propLabel
 * @returns {IMonitorConfiguratorState}
 */
export function deserializeState(sState, propLabel) {
  const stateJ = deserializeObject(sState, propLabel);
  
  const version = deserializeNumberOptional(stateJ.__version, `${propLabel}.__version`);
  if (typeof version === 'undefined') {
    return deserializeStateV1(stateJ, `${propLabel}(v1)`);
  }
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
 * @returns {IMonitorConfiguratorState}
 */
export function deserializeStateV1(sState, propLabel) {
  const sModelineConfig = sState;
  return {
    modelineConfig: deserializeModelineConfig(sModelineConfig, propLabel)
  };
}



// ========================================
// v2
// ========================================

/**
 * @param {TJSONValue} sState
 * @param {string}     propLabel
 * @returns {IMonitorConfiguratorState}
 */
export function deserializeStateV2(sState, propLabel) {
  const stateJ = deserializeObject(sState, propLabel);
  
  return {
    modelineConfig: deserializeModelineConfig(stateJ.sModelineConfig, `${propLabel}.sModelineConfig`)
  };
}