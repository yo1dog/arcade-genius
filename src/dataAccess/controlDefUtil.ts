import {TJSONValue} from '../types/json';
import {
  IControlDef,
  IControlOutput,
  IControlFallback,
  ControlType,
  controlTypeEnum,
  controlFallbackLevelEnum
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


let controlDefMap: Map<ControlType, IControlDef> | null = null;

async function _init(): Promise<void> {
  const sControlDefMap:TJSONValue = ((await import(
    /* webpackChunkName: "controlDefMap" */
    'data/controlDefMap.json'
  )).default);
  
  controlDefMap = deserialize(sControlDefMap);
}

let initPromise: Promise<void> | null = null;
export async function init(): Promise<void> {
  return (initPromise = initPromise || _init());
}

export function getMap(): Map<ControlType, IControlDef> {
  if (!controlDefMap) throw new Error(`Attempting to access before initialized.`);
  
  return controlDefMap;
}

export function getByType(type: ControlType): IControlDef {
  if (!controlDefMap) throw new Error(`Attempting to access before initialized.`);
  
  const controlDef = controlDefMap.get(type);
  if (!controlDef) {
    throw new Error(`Invalid control type (this should not be possible): ${type}`);
  }
  
  return controlDef;
}





function deserialize(sControlDefMap: TJSONValue): Map<ControlType, IControlDef> {
  const controlDefMap = new Map<ControlType, IControlDef>();
  const controlDefMapJ = deserializeObject(sControlDefMap, 'sControlDefMap');
  
  for (const key in controlDefMapJ) {
    const controlDef = deserializeControlDef(controlDefMapJ[key], `sControlDefMap['${key}']`);
    controlDefMap.set(controlDef.type, controlDef);
  }
  
  return controlDefMap;
}

function deserializeControlDef(sControlDefMap: TJSONValue, propLabel: string): IControlDef {
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

function deserializeControlOutput(sOutput: TJSONValue, propLabel: string): IControlOutput {
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

function deserializeControlFallback(sFallback: TJSONValue, propLabel: string): IControlFallback {
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