import {IMachineDisplay} from '../types/mame';
import {IModelineResult, IModelineConfig} from '../types/modeline';


/** @type {Map<string, IModelineResult>} */
const cache = new Map();

/**
 * @param {IModelineConfig} modelineConfig
 * @param {IMachineDisplay} machineDisplay
 * @param {IModelineResult} modelineResult
 */
export function set(modelineConfig, machineDisplay, modelineResult) {
  const key = createKey(modelineConfig, machineDisplay);
  cache.set(key, modelineResult);
}

/**
 * @param {IModelineConfig} modelineConfig
 * @param {IMachineDisplay} machineDisplay
 * @returns {IModelineResult | undefined}
 */
export function get(modelineConfig, machineDisplay) {
  const key = createKey(modelineConfig, machineDisplay);
  return cache.get(key);
}

/**
 * @param {IModelineConfig} modelineConfig
 * @param {IMachineDisplay} machineDisplay
 * @returns {string}
 */
function createKey(modelineConfig, machineDisplay) {
  return JSON.stringify({modelineConfig,machineDisplay});
}