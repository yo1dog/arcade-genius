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


export function serializeState(state: IMonitorConfiguratorState): TJSONValue {
  return {
    __version: 2,
    sModelineConfig: serializeModelineConfig(state.modelineConfig)
  };
}




export function deserializeState(sState: TJSONValue, propLabel: string): IMonitorConfiguratorState {
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

export function deserializeStateV1(sState: TJSONValue, propLabel: string): IMonitorConfiguratorState {
  const sModelineConfig = sState;
  return {
    modelineConfig: deserializeModelineConfig(sModelineConfig, propLabel)
  };
}



// ========================================
// v2
// ========================================

export function deserializeStateV2(sState: TJSONValue, propLabel: string): IMonitorConfiguratorState {
  const stateJ = deserializeObject(sState, propLabel);
  
  return {
    modelineConfig: deserializeModelineConfig(stateJ.sModelineConfig, `${propLabel}.sModelineConfig`)
  };
}