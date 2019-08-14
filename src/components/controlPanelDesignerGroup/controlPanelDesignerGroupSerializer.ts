import {TJSONValue}            from '../../types/json';
import {ICPDesignerGroupState} from './controlPanelDesignerGroup';
import {
  deserializeObject,
  deserializeNumber,
  deserializeArray,
  deserializeString
} from '../../types/jsonSerializer';


export function serializeState(state: ICPDesignerGroupState): TJSONValue {
  return {
    __version: 2,
    designerIds: state.designerIds
  };
}




export function deserializeState(sState: TJSONValue, propLabel: string): ICPDesignerGroupState {
  const stateJ = deserializeObject(sState, propLabel);
  
  const version = deserializeNumber(stateJ.__version, `${propLabel}.__version`);
  switch (version) {
    case 1: return deserializeStateV1(stateJ, `${propLabel}(v${version})`);
    case 2: return deserializeStateV2(stateJ, `${propLabel}(v${version})`);
  }
  
  throw new Error(`${propLabel} invalid version`);
}



// ========================================
// v1
// ========================================

export function deserializeStateV1(sState: TJSONValue, propLabel: string): ICPDesignerGroupState {
  const stateJ = deserializeObject(sState, propLabel);
  
  return {
    designerIds: deserializeArray(stateJ.configuratorIds, `${propLabel}.configuratorIds`, deserializeString)
  };
}



// ========================================
// v2
// ========================================

export function deserializeStateV2(sState: TJSONValue, propLabel: string): ICPDesignerGroupState {
  const stateJ = deserializeObject(sState, propLabel);
  
  return {
    designerIds: deserializeArray(stateJ.designerIds, `${propLabel}.designerIds`, deserializeString)
  };
}