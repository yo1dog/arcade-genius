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


export function serializeState(state: ICPConfiguratorState): TJSONValue {
  return {
    __version: 2,
    sCPConfig: serializeCPConfiguration(state.cpConfig)
  };
}




export function deserializeState(sState: TJSONValue, propLabel: string): ICPConfiguratorState {
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

export function deserializeStateV1(sState: TJSONValue, propLabel: string): ICPConfiguratorState {
  const sCPConfig = sState;
  return {
    cpConfig: deserializeConfiguration(sCPConfig, propLabel)
  };
}



// ========================================
// v2
// ========================================

export function deserializeStateV2(sState: TJSONValue, propLabel: string): ICPConfiguratorState {
  const stateJ = deserializeObject(sState, propLabel);
  
  return {
    cpConfig: deserializeConfiguration(stateJ.sCPConfig, `${propLabel}.sCPConfig`)
  };
}