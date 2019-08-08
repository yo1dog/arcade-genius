import * as controlDefUtil from '../dataAccess/controlDefUtil';
import {controlTypeEnum}   from './controlDef';
import createUUID          from 'lib/get_uuid.js';
import {
  ICPConfiguration,
  ICPButtonCluster,
  ICPControl,
  ICPControlSet
} from './controlPanel';
import {
  TJSONValue
} from './json';
import {
  deserializeString,
  deserializeStringOptional,
  deserializeNumber,
  deserializeNumberOptional,
  deserializeBoolean,
  deserializeObject,
  deserializeArray
} from './jsonSerializer';


export function serializeCPConfiguration(cpConfig: ICPConfiguration): TJSONValue {
  return {
    __version: 2,
    sControls      : cpConfig.controls      .map(serializeControl      ),
    sButtonClusters: cpConfig.buttonClusters.map(serializeButtonCluster),
    sControlSets   : cpConfig.controlSets   .map(serializeControlSet   )
  };
}

export function serializeControl(control: ICPControl): TJSONValue {
  return {
    __version: 2,
    id                    : control.id,
    name                  : control.name,
    type                  : control.controlDef.type.serialize(),
    numButtons            : control.numButtons,
    isOnOppositeScreenSide: control.isOnOppositeScreenSide
  };
}

export function serializeButtonCluster(buttonCluster: ICPButtonCluster): TJSONValue {
  return {
    __version: 1,
    id                    : buttonCluster.id,
    name                  : buttonCluster.name,
    numButtons            : buttonCluster.numButtons,
    isOnOppositeScreenSide: buttonCluster.isOnOppositeScreenSide
  };
}

export function serializeControlSet(controlSet: ICPControlSet): TJSONValue {
  return {
    __version: 2,
    controlIds: controlSet.controls.map(control => control.id),
    buttonClusterId: controlSet.buttonCluster && controlSet.buttonCluster.id
  };
}









export function deserializeConfiguration(sCPConfig: TJSONValue, propLabel: string): ICPConfiguration {
  const cpConfigJ = deserializeObject(sCPConfig, propLabel);
  
  let version = deserializeNumberOptional(cpConfigJ.__version, `${propLabel}.__version`);
  if (typeof version === 'undefined') {
    version = 1;
  }
  switch (version) {
    case 1: return deserializeConfigurationV1(cpConfigJ, `${propLabel}(v1)`);
    case 2: return deserializeConfigurationV2(cpConfigJ, `${propLabel}(v2)`);
  }
  
  throw new Error(`${propLabel} invalid version`);
}



// ========================================
// v1
// ========================================

export function deserializeConfigurationV1(sCPConfig: TJSONValue, propLabel: string): ICPConfiguration {
  const cpConfigJ = deserializeObject(sCPConfig, propLabel);
  
  const buttonClusters = deserializeArray(cpConfigJ.buttonClusters, `${propLabel}.sButtonClusters`, deserializeButtonClusterV1);
  const controlSets    = deserializeArray(
    cpConfigJ.sControlSets,
    `${propLabel}.sControlSets`,
    (sControlSet, propLabel) => deserializeControlSetV1(sControlSet, buttonClusters, propLabel)
  );
  
  const controls = controlSets.flatMap(x => x.controls);
  
  return {
    controls,
    buttonClusters,
    controlSets
  };
}

export function deserializeControlV1(sControl: TJSONValue, propLabel: string): ICPControl {
  const controlJ = deserializeObject(sControl, propLabel);
  
  return {
    id                     : createUUID(),
    name                   : deserializeString (controlJ.name,                   `${propLabel}.name`                  ),
    controlDef             : controlDefUtil.getByType(controlTypeEnum.deserialize(controlJ.type, `${propLabel}.type`)),
    numButtons             : deserializeNumber (controlJ.numButtons,             `${propLabel}.numButtons`            ),
    isOnOppositeScreenSide : deserializeBoolean(controlJ.isOnOppositeScreenSide, `${propLabel}.isOnOppositeScreenSide`),
  };
}

export function deserializeButtonClusterV1(sButtonCluster: TJSONValue, propLabel: string): ICPButtonCluster {
  const buttonClusterJ = deserializeObject(sButtonCluster, propLabel);
  
  return {
    id                    : deserializeString (buttonClusterJ.id,                     `${propLabel}.id`                    ),
    name                  : deserializeString (buttonClusterJ.name,                   `${propLabel}.name`                  ),
    numButtons            : deserializeNumber (buttonClusterJ.numButtons,             `${propLabel}.numButtons`            ),
    isOnOppositeScreenSide: deserializeBoolean(buttonClusterJ.isOnOppositeScreenSide, `${propLabel}.isOnOppositeScreenSide`),
  };
}

export function deserializeControlSetV1(
  sControlSet   : TJSONValue,
  buttonClusters: ICPButtonCluster[],
  propLabel     : string
): ICPControlSet {
  const controlSetJ = deserializeObject(sControlSet, propLabel);
  
  const controls = deserializeArray(controlSetJ.sControls, `${propLabel}.sControls`, deserializeControlV1);
  const buttonClusterId = deserializeStringOptional(controlSetJ.buttonClusterId, `${propLabel}.buttonClusterId`);
  
  let setButtonCluster: ICPButtonCluster | undefined;
  if (typeof buttonClusterId === 'string') {
    setButtonCluster = buttonClusters.find(x => x.id === buttonClusterId);
    if (!setButtonCluster) throw new Error(`${propLabel}.buttonClusterId is not a valid Button Cluster ID`);
  }
  
  return {
    controls,
    buttonCluster: setButtonCluster
  };
}



// ========================================
// v2
// ========================================

export function deserializeConfigurationV2(sCPConfig: TJSONValue, propLabel: string): ICPConfiguration {
  const cpConfigJ = deserializeObject(sCPConfig, propLabel);
  
  const controls       = deserializeArray(cpConfigJ.sControls,       `${propLabel}.sControls`,       deserializeControlV2      );
  const buttonClusters = deserializeArray(cpConfigJ.sButtonClusters, `${propLabel}.sButtonClusters`, deserializeButtonClusterV1);
  const controlSets    = deserializeArray(
    cpConfigJ.sControlSets,
    `${propLabel}.sControlSets`,
    (sControlSet, propLabel) => deserializeControlSetV2(sControlSet, controls, buttonClusters, propLabel)
  );
  
  return {
    controls,
    buttonClusters,
    controlSets
  };
}

export function deserializeControlV2(sControl: TJSONValue, propLabel: string): ICPControl {
  const controlJ = deserializeObject(sControl, propLabel);
  
  return {
    id                     : deserializeString (controlJ.id,                     `${propLabel}.id`                    ),
    name                   : deserializeString (controlJ.name,                   `${propLabel}.name`                  ),
    controlDef             : controlDefUtil.getByType(controlTypeEnum.deserialize(controlJ.type, `${propLabel}.type`)),
    numButtons             : deserializeNumber (controlJ.numButtons,             `${propLabel}.numButtons`            ),
    isOnOppositeScreenSide : deserializeBoolean(controlJ.isOnOppositeScreenSide, `${propLabel}.isOnOppositeScreenSide`),
  };
}

export function deserializeControlSetV2(
  sControlSet   : TJSONValue,
  controls      : ICPControl[],
  buttonClusters: ICPButtonCluster[],
  propLabel     : string
): ICPControlSet {
  const controlSetJ = deserializeObject(sControlSet, propLabel);
  
  const setControls = deserializeArray(controlSetJ.controlIds, `${propLabel}.controlIds`, (serializedVal, propLabel) => {
    const controlId = deserializeString(serializedVal, propLabel);
    
    const control = controls.find(x => x.id === controlId);
    if (!control) throw new Error(`${propLabel} is not a valid Control ID`);
    
    return control;
  });
  
  const buttonClusterId = deserializeStringOptional(controlSetJ.buttonClusterId, `${propLabel}.buttonClusterId`);
  
  let setButtonCluster: ICPButtonCluster | undefined;
  if (typeof buttonClusterId === 'string') {
    setButtonCluster = buttonClusters.find(x => x.id === buttonClusterId);
    if (!setButtonCluster) throw new Error(`${propLabel}.buttonClusterId is not a valid Button Cluster ID`);
  }
  
  return {
    controls     : setControls,
    buttonCluster: setButtonCluster
  };
}