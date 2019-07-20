/**
 * @typedef ControlDef
 * @property {string} type
 * @property {string} name
 * @property {string} description
 * @property {Object<string, ControlOutput>} outputMap
 * @property {string[]} [descriptors]
 * @property {string[]} [buttonDescriptors]
 * @property {ControlFallback[]} [fallbacks]
 * 
 * @typedef ControlOutput
 * @property {string} [name]
 * @property {boolean} [isAnalog]
 * @property {string} defaultMAMEInputPortSuffix
 * @property {string} [defaultLabel]
 * @property {string} [negDefaultLabel]
 * @property {string} [posDefaultLabel]
 * 
 * @typedef ControlFallback
 * @property {string} controlType
 * @property {ControlFallbackLevel} level
 * @property {Object<string, string|string[]>} [outputMapping]
 * @property {Object<string, string|string[]>} [buttonDescriptorMapping]
 * 
 * @typedef {'good'|'ok'|'bad'} ControlFallbackLevel
 */

/** @type {Object<string, ControlDef>} */
let controlDefMap = null;

async function _init() {
  const {default: _controlDefMap} = await import(
    /* webpackChunkName: "controlDefMap" */
    '../../data/controlDefMap.json'
  );
  controlDefMap = _controlDefMap;
}

let initPromise = null;
export async function init() {
  return (initPromise = initPromise || _init());
}

/**
 * @returns {Object<string, ControlDef>}
 */
export function getMap() {
  return controlDefMap;
}

/**
 * @returns {ControlDef[]}
 */
export function getAll() {
  return Object.values(controlDefMap);
}

/**
 * @param {string} type 
 * @returns {ControlDef}
 */
export function getByType(type) {
  return controlDefMap[type];
}
