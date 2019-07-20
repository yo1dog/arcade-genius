import * as controlDefUtil from './controlDefUtil';

/**
 * @typedef {import('./controlDefUtil').ControlDef} ControlDef
 */

/**
 * @typedef ControlsDat
 * @property {object} meta
 * @property {string} meta.description
 * @property {string} meta.version
 * @property {string} meta.time
 * @property {string} meta.generatedBy
 * @property {Object<string, ControlsDatGame>} gameMap
 * 
 * @typedef ControlsDatGame
 * @property {string} name
 * @property {number} numPlayers
 * @property {boolean} alternatesTurns
 * @property {GameControlConfiguration[]} controlConfigurations
 * 
 * @typedef GameControlConfiguration
 * @property {'upright'|'cocktail'} targetCabinetType
 * @property {boolean} requiresCocktailCabinet
 * @property {number[]} playerControlSetIndexes
 * @property {GameControlSet[]} controlSets
 * @property {GameButton[]} menuButtons
 * 
 * @typedef GameControlSet
 * @property {number[]} supportedPlayerNums
 * @property {boolean} isRequired
 * @property {boolean} isOnOppositeScreenSide
 * @property {GameControl[]} controls
 * @property {GameButton[]} controlPanelButtons
 * 
 * @typedef GameControl
 * @property {string} type
 * @property {ControlDef} controlDef
 * @property {string} [descriptor]
 * @property {Object<string, GameInput>} outputToInputMap
 * @property {GameButton[]} buttons
 * 
 * @typedef GameButton
 * @property {string} [descriptor]
 * @property {GameInput} input
 * 
 * @typedef GameInput
 * @property {boolean} isAnalog
 * @property {string} mameInputPort
 * @property {string} [label]
 * @property {string} [negLabel]
 * @property {string} [posLabel]
 */


/** @type {ControlsDat} */
let controlsDat = null;

async function _init() {
  /** @type {ControlsDat}  */
  const {default: _controlsDat} = await import(
    /* webpackChunkName: "controlsDat" */
    '../../data/controls.filtered.partial.min.json'
  );
  const {default: gameMapOverride} = await import(
    /* webpackChunkName: "controlsDat" */
    './controlsDatGameMapOverride.json'
  );
  
  Object.assign(_controlsDat.gameMap, gameMapOverride);
  delete _controlsDat.gameMap['default'];
  
  await controlDefUtil.init();
  
  for (const name in _controlsDat.gameMap) {
    for (const controlConfig of _controlsDat.gameMap[name].controlConfigurations) {
      for (const controlSet of controlConfig.controlSets) {
        for (const control of controlSet.controls) {
          control.controlDef = controlDefUtil.getByType(control.type);
        }
      }
    }
  }
  
  controlsDat = _controlsDat;
}

let initPromise = null;
export async function init() {
  return (initPromise = initPromise || _init());
}

/**
 * @returns {ControlsDat}
 */
export function get() {
  return controlsDat;
}

/**
 * @param {string} name
 * @returns {ControlsDat}
 */
export function getGameByName(name) {
  return controlsDat.gameMap[name];
}