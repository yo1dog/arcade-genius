import * as controlsDatControlDefUtil from './data/controlsDatControlDefUtil';
import {
  IControlDef,
  IControlDefOutput,
  IControlDefFallback,
  ControlType,
  controlTypeEnum,
  controlDefFallbackLevelEnum,
} from './types/controlDef';
import {
  IControlsDatControlDef,
  IControlsDatControlDefOutput,
  IControlsDatControlDefFallback
} from './types/data/controlsDatControlDef';


let controlDefMap: Map<ControlType, IControlDef> | null = null;

async function _init(): Promise<void> {
  await controlsDatControlDefUtil.init();
  
  // create Control Defs from controls.dat Control Defs
  controlDefMap = createMap(controlsDatControlDefUtil.get());
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
    // only occurs if `type` is not a ControlType because
    // when creating the map we ensure an entry exists for
    // every ControlType
    throw new Error(`Invalid control type: ${type}`);
  }
  
  return controlDef;
}





function createMap(
  controlsDatControlDefMap: {[key: string]: IControlsDatControlDef}
): Map<ControlType, IControlDef> {
  const controlDefMap = new Map<ControlType, IControlDef>();
  
  for (const key in controlsDatControlDefMap) {
    const controlsDatControlDef = controlsDatControlDefMap[key];
    
    const controlDef = createControlDef(controlsDatControlDef);
    controlDefMap.set(controlDef.type, controlDef);
  }
  
  // ensure all types were set
  for (const controlType of controlTypeEnum.values()) {
    if (!controlDefMap.get(controlType)) {
      throw new Error(`Control Def not set for Control Type: ${controlType}`);
    }
  }
  
  return controlDefMap;
}

function createControlDef(controlsDatControlDef: IControlsDatControlDef): IControlDef {
  const controlType = controlTypeEnum.get(controlsDatControlDef.type);
  if (!controlType) throw new Error(`Unrecognized controls.dat Control Def Type: ${controlsDatControlDef.type}`);
  
  return {
    type             : controlType,
    name             : controlsDatControlDef.name,
    description      : controlsDatControlDef.description,
    descriptors      : controlsDatControlDef.descriptors || [],
    buttonDescriptors: controlsDatControlDef.buttonDescriptors || [],
    outputMap        : new Map<string, IControlDefOutput>(
      Object.entries(controlsDatControlDef.outputMap || {}).map(([key, controlsDatControlDefOutput]) => [
        key,
        createControlDefOutput(controlsDatControlDefOutput)
      ])
    ),
    fallbacks: (controlsDatControlDef.fallbacks || []).map(controlsDatControlDefFallback =>
      createControlDefFallback(controlsDatControlDefFallback)
    )
  };
}

function createControlDefOutput(controlsDatControlDefOutput: IControlsDatControlDefOutput): IControlDefOutput {
  return {
    name           : controlsDatControlDefOutput.name,
    isAnalog       : controlsDatControlDefOutput.isAnalog || false,
    defaultLabel   : controlsDatControlDefOutput.defaultLabel,
    negDefaultLabel: controlsDatControlDefOutput.negDefaultLabel,
    posDefaultLabel: controlsDatControlDefOutput.posDefaultLabel
  };
}

function createControlDefFallback(controlsDatControlDefFallback: IControlsDatControlDefFallback): IControlDefFallback {
  const controlType = controlTypeEnum.get(controlsDatControlDefFallback.controlType);
  if (!controlType) throw new Error(`Unrecognized controls.dat Control Def Type: ${controlsDatControlDefFallback.controlType}`);
  
  const fallbackLevel = controlDefFallbackLevelEnum.get(controlsDatControlDefFallback.level.val); // assume 1:1 mapping of enum values
  if (!fallbackLevel) throw new Error(`Unrecognized controls.dat Control Def Fallback Level: ${controlsDatControlDefFallback.level.val}`);
  
  return {
    controlType,
    level: fallbackLevel,
    outputMapping: new Map<string, string | string[]>(
      Object.entries(controlsDatControlDefFallback.outputMapping || {})
    ),
    buttonDescriptorMapping: new Map<string, string | string[]>(
      Object.entries(controlsDatControlDefFallback.buttonDescriptorMapping || {})
    )
  };
}