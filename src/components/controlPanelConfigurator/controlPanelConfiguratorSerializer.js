import {TJSONValue} from '../../types/json';
import {ICPConfiguratorState} from './controlPanelConfigurator';
import {
  serializeCPConfiguration,
  deserializeConfiguration
} from '../../types/controlPanelSerializer';
import {
  deserializeObject,
  deserializeNumberOptional
} from '../../types/jsonSerializer';


/**
 * @param {ICPConfiguratorState} state
 * @returns {TJSONValue}
 */
export function serializeState(state) {
  return {
    __version: 2,
    sCPConfig: serializeCPConfiguration(state.cpConfig)
  };
}




/**
 * @param {TJSONValue} sState
 * @param {string}     propLabel
 * @returns {ICPConfiguratorState}
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
 * @returns {ICPConfiguratorState}
 */
export function deserializeStateV1(sState, propLabel) {
  const sCPConfig = sState;
  return {
    cpConfig: deserializeConfiguration(sCPConfig, propLabel)
  };
}



// ========================================
// v2
// ========================================

/**
 * @param {TJSONValue} sState
 * @param {string}     propLabel
 * @returns {ICPConfiguratorState}
 */
export function deserializeStateV2(sState, propLabel) {
  const stateJ = deserializeObject(sState, propLabel);
  
  return {
    cpConfig: deserializeConfiguration(stateJ.sCPConfig, `${propLabel}.sCPConfig`)
  };
}