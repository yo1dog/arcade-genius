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

import _controlDefMap from '../../data/controlDefMap.json';

/** @type {Object<string, ControlDef>} */
const controlDefMap = _controlDefMap;

export default controlDefMap;
