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

import _restructuredControls from '../../data/controls.filtered.partial.min.json';
//const _restructuredControls = {meta:{version:'0.0.0'},gameMap:{}};

/** @type {ControlsDat} */
const restructuredControls = _restructuredControls;

export default restructuredControls;