import {TJSONValue} from '../../types/json';
import {ICPConfiguratorGroupState} from './controlPanelConfiguratorGroup';
import {
  deserializeObject,
  deserializeNumber,
  deserializeArray,
  deserializeString
} from '../../types/jsonSerializer';


export function serializeState(state: ICPConfiguratorGroupState): TJSONValue {
  return {
    __version: 1,
    configuratorIds: state.configuratorIds
  };
}




export function deserializeState(sState: TJSONValue, propLabel: string): ICPConfiguratorGroupState {
  const stateJ = deserializeObject(sState, propLabel);
  
  const version = deserializeNumber(stateJ.__version, `${propLabel}.__version`);
  switch (version) {
    case 1: return deserializeStateV1(stateJ, `${propLabel}(v${version})`);
  }
  
  throw new Error(`${propLabel} invalid version`);
}



// ========================================
// v1
// ========================================

export function deserializeStateV1(sState: TJSONValue, propLabel: string): ICPConfiguratorGroupState {
  const stateJ = deserializeObject(sState, propLabel);
  
  return {
    configuratorIds: deserializeArray(stateJ.configuratorIds, `${propLabel}.configuratorIds`, deserializeString)
  };
}