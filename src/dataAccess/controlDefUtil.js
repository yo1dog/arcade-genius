import {TJSONValue} from '../types/json';
import {
  IControlDef,
  IControlOutput,
  IControlFallback
} from '../types/controlDef';
import {
  deserializeString,
  deserializeStringOptional,
  deserializeObject,
  deserializeArray,
  deserializeArrayOptional,
  deserializeMapOptional,
  deserializeBooleanOptional
} from '../types/jsonSerializer';
import {
  ControlType,
  controlTypeEnum,
  controlFallbackLevelEnum
} from '../types/controlDefEnums';


/** @type {Map<ControlType, IControlDef> | null} */
let controlDefMap = null;

async function _init() {
  /** @type {TJSONValue} */
  const sControlDefMap = ((await import(
    /* webpackChunkName: "controlDefMap" */
    '../../data/controlDefMap.json' + '' // avoid loading large types
  )).default);
  
  controlDefMap = deserialize(sControlDefMap);
}

/** @type {Promise<void> | null} */
let initPromise = null;
export async function init() {
  return (initPromise = initPromise || _init());
}

export function getMap() {
  if (!controlDefMap) throw new Error(`Attempting to access before initialized.`);
  
  return controlDefMap;
}

/**
 * @param {ControlType} type 
 * @returns {IControlDef}
 */
export function getByType(type) {
  if (!controlDefMap) throw new Error(`Attempting to access before initialized.`);
  
  const controlDef = controlDefMap.get(type);
  if (!controlDef) {
    throw new Error(`Invalid control type (this should not be possible): ${type}`);
  }
  
  return controlDef;
}





/**
 * @param {TJSONValue} sControlDefMap
 * @returns {Map<ControlType, IControlDef>}
 */
function deserialize(sControlDefMap) {
  /** @type {Map<ControlType, IControlDef>} */
  const controlDefMap = new Map();
  const controlDefMapJ = deserializeObject(sControlDefMap, 'sControlDefMap');
  
  for (const key in controlDefMapJ) {
    const controlDef = deserializeControlDef(controlDefMapJ[key], `sControlDefMap['${key}']`);
    controlDefMap.set(controlDef.type, controlDef);
  }
  
  return controlDefMap;
}

/**
 * @param {TJSONValue} sControlDefMap
 * @param {string}     propLabel
 * @returns {IControlDef}
 */
function deserializeControlDef(sControlDefMap, propLabel) {
  const controlDefJ = deserializeObject(sControlDefMap, propLabel);
  return {
    type             : controlTypeEnum.deserialize(controlDefJ.type,              `${propLabel}.type`       ),
    name             : deserializeString          (controlDefJ.name,              `${propLabel}.name`       ),
    description      : deserializeString          (controlDefJ.description,       `${propLabel}.description`),
    descriptors      : deserializeArrayOptional   (controlDefJ.descriptors,       `${propLabel}.descriptors`,       deserializeString         ) || [],
    buttonDescriptors: deserializeArrayOptional   (controlDefJ.buttonDescriptors, `${propLabel}.buttonDescriptors`, deserializeString         ) || [],
    outputMap        : deserializeMapOptional     (controlDefJ.outputMap,         `${propLabel}.outputMap`,         deserializeControlOutput  ) || new Map(),
    fallbacks        : deserializeArrayOptional   (controlDefJ.fallbacks,         `${propLabel}.fallbacks`,         deserializeControlFallback) || []
  };
}

/**
 * @param {TJSONValue} sOutput
 * @param {string}     propLabel
 * @returns {IControlOutput}
 */
function deserializeControlOutput(sOutput, propLabel) {
  const outputJ = deserializeObject(sOutput, propLabel);
  return {
    name                      : deserializeStringOptional (outputJ.name,                       `${propLabel}.name`                      ),
    isAnalog                  : deserializeBooleanOptional(outputJ.isAnalog,                   `${propLabel}.isAnalog`                  ) || false,
    defaultMAMEInputPortSuffix: deserializeString         (outputJ.defaultMAMEInputPortSuffix, `${propLabel}.defaultMAMEInputPortSuffix`),
    defaultLabel              : deserializeStringOptional (outputJ.defaultLabel,               `${propLabel}.defaultLabel`              ),
    negDefaultLabel           : deserializeStringOptional (outputJ.negDefaultLabel,            `${propLabel}.negDefaultLabel`           ),
    posDefaultLabel           : deserializeStringOptional (outputJ.posDefaultLabel,            `${propLabel}.posDefaultLabel`           ),
  };
}

/**
 * @param {TJSONValue} sFallback
 * @param {string}     propLabel
 * @returns {IControlFallback}
 */
function deserializeControlFallback(sFallback, propLabel) {
  const fallbackJ = deserializeObject(sFallback, propLabel);
  return {
    controlType : controlTypeEnum         .deserialize(fallbackJ.controlType, `${propLabel}.controlType`),
    level       : controlFallbackLevelEnum.deserialize(fallbackJ.level,       `${propLabel}.level`      ),
    outputMapping: deserializeMapOptional(fallbackJ.outputMapping, `${propLabel}.outputMapping`, (serializedVal, propLabel) => {
      if (Array.isArray(serializedVal)) {
        return deserializeArray(serializedVal, propLabel, deserializeString);
      }
      return deserializeString(serializedVal, propLabel);
    }) || new Map(),
    buttonDescriptorMapping: deserializeMapOptional(fallbackJ.buttonDescriptorMapping, `${propLabel}.buttonDescriptorMapping`, (serializedVal, propLabel) => {
      if (Array.isArray(serializedVal)) {
        return deserializeArray(serializedVal, propLabel, deserializeString);
      }
      return deserializeString(serializedVal, propLabel);
    }) || new Map(),
  };
}