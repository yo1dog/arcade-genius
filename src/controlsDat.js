/**
@typedef ControlsDat
@property {object} meta
@property {string} meta.description
@property {string} meta.version
@property {string} meta.time
@property {string} meta.generatedBy
@property {Object<string, Game>} gameMap

@typedef Game
@property {string} name
@property {number} numPlayers
@property {boolean} alternatesTurns
@property {ControlConfiguration[]} controlConfigurations

@typedef ControlConfiguration
@property {'upright'|'cocktail'} targetCabinetType
@property {boolean} requiresCocktailCabinet
@property {number[]} playerControlSetIndexes
@property {ControlSet[]} controlSets
@property {Button[]} menuButtons

@typedef ControlSet
@property {number[]} supportedPlayerNums
@property {boolean} isRequired
@property {boolean} isOnOppositeScreenSide
@property {Control[]} controls
@property {Button[]} controlPanelButtons

@typedef Control
@property {string} type
@property {string} [descriptor]
@property {Object<string, Input>} outputToInputMap
@property {Button[]} buttons

@typedef Button
@property {string} [descriptor]
@property {Input} input

@typedef Input
@property {boolean} isAnalog
@property {string} mameInputPort
@property {string} [label]
@property {string} [negLabel]
@property {string} [posLabel]
*/

import _restructuredControls from '../data/controls.filtered.partial.min.json';

/** @type {ControlsDat} */
const restructuredControls = _restructuredControls;

export default restructuredControls;