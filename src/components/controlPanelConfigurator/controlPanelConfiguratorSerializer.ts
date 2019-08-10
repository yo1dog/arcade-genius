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
  
  let version = deserializeNumberOptional(stateJ.__version, `${propLabel}.__version`);
  if (version === undefined) {
    version = 1;
  }
  
  switch (version) {
    case 1: return deserializeStateV1(stateJ, `${propLabel}(v${version})`);
    case 2: return deserializeStateV2(stateJ, `${propLabel}(v${version})`);
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