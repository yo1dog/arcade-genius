import {TJSONValue} from '../types/json';
import {
  IControlsDatControlDef,
  IControlsDatControlDefOutput,
  IControlsDatControlDefFallback,
  controlsDatControlDefFallbackLevelEnum
} from '../types/data/controlsDatControlDef';
import {
  deserializeString,
  deserializeStringOptional,
  deserializeObject,
  deserializeArray,
  deserializeArrayOptional,
  deserializeObjectMapOptional,
  deserializeBooleanOptional,
  deserializeObjectMap
} from '../types/jsonSerializer';


let controlsDatControlDefMap: {[key: string]: IControlsDatControlDef} | null = null;

async function _init(): Promise<void> {
  const sControlDefMap:TJSONValue = ((await import(
    /* webpackChunkName: "controlDefMap" */
    'data/controlDefMap.json'
  )).default);
  
  controlsDatControlDefMap = deserialize(sControlDefMap);
}

let initPromise: Promise<void> | null = null;
export async function init(): Promise<void> {
  return (initPromise = initPromise || _init());
}

export function get(): {[key: string]: IControlsDatControlDef} {
  if (!controlsDatControlDefMap) throw new Error(`Attempting to access before initialized.`);
  return controlsDatControlDefMap;
}





function deserialize(sControlDefMap: TJSONValue): {[key: string]: IControlsDatControlDef} {
  return deserializeObjectMap(sControlDefMap, 'sControlDefMap', deserializeControlDef);
}

function deserializeControlDef(sControlDefMap: TJSONValue, propLabel: string): IControlsDatControlDef {
  const controlDefJ = deserializeObject(sControlDefMap, propLabel);
  return {
    type             : deserializeString           (controlDefJ.type,              `${propLabel}.type`       ),
    name             : deserializeString           (controlDefJ.name,              `${propLabel}.name`       ),
    description      : deserializeString           (controlDefJ.description,       `${propLabel}.description`),
    descriptors      : deserializeArrayOptional    (controlDefJ.descriptors,       `${propLabel}.descriptors`,       deserializeString         ),
    buttonDescriptors: deserializeArrayOptional    (controlDefJ.buttonDescriptors, `${propLabel}.buttonDescriptors`, deserializeString         ),
    outputMap        : deserializeObjectMapOptional(controlDefJ.outputMap,         `${propLabel}.outputMap`,         deserializeControlOutput  ),
    fallbacks        : deserializeArrayOptional    (controlDefJ.fallbacks,         `${propLabel}.fallbacks`,         deserializeControlFallback)
  };
}

function deserializeControlOutput(sOutput: TJSONValue, propLabel: string): IControlsDatControlDefOutput {
  const outputJ = deserializeObject(sOutput, propLabel);
  return {
    name                      : deserializeStringOptional (outputJ.name,                       `${propLabel}.name`                      ),
    isAnalog                  : deserializeBooleanOptional(outputJ.isAnalog,                   `${propLabel}.isAnalog`                  ),
    defaultMAMEInputPortSuffix: deserializeString         (outputJ.defaultMAMEInputPortSuffix, `${propLabel}.defaultMAMEInputPortSuffix`),
    defaultLabel              : deserializeStringOptional (outputJ.defaultLabel,               `${propLabel}.defaultLabel`              ),
    negDefaultLabel           : deserializeStringOptional (outputJ.negDefaultLabel,            `${propLabel}.negDefaultLabel`           ),
    posDefaultLabel           : deserializeStringOptional (outputJ.posDefaultLabel,            `${propLabel}.posDefaultLabel`           ),
  };
}

function deserializeControlFallback(sFallback: TJSONValue, propLabel: string): IControlsDatControlDefFallback {
  const fallbackJ = deserializeObject(sFallback, propLabel);
  return {
    controlType: deserializeString                                 (fallbackJ.controlType, `${propLabel}.controlType`),
    level      : controlsDatControlDefFallbackLevelEnum.deserialize(fallbackJ.level,       `${propLabel}.level`      ),
    outputMapping: deserializeObjectMapOptional(fallbackJ.outputMapping, `${propLabel}.outputMapping`, (serializedVal, propLabel) => {
      if (Array.isArray(serializedVal)) {
        return deserializeArray(serializedVal, propLabel, deserializeString);
      }
      return deserializeString(serializedVal, propLabel);
    }),
    buttonDescriptorMapping: deserializeObjectMapOptional(fallbackJ.buttonDescriptorMapping, `${propLabel}.buttonDescriptorMapping`, (serializedVal, propLabel) => {
      if (Array.isArray(serializedVal)) {
        return deserializeArray(serializedVal, propLabel, deserializeString);
      }
      return deserializeString(serializedVal, propLabel);
    }),
  };
}