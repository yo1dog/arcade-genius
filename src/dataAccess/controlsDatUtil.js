import * as controlDefUtil from './controlDefUtil';
import {TJSONValue} from '../types/json';
import coalesceNull from '../helpers/coalesceNull';
import {
  IControlsDat,
  IControlsDatGame,
  IGameControlConfiguration,
  IGameControlSet,
  IGameControl,
  IGameButton,
  IGameInput
} from '../types/controlsDat';
import {
  controlTypeEnum
} from '../types/controlDefEnums';
import {
  cabinetTypeEnum
} from '../types/commonEnums';
import {
  deserializeString,
  deserializeStringNullable,
  deserializeStringNullableOptional,
  deserializeNumber,
  deserializeBoolean,
  deserializeObject,
  deserializeArray,
  deserializeMap,
  deserializeNullable,
} from '../types/jsonSerializer';


/** @type {IControlsDat | null} */
let controlsDat = null;

async function _init() {
  /** @type {TJSONValue} */
  const sControlsDat = ((await import(
    /* webpackChunkName: "controlsDat" */
    '../../data/controls.filtered.partial.min.json' + '' // avoid loading large types
  )).default);
  
  /** @type {TJSONValue} */
  const sGameMapOverride = ((await import(
    /* webpackChunkName: "controlsDat" */
    './controlsDatGameMapOverride.json' + '' // avoid loading large types
  )).default);
  
  await controlDefUtil.init();
  
  controlsDat = deserialize(sControlsDat, sGameMapOverride);
}

/** @type {Promise<void> | null} */
let initPromise = null;
export async function init() {
  return (initPromise = initPromise || _init());
}

export function get() {
  if (!controlsDat) throw new Error(`Attempting to access before initialized.`);
  
  return controlsDat;
}

/**
 * @param {string} name
 * @returns {IControlsDatGame | undefined}
 */
export function getGameByName(name) {
  if (!controlsDat) throw new Error(`Attempting to access before initialized.`);
  
  return controlsDat.gameMap.get(name);
}





/**
 * @param {TJSONValue} sControlsDat 
 * @param {TJSONValue} sGameMapOverride 
 * @returns {IControlsDat}
 */
function deserialize(sControlsDat, sGameMapOverride) {
  const controlsDat = deserializeControlsDat(sControlsDat, 'sControlsDat');
  const gameMapOverride = deserializeMap(sGameMapOverride, 'sGameMapOverride', deserializeControlsDatGame);
  
  controlsDat.gameMap.delete('default'); // machine named "default" is a special case
  controlsDat.gameMap.delete('__empty'); // machine named "__empty" is a special case
  
  // set overrides
  for (const [key, val] of gameMapOverride) {
    controlsDat.gameMap.set(key, val);
  }
  
  return controlsDat;
}

/**
 * @param {TJSONValue} sControlsDat 
 * @param {string} propLabel 
 * @returns {IControlsDat}
 */
function deserializeControlsDat(sControlsDat, propLabel) {
  const controlsDatJ = deserializeObject(sControlsDat, propLabel);
  const metaJ  = deserializeObject(controlsDatJ.meta, `${propLabel}.meta`);
  
  return {
    meta: {
      description: deserializeString(metaJ.description, `${propLabel}.meta.description`),
      version    : deserializeString(metaJ.version,     `${propLabel}.meta.version`    ),
      time       : deserializeString(metaJ.time,        `${propLabel}.meta.time`       ),
      generatedBy: deserializeString(metaJ.generatedBy, `${propLabel}.meta.generatedBy`),
    },
    gameMap: deserializeMap(controlsDatJ.gameMap, `${propLabel}.gameMap`, deserializeControlsDatGame)
  };
}

/**
 * @param {TJSONValue} sControlsDatGame
 * @param {string}     propLabel
 * @returns {IControlsDatGame}
 */
function deserializeControlsDatGame(sControlsDatGame, propLabel) {
  const controlsDatGameJ = deserializeObject(sControlsDatGame, propLabel);
  return {
    name                 : deserializeString (controlsDatGameJ.name,                  `${propLabel}.name`                 ),
    numPlayers           : deserializeNumber (controlsDatGameJ.numPlayers,            `${propLabel}.numPlayers`           ),
    alternatesTurns      : deserializeBoolean(controlsDatGameJ.alternatesTurns,       `${propLabel}.alternatesTurns`      ),
    controlConfigurations: deserializeArray  (controlsDatGameJ.controlConfigurations, `${propLabel}.controlConfigurations`, deserializeGameControlConfiguration),
  };
}

/**
 * @param {TJSONValue} sControlConfig 
 * @param {string}     propLabel 
 * @returns {IGameControlConfiguration}
 */
function deserializeGameControlConfiguration(sControlConfig, propLabel) {
  const controlConfigJ = deserializeObject(sControlConfig, propLabel);
  return {
    targetCabinetType      : cabinetTypeEnum.deserialize(controlConfigJ.targetCabinetType,       `${propLabel}.targetCabinetType`      ),
    requiresCocktailCabinet: deserializeBoolean         (controlConfigJ.requiresCocktailCabinet, `${propLabel}.requiresCocktailCabinet`),
    playerControlSetIndexes: deserializeArray           (controlConfigJ.playerControlSetIndexes, `${propLabel}.playerControlSetIndexes`, deserializeNumber),
    controlSets            : deserializeArray           (controlConfigJ.controlSets,             `${propLabel}.controlSets`,             deserializeGameControlSet),
    menuButtons            : deserializeArray           (controlConfigJ.menuButtons,             `${propLabel}.menuButtons`,             deserializeGameButton),
  };
}

/**
 * @param {TJSONValue} sControlSet 
 * @param {string}     propLabel 
 * @returns {IGameControlSet}
 */
function deserializeGameControlSet(sControlSet, propLabel) {
  const controlSetJ = deserializeObject(sControlSet, propLabel);
  return {
    supportedPlayerNums   : deserializeArray  (controlSetJ.supportedPlayerNums,    `${propLabel}.supportedPlayerNums`,   deserializeNumber),
    isRequired            : deserializeBoolean(controlSetJ.isRequired,             `${propLabel}.isRequired`            ),
    isOnOppositeScreenSide: deserializeBoolean(controlSetJ.isOnOppositeScreenSide, `${propLabel}.isOnOppositeScreenSide`),
    controls              : deserializeArray  (controlSetJ.controls,               `${propLabel}.controls`,              deserializeGameControl),
    controlPanelButtons   : deserializeArray  (controlSetJ.controlPanelButtons,    `${propLabel}.controlPanelButtons`,   deserializeGameButton),
  };
}

/**
 * @param {TJSONValue} sControl 
 * @param {string}     propLabel 
 * @returns {IGameControl}
 */
function deserializeGameControl(sControl, propLabel) {
  const controlJ = deserializeObject(sControl, propLabel);
  const controlType = controlTypeEnum.deserialize(controlJ.type, `${propLabel}.type`);
  
  return {
    type            : controlType,
    controlDef      : controlDefUtil.getByType(controlType),
    descriptor      : coalesceNull(deserializeStringNullable(controlJ.descriptor,       `${propLabel}.descriptor`     ), undefined),
    outputToInputMap: deserializeMap                        (controlJ.outputToInputMap, `${propLabel}.outputToInputMap`, deserializeGameInputNullable),
    buttons         : deserializeArray                      (controlJ.buttons,          `${propLabel}.buttons`         , deserializeGameButton),
  };
}

/**
 * @param {TJSONValue} sButton 
 * @param {string}     propLabel 
 * @returns {IGameButton}
 */
function deserializeGameButton(sButton, propLabel) {
  const buttonJ = deserializeObject(sButton, propLabel);
  return {
    descriptor: coalesceNull(deserializeStringNullable(buttonJ.descriptor, `${propLabel}.descriptor`), undefined),
    input     : deserializeGameInput                  (buttonJ.input,      `${propLabel}.input`     ),
  };
}

/**
 * @param {TJSONValue} sInput 
 * @param {string}     propLabel 
 * @returns {IGameInput}
 */
function deserializeGameInput(sInput, propLabel) {
  const inputJ = deserializeObject(sInput, propLabel);
  return {
    isAnalog     : deserializeBoolean                            (inputJ.isAnalog,      `${propLabel}.isAnalog`     ),
    mameInputPort: deserializeString                             (inputJ.mameInputPort, `${propLabel}.mameInputPort`),
    label        : coalesceNull(deserializeStringNullableOptional(inputJ.label,         `${propLabel}.label`        ), undefined),
    negLabel     : coalesceNull(deserializeStringNullableOptional(inputJ.negLabel,      `${propLabel}.negLabel`     ), undefined),
    posLabel     : coalesceNull(deserializeStringNullableOptional(inputJ.posLabel,      `${propLabel}.posLabel`     ), undefined),
  };
}
/**
 * @param {TJSONValue} sInput 
 * @param {string}     propLabel 
 * @returns {IGameInput | null}
 */
function deserializeGameInputNullable(sInput, propLabel) {
  return deserializeNullable(sInput, propLabel, deserializeGameInput);
}
