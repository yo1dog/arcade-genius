import {TJSONValue} from '../types/json';
import {
  IControlsDat,
  IControlsDatGame,
  IControlsDatControlConfiguration,
  IControlsDatControlSet,
  IControlsDatControl,
  IControlsDatButton,
  IControlsDatInput,
  controlsDatCabinetTypeEnum
} from '../types/data/controlsDat';
import {
  deserializeString,
  deserializeStringNullable,
  deserializeStringNullableOptional,
  deserializeNumber,
  deserializeBoolean,
  deserializeObject,
  deserializeArray,
  deserializeObjectMap,
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





function deserialize(sControlsDat: TJSONValue, sGameMapOverride: TJSONValue): IControlsDat {
  const controlsDat = deserializeControlsDat(sControlsDat, 'sControlsDat');
  const gameMapOverride = deserializeObjectMap(sGameMapOverride, 'sGameMapOverride', deserializeControlsDatGame);
  
  delete controlsDat.gameMap['default']; // game named "default" is a special case
  delete controlsDat.gameMap['__empty']; // game named "__empty" is a special case
  
  // set overrides
  for (const key in gameMapOverride) {
    controlsDat.gameMap[key] = gameMapOverride[key];
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
    gameMap: deserializeObjectMap(controlsDatJ.gameMap, `${propLabel}.gameMap`, deserializeControlsDatGame)
  };
}

function deserializeControlsDatGame(sControlsDatGame: TJSONValue, propLabel: string): IControlsDatGame {
  const controlsDatGameJ = deserializeObject(sControlsDatGame, propLabel);
  return {
    name                 : deserializeString (controlsDatGameJ.name,                  `${propLabel}.name`                 ),
    numPlayers           : deserializeNumber (controlsDatGameJ.numPlayers,            `${propLabel}.numPlayers`           ),
    alternatesTurns      : deserializeBoolean(controlsDatGameJ.alternatesTurns,       `${propLabel}.alternatesTurns`      ),
    controlConfigurations: deserializeArray  (controlsDatGameJ.controlConfigurations, `${propLabel}.controlConfigurations`, deserializeControlsDatControlConfiguration),
  };
}

function deserializeControlsDatControlConfiguration(sControlConfig: TJSONValue, propLabel: string): IControlsDatControlConfiguration {
  const controlConfigJ = deserializeObject(sControlConfig, propLabel);
  return {
    targetCabinetType      : controlsDatCabinetTypeEnum.deserialize(controlConfigJ.targetCabinetType,       `${propLabel}.targetCabinetType`      ),
    requiresCocktailCabinet: deserializeBoolean                    (controlConfigJ.requiresCocktailCabinet, `${propLabel}.requiresCocktailCabinet`),
    playerControlSetIndexes: deserializeArray                      (controlConfigJ.playerControlSetIndexes, `${propLabel}.playerControlSetIndexes`, deserializeNumber),
    controlSets            : deserializeArray                      (controlConfigJ.controlSets,             `${propLabel}.controlSets`,             deserializeControlsDatControlSet),
    menuButtons            : deserializeArray                      (controlConfigJ.menuButtons,             `${propLabel}.menuButtons`,             deserializeControlsDatButton),
  };
}

function deserializeControlsDatControlSet(sControlSet: TJSONValue, propLabel: string): IControlsDatControlSet {
  const controlSetJ = deserializeObject(sControlSet, propLabel);
  return {
    supportedPlayerNums   : deserializeArray  (controlSetJ.supportedPlayerNums,    `${propLabel}.supportedPlayerNums`,   deserializeNumber),
    isRequired            : deserializeBoolean(controlSetJ.isRequired,             `${propLabel}.isRequired`            ),
    isOnOppositeScreenSide: deserializeBoolean(controlSetJ.isOnOppositeScreenSide, `${propLabel}.isOnOppositeScreenSide`),
    controls              : deserializeArray  (controlSetJ.controls,               `${propLabel}.controls`,              deserializeControlsDatControl),
    controlPanelButtons   : deserializeArray  (controlSetJ.controlPanelButtons,    `${propLabel}.controlPanelButtons`,   deserializeControlsDatButton),
  };
}

function deserializeControlsDatControl(sControl: TJSONValue, propLabel: string): IControlsDatControl {
  const controlJ = deserializeObject(sControl, propLabel);
  
  return {
    type            : deserializeString        (controlJ.type,             `${propLabel}.type`           ),
    descriptor      : deserializeStringNullable(controlJ.descriptor,       `${propLabel}.descriptor`     ),
    outputToInputMap: deserializeObjectMap     (controlJ.outputToInputMap, `${propLabel}.outputToInputMap`, deserializeControlsDatInputNullable),
    buttons         : deserializeArray         (controlJ.buttons,          `${propLabel}.buttons`         , deserializeControlsDatButton),
  };
}

function deserializeControlsDatButton(sButton: TJSONValue, propLabel: string): IControlsDatButton {
  const buttonJ = deserializeObject(sButton, propLabel);
  return {
    descriptor: deserializeStringNullable  (buttonJ.descriptor, `${propLabel}.descriptor`),
    input     : deserializeControlsDatInput(buttonJ.input,      `${propLabel}.input`     ),
  };
}

function deserializeControlsDatInput(sInput: TJSONValue, propLabel: string): IControlsDatInput {
  const inputJ = deserializeObject(sInput, propLabel);
  return {
    isAnalog     : deserializeBoolean               (inputJ.isAnalog,      `${propLabel}.isAnalog`     ),
    mameInputPort: deserializeString                (inputJ.mameInputPort, `${propLabel}.mameInputPort`),
    label        : deserializeStringNullableOptional(inputJ.label,         `${propLabel}.label`        ),
    negLabel     : deserializeStringNullableOptional(inputJ.negLabel,      `${propLabel}.negLabel`     ),
    posLabel     : deserializeStringNullableOptional(inputJ.posLabel,      `${propLabel}.posLabel`     ),
  };
}
function deserializeControlsDatInputNullable(sInput: TJSONValue, propLabel: string): IControlsDatInput | null {
  return deserializeNullable(sInput, propLabel, deserializeControlsDatInput);
}
