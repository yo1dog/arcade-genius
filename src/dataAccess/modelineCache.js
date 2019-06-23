/**
 * @typedef {import('./modelineCalculator').ModelineConfig} ModelineConfig
 * @typedef {import('./modelineCalculator').ModelineResult} ModelineResult
 * @typedef {import('./mameList').MachineDisplay} MachineDisplay
 */


const cache = {};

/**
 * @param {ModelineConfig} modelineConfig 
 * @param {MachineDisplay} machineDisplay 
 * @param {ModelineResult} modelineResult 
 */
export function set(modelineConfig, machineDisplay, modelineResult) {
  const key = createKey(modelineConfig, machineDisplay);
  cache[key] = modelineResult;
}

/**
 * @param {ModelineConfig} modelineConfig 
 * @param {MachineDisplay} machineDisplay 
 * @returns {ModelineResult}
 */
export function get(modelineConfig, machineDisplay) {
  const key = createKey(modelineConfig, machineDisplay);
  return cache[key];
}

/**
 * @param {ModelineConfig} modelineConfig 
 * @param {MachineDisplay} machineDisplay 
 * @returns {string}
 */
function createKey(modelineConfig, machineDisplay) {
  return JSON.stringify({modelineConfig,machineDisplay});
}