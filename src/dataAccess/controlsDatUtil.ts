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
} from '../types/controlDef';
import {
  cabinetTypeEnum
} from '../types/common';
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


let controlsDat: IControlsDat | null = null;

async function _init(): Promise<void> {
  const sControlsDat: TJSONValue = (await import(
    /* webpackChunkName: "controlsDat" */
    'data/controls.filtered.partial.min.json'
  )).default;
  
  const sGameMapOverride: TJSONValue = (await import(
    /* webpackChunkName: "controlsDat" */
    './controlsDatGameMapOverride.json' + '' // avoid loading large types
  )).default;
  
  await controlDefUtil.init();
  
  controlsDat = deserialize(sControlsDat, sGameMapOverride);
}

let initPromise: Promise<void> | null = null;
export async function init(): Promise<void> {
  return (initPromise = initPromise || _init());
}

export function get(): IControlsDat {
  if (!controlsDat) throw new Error(`Attempting to access before initialized.`);
  
  return controlsDat;
}

export function getGameByName(name: string): IControlsDatGame | undefined {
  if (!controlsDat) throw new Error(`Attempting to access before initialized.`);
  
  return controlsDat.gameMap.get(name);
}





function deserialize(sControlsDat: TJSONValue, sGameMapOverride: TJSONValue): IControlsDat {
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

function deserializeControlsDat(sControlsDat: TJSONValue, propLabel: string): IControlsDat {
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

function deserializeControlsDatGame(sControlsDatGame: TJSONValue, propLabel: string): IControlsDatGame {
  const controlsDatGameJ = deserializeObject(sControlsDatGame, propLabel);
  return {
    name                 : deserializeString (controlsDatGameJ.name,                  `${propLabel}.name`                 ),
    numPlayers           : deserializeNumber (controlsDatGameJ.numPlayers,            `${propLabel}.numPlayers`           ),
    alternatesTurns      : deserializeBoolean(controlsDatGameJ.alternatesTurns,       `${propLabel}.alternatesTurns`      ),
    controlConfigurations: deserializeArray  (controlsDatGameJ.controlConfigurations, `${propLabel}.controlConfigurations`, deserializeGameControlConfiguration),
  };
}

function deserializeGameControlConfiguration(sControlConfig: TJSONValue, propLabel: string): IGameControlConfiguration {
  const controlConfigJ = deserializeObject(sControlConfig, propLabel);
  return {
    targetCabinetType      : cabinetTypeEnum.deserialize(controlConfigJ.targetCabinetType,       `${propLabel}.targetCabinetType`      ),
    requiresCocktailCabinet: deserializeBoolean         (controlConfigJ.requiresCocktailCabinet, `${propLabel}.requiresCocktailCabinet`),
    playerControlSetIndexes: deserializeArray           (controlConfigJ.playerControlSetIndexes, `${propLabel}.playerControlSetIndexes`, deserializeNumber),
    controlSets            : deserializeArray           (controlConfigJ.controlSets,             `${propLabel}.controlSets`,             deserializeGameControlSet),
    menuButtons            : deserializeArray           (controlConfigJ.menuButtons,             `${propLabel}.menuButtons`,             deserializeGameButton),
  };
}

function deserializeGameControlSet(sControlSet: TJSONValue, propLabel: string): IGameControlSet {
  const controlSetJ = deserializeObject(sControlSet, propLabel);
  return {
    supportedPlayerNums   : deserializeArray  (controlSetJ.supportedPlayerNums,    `${propLabel}.supportedPlayerNums`,   deserializeNumber),
    isRequired            : deserializeBoolean(controlSetJ.isRequired,             `${propLabel}.isRequired`            ),
    isOnOppositeScreenSide: deserializeBoolean(controlSetJ.isOnOppositeScreenSide, `${propLabel}.isOnOppositeScreenSide`),
    controls              : deserializeArray  (controlSetJ.controls,               `${propLabel}.controls`,              deserializeGameControl),
    controlPanelButtons   : deserializeArray  (controlSetJ.controlPanelButtons,    `${propLabel}.controlPanelButtons`,   deserializeGameButton),
  };
}

function deserializeGameControl(sControl: TJSONValue, propLabel: string): IGameControl {
  const controlJ = deserializeObject(sControl, propLabel);
  const controlType = controlTypeEnum.deserialize(controlJ.type, `${propLabel}.type`);
  
  return {
    controlDef      : controlDefUtil.getByType(controlType),
    descriptor      : coalesceNull(deserializeStringNullable(controlJ.descriptor,       `${propLabel}.descriptor`     ), undefined),
    outputToInputMap: deserializeMap                        (controlJ.outputToInputMap, `${propLabel}.outputToInputMap`, deserializeGameInputNullable),
    buttons         : deserializeArray                      (controlJ.buttons,          `${propLabel}.buttons`         , deserializeGameButton),
  };
}

function deserializeGameButton(sButton: TJSONValue, propLabel: string): IGameButton {
  const buttonJ = deserializeObject(sButton, propLabel);
  return {
    descriptor: coalesceNull(deserializeStringNullable(buttonJ.descriptor, `${propLabel}.descriptor`), undefined),
    input     : deserializeGameInput                  (buttonJ.input,      `${propLabel}.input`     ),
  };
}

function deserializeGameInput(sInput: TJSONValue, propLabel: string): IGameInput {
  const inputJ = deserializeObject(sInput, propLabel);
  return {
    isAnalog     : deserializeBoolean                            (inputJ.isAnalog,      `${propLabel}.isAnalog`     ),
    mameInputPort: deserializeString                             (inputJ.mameInputPort, `${propLabel}.mameInputPort`),
    label        : coalesceNull(deserializeStringNullableOptional(inputJ.label,         `${propLabel}.label`        ), undefined),
    negLabel     : coalesceNull(deserializeStringNullableOptional(inputJ.negLabel,      `${propLabel}.negLabel`     ), undefined),
    posLabel     : coalesceNull(deserializeStringNullableOptional(inputJ.posLabel,      `${propLabel}.posLabel`     ), undefined),
  };
}
function deserializeGameInputNullable(sInput: TJSONValue, propLabel: string): IGameInput | null {
  return deserializeNullable(sInput, propLabel, deserializeGameInput);
}
