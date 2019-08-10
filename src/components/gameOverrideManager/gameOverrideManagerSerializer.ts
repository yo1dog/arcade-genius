import {TJSONValue} from '../../types/json';
import {IGameOverrideManagerState} from './gameOverrideManager';
import {
  deserializeObject,
  deserializeNumber
} from '../../types/jsonSerializer';


export function serializeState(state: IGameOverrideManagerState): TJSONValue {
  return {
    __version: 1
  };
}




export function deserializeState(sState: TJSONValue, propLabel: string): IGameOverrideManagerState {
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

export function deserializeStateV1(sState: TJSONValue, propLabel: string): IGameOverrideManagerState {
  const stateJ = deserializeObject(sState, propLabel);
  return {};
}