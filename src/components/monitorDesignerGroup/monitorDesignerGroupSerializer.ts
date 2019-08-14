import {TJSONValue}                 from '../../types/json';
import {IMonitorDesignerGroupState} from './monitorDesignerGroup';
import {
  deserializeObject,
  deserializeNumber,
  deserializeArray,
  deserializeString
} from '../../types/jsonSerializer';


export function serializeState(state: IMonitorDesignerGroupState): TJSONValue {
  return {
    __version: 3,
    designerIds: state.designerIds
  };
}




export function deserializeState(sState: TJSONValue, propLabel: string): IMonitorDesignerGroupState {
  if (Array.isArray(sState)) {
    return deserializeStateV1(sState, `${propLabel}(v1)`);
  }
  
  const stateJ = deserializeObject(sState, propLabel);
  
  const version = deserializeNumber(stateJ.__version, `${propLabel}.__version`);
  switch (version) {
    case 2: return deserializeStateV2(stateJ, `${propLabel}(v${version})`);
    case 3: return deserializeStateV3(stateJ, `${propLabel}(v${version})`);
  }
  
  throw new Error(`${propLabel} invalid version`);
}



// ========================================
// v1
// ========================================

function deserializeStateV1(sState: TJSONValue, propLabel: string): IMonitorDesignerGroupState {
  const sDesignerIds = sState;
  return {
    designerIds: deserializeArray(sDesignerIds, propLabel, deserializeString)
  };
}



// ========================================
// v2
// ========================================

function deserializeStateV2(sState: TJSONValue, propLabel: string): IMonitorDesignerGroupState {
  const stateJ = deserializeObject(sState, propLabel);
  
  return {
    designerIds: deserializeArray(stateJ.configuratorIds, `${propLabel}.configuratorIds`, deserializeString)
  };
}



// ========================================
// v3
// ========================================

function deserializeStateV3(sState: TJSONValue, propLabel: string): IMonitorDesignerGroupState {
  const stateJ = deserializeObject(sState, propLabel);
  
  return {
    designerIds: deserializeArray(stateJ.designerIds, `${propLabel}.designerIds`, deserializeString)
  };
}