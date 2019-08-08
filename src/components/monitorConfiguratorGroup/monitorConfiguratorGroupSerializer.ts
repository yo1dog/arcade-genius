import {TJSONValue} from '../../types/json';
import {IMonitorConfiguratorGroupState} from './monitorConfiguratorGroup';
import {
  deserializeObject,
  deserializeNumber,
  deserializeArray,
  deserializeString
} from '../../types/jsonSerializer';


export function serializeState(state: IMonitorConfiguratorGroupState): TJSONValue {
  return {
    __version: 2,
    configuratorIds: state.configuratorIds
  };
}




export function deserializeState(sState: TJSONValue, propLabel: string): IMonitorConfiguratorGroupState {
  if (Array.isArray(sState)) {
    return deserializeStateV1(sState, `${propLabel}(v1)`);
  }
  
  const stateJ = deserializeObject(sState, propLabel);
  
  const version = deserializeNumber(stateJ.__version, `${propLabel}.__version`);
  switch (version) {
    case 2: return deserializeStateV2(stateJ, `${propLabel}(v${version})`);
  }
  
  throw new Error(`${propLabel} invalid version`);
}



// ========================================
// v1
// ========================================

export function deserializeStateV1(sState: TJSONValue, propLabel: string): IMonitorConfiguratorGroupState {
  const sConfiguratorIds = sState;
  return {
    configuratorIds: deserializeArray(sConfiguratorIds, propLabel, deserializeString)
  };
}



// ========================================
// v2
// ========================================

export function deserializeStateV2(sState: TJSONValue, propLabel: string): IMonitorConfiguratorGroupState {
  const stateJ = deserializeObject(sState, propLabel);
  
  return {
    configuratorIds: deserializeArray(stateJ.configuratorIds, `${propLabel}.configuratorIds`, deserializeString)
  };
}