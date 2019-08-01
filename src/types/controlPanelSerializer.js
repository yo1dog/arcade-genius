import * as controlDefUtil from '../dataAccess/controlDefUtil';
import createUUID          from '../helpers/createUUID';
import {controlTypeEnum}   from './controlDefEnums';
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


/**
 * @param {ICPConfiguration} cpConfig
 * @returns {TJSONValue}
 */
export function serializeCPConfiguration(cpConfig) {
  return {
    __version: 2,
    sControls      : cpConfig.controls      .map(serializeControl      ),
    sButtonClusters: cpConfig.buttonClusters.map(serializeButtonCluster),
    sControlSets   : cpConfig.controlSets   .map(serializeControlSet   )
  };
}

/**
 * @param {ICPControl} control
 * @returns {TJSONValue}
 */
export function serializeControl(control) {
  return {
    __version: 1,
    id                    : control.id,
    name                  : control.name,
    type                  : control.controlDef.type.serialize(),
    numButtons            : control.numButtons,
    isOnOppositeScreenSide: control.isOnOppositeScreenSide
  };
}

/**
 * @param {ICPButtonCluster} buttonCluster
 * @returns {TJSONValue}
 */
export function serializeButtonCluster(buttonCluster) {
  return {
    __version: 1,
    id                    : buttonCluster.id,
    name                  : buttonCluster.name,
    numButtons            : buttonCluster.numButtons,
    isOnOppositeScreenSide: buttonCluster.isOnOppositeScreenSide
  };
}

/**
 * @param {ICPControlSet} controlSet
 * @returns {TJSONValue}
 */
export function serializeControlSet(controlSet) {
  return {
    __version: 1,
    controlIds: controlSet.controls.map(control => control.id),
    buttonClusterId: controlSet.buttonCluster && controlSet.buttonCluster.id
  };
}









/**
 * @param {TJSONValue} sCPConfig
 * @param {string}     propLabel
 * @returns {ICPConfiguration}
 */
export function deserializeConfiguration(sCPConfig, propLabel) {
  const cpConfigJ = deserializeObject(sCPConfig, propLabel);
  
  const version = deserializeNumberOptional(cpConfigJ.__version, `${propLabel}.__version`);
  if (typeof version === 'undefined') {
    return deserializeConfigurationV1(cpConfigJ, `${propLabel}(v1)`);
  }
  if (version === 2) {
    return deserializeConfigurationV2(cpConfigJ, `${propLabel}(v2)`);
  }
  
  throw new Error(`${propLabel} invalid version`);
}



// ========================================
// v1
// ========================================

/**
 * @param {TJSONValue} sCPConfig
 * @param {string}     propLabel
 * @returns {ICPConfiguration}
 */
export function deserializeConfigurationV1(sCPConfig, propLabel) {
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

/**
 * @param {TJSONValue} sControl
 * @param {string}     propLabel
 * @returns {ICPControl}
 */
export function deserializeControlV1(sControl, propLabel) {
  const controlJ = deserializeObject(sControl, propLabel);
  
  return {
    id                     : createUUID(),
    name                   : deserializeString (controlJ.name,                   `${propLabel}.name`                  ),
    controlDef             : controlDefUtil.getByType(controlTypeEnum.deserialize(controlJ.type, `${propLabel}.type`)),
    numButtons             : deserializeNumber (controlJ.numButtons,             `${propLabel}.numButtons`            ),
    isOnOppositeScreenSide : deserializeBoolean(controlJ.isOnOppositeScreenSide, `${propLabel}.isOnOppositeScreenSide`),
  };
}

/**
 * @param {TJSONValue} sButtonCluster
 * @param {string}     propLabel
 * @returns {ICPButtonCluster}
 */
export function deserializeButtonClusterV1(sButtonCluster, propLabel) {
  const buttonClusterJ = deserializeObject(sButtonCluster, propLabel);
  
  return {
    id                    : deserializeString (buttonClusterJ.id,                     `${propLabel}.id`                    ),
    name                  : deserializeString (buttonClusterJ.name,                   `${propLabel}.name`                  ),
    numButtons            : deserializeNumber (buttonClusterJ.numButtons,             `${propLabel}.numButtons`            ),
    isOnOppositeScreenSide: deserializeBoolean(buttonClusterJ.isOnOppositeScreenSide, `${propLabel}.isOnOppositeScreenSide`),
  };
}

/**
 * @param {TJSONValue}         sControlSet
 * @param {ICPButtonCluster[]} buttonClusters
 * @param {string}             propLabel
 * @returns {ICPControlSet}
 */
export function deserializeControlSetV1(sControlSet, buttonClusters, propLabel) {
  const controlSetJ = deserializeObject(sControlSet, propLabel);
  
  const controls = deserializeArray(controlSetJ.sControls, `${propLabel}.sControls`, deserializeControlV1);
  const buttonClusterId = deserializeStringOptional(controlSetJ.buttonClusterId, `${propLabel}.buttonClusterId`);
  
  /** @type {ICPButtonCluster | undefined} */
  let setButtonCluster;
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

/**
 * @param {TJSONValue} sCPConfig
 * @param {string}     propLabel
 * @returns {ICPConfiguration}
 */
export function deserializeConfigurationV2(sCPConfig, propLabel) {
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

/**
 * @param {TJSONValue} sControl
 * @param {string}     propLabel
 * @returns {ICPControl}
 */
export function deserializeControlV2(sControl, propLabel) {
  const controlJ = deserializeObject(sControl, propLabel);
  
  return {
    id                     : deserializeString (controlJ.id,                     `${propLabel}.id`                    ),
    name                   : deserializeString (controlJ.name,                   `${propLabel}.name`                  ),
    controlDef             : controlDefUtil.getByType(controlTypeEnum.deserialize(controlJ.type, `${propLabel}.type`)),
    numButtons             : deserializeNumber (controlJ.numButtons,             `${propLabel}.numButtons`            ),
    isOnOppositeScreenSide : deserializeBoolean(controlJ.isOnOppositeScreenSide, `${propLabel}.isOnOppositeScreenSide`),
  };
}

/**
 * @param {TJSONValue}         sControlSet
 * @param {ICPControl[]}       controls
 * @param {ICPButtonCluster[]} buttonClusters
 * @param {string}             propLabel
 * @returns {ICPControlSet}
 */
export function deserializeControlSetV2(sControlSet, controls, buttonClusters, propLabel) {
  const controlSetJ = deserializeObject(sControlSet, propLabel);
  
  const setControls = deserializeArray(controlSetJ.controlIds, `${propLabel}.controlIds`, (serializedVal, propLabel) => {
    const controlId = deserializeString(serializedVal, propLabel);
    
    const control = controls.find(x => x.id === controlId);
    if (!control) throw new Error(`${propLabel} is not a valid Control ID`);
    
    return control;
  });
  
  const buttonClusterId = deserializeStringOptional(controlSetJ.buttonClusterId, `${propLabel}.buttonClusterId`);
  
  /** @type {ICPButtonCluster | undefined} */
  let setButtonCluster;
  if (typeof buttonClusterId === 'string') {
    setButtonCluster = buttonClusters.find(x => x.id === buttonClusterId);
    if (!setButtonCluster) throw new Error(`${propLabel}.buttonClusterId is not a valid Button Cluster ID`);
  }
  
  return {
    controls     : setControls,
    buttonCluster: setButtonCluster
  };
}