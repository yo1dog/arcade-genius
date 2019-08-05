import {IMachineDisplay} from '../types/mame';
import {IModelineResult, IModelineConfig} from '../types/modeline';


const cache = new Map<string, IModelineResult>();

export function set(
  modelineConfig: IModelineConfig,
  machineDisplay: IMachineDisplay,
  modelineResult: IModelineResult
): IModelineResult {
  const key = createKey(modelineConfig, machineDisplay);
  cache.set(key, modelineResult);
  
  return modelineResult;
}

export function get(
  modelineConfig: IModelineConfig,
  machineDisplay: IMachineDisplay
): IModelineResult | undefined {
  const key = createKey(modelineConfig, machineDisplay);
  return cache.get(key);
}

function createKey(
  modelineConfig: IModelineConfig,
  machineDisplay: IMachineDisplay
): string {
  return JSON.stringify({modelineConfig,machineDisplay});
}