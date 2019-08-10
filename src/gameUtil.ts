import * as mameListUtil       from './data/mameListUtil';
import * as controlsDatUtil    from './data/controlsDatUtil';
import * as controlDefUtil     from './controlDefUtil';
import coalesceNull            from './helpers/coalesceNull';
import shortenDescription      from './helpers/shortenDescription';
import calcLevenshteinDistance from 'lib/levenshtein.js';
import {
  IGame,
  IGameDisplay,
  IGameControlInfo,
  IGameControlConfiguration,
  IGameControlSet,
  IGameControl,
  IGameButton,
  IGameInput
} from './types/game';
import {
  displayTypeEnum,
  displayRotationEnum,
  cabinetTypeEnum
} from './types/common';
import {
  IMAMEList,
  IMAMEMachine,
  IMAMEMachineDisplay
} from './types/data/mame';
import {
  IControlsDat,
  IControlsDatGame,
  IControlsDatControlConfiguration,
  IControlsDatControlSet,
  IControlsDatControl,
  IControlsDatButton,
  IControlsDatInput
} from './types/data/controlsDat';
import {
  controlTypeEnum
} from './types/controlDef';


let gameMap: Map<string, IGame> | null = null;

async function _init(): Promise<void> {
  await Promise.all([
    mameListUtil.init(),
    controlsDatUtil.init(),
    controlDefUtil.init()
  ]);
  
  const mameList = mameListUtil.get();
  const controlsDat = controlsDatUtil.get();
  
  gameMap = createMap(mameList, controlsDat);
}

let initPromise: Promise<void> | null = null;
export async function init(): Promise<void> {
  return (initPromise = initPromise || _init());
}

export function getGameMap(): Map<string, IGame> {
  if (!gameMap) throw new Error(`Attempting to access before initialized.`);
  return gameMap;
}

export function getGameByName(name: string): IGame | undefined {
  if (!gameMap) throw new Error(`Attempting to access before initialized.`);
  return gameMap.get(name);
}

export function getGameSuggestions(gameNameInput: string, numSuggestions: number): {game: IGame; dist: number}[] {
  if (!gameMap) throw new Error(`Attempting to access before initialized.`);
  
  numSuggestions = Math.min(Math.max(numSuggestions, 0), gameMap.size);
  if (numSuggestions === 0) {
    return [];
  }
  
  const nameMatchStr = gameNameInput.replace(/\s+/g, '').toLowerCase();
  const descMatchStr = gameNameInput.trim().toLowerCase();
  
  const suggestions: {game: IGame; dist: number}[] = Array(numSuggestions).fill({dist: Infinity});
  
  for (const [, game] of gameMap) {
    const dist1 = calcLevenshteinDistance(nameMatchStr, game.name);
    const dist2 = calcLevenshteinDistance(descMatchStr, (game.shortDescription || game.description).toLowerCase());
    const dist = dist1 < dist2? dist1 : dist2;
    
    for (let i = 0; i < suggestions.length; ++i) {
      if (dist < suggestions[i].dist) {
        for (let j = suggestions.length - 1; j > i; --j) {
          suggestions[j] = suggestions[j - 1];
        }
        suggestions[i] = {game, dist};
        break;
      }
    }
  }
  
  return suggestions;
}






function createMap(mameList: IMAMEList, controlsDat: IControlsDat): Map<string, IGame> {
  const gameMap = new Map<string, IGame>();
  
  for (const machine of mameList.machines) {
    if (machine.name === 'default') continue; // machine named "default" is a special case
    if (machine.name === '__empty') continue; // machine named "__empty" is a special case
    
    let controlsDatGame: IControlsDatGame | undefined = controlsDat.gameMap[machine.name];
    if (!controlsDatGame && machine.cloneof) {
      controlsDatGame = controlsDat.gameMap[machine.cloneof];
    }
    
    let game: IGame;
    try {
      game = createGame(machine, controlsDatGame);
    } catch(err) {
      err.message = `Error creating Game from MAME Machine '${machine.name}'${controlsDatGame? ` and controls.dat Game '${controlsDatGame.name}'` : ''}: ${err.message}`;
      throw err;
    }
    
    gameMap.set(game.name, game);
  }
  
  for (const [,game] of gameMap) {
    const cloneof = game.mameMachine && game.mameMachine.cloneof;
    if (!cloneof) continue;
    
    const cloneOfGame = gameMap.get(cloneof);
    if (!cloneOfGame) {
      console.log(`Game '${game.name}' has invalid MAME Machine cloneof value. Game with this name does not exist: ${cloneof}`);
      continue;
    }
    
    // @ts-ignore
    game.cloneOfGame = cloneOfGame;
  }
  
  return gameMap;
}

function createGame(mameMachine: IMAMEMachine, controlsDatGame?: IControlsDatGame): IGame {
  const displays = mameMachine.displays.map(createGameDisplay);
  
  return {
    name            : mameMachine.name,
    description     : mameMachine.description,
    shortDescription: shortenDescription(mameMachine.description),
    primaryDisplay  : displays[0],
    displays        : displays,
    controlInfo     : controlsDatGame && createGameControlInfo(controlsDatGame),
    mameMachine
  };
}

function createGameDisplay(mameMachineDisplay: IMAMEMachineDisplay): IGameDisplay {
  const displayType = displayTypeEnum.get(mameMachineDisplay.type.val); // assume 1:1 mapping of enum values
  if (!displayType) throw new Error(`Unrecognized MAME Machine Display Type: ${mameMachineDisplay.type.val}`);
  
  const displayRotation = displayRotationEnum.get(mameMachineDisplay.rotate.val); // assume 1:1 mapping of enum values
  if (!displayRotation) throw new Error(`Unrecognized MAME Machine Display rotate value: ${mameMachineDisplay.rotate.val}`);
  
  return {
    type    : displayType,
    rotation: displayRotation,
    flipx   : mameMachineDisplay.flipx,
    refresh : mameMachineDisplay.refresh,
    width   : mameMachineDisplay.width,
    height  : mameMachineDisplay.height,
  };
}

function createGameControlInfo(controlsDatGame: IControlsDatGame): IGameControlInfo {
  return {
    numPlayers     : controlsDatGame.numPlayers,
    alternatesTurns: controlsDatGame.alternatesTurns,
    controlConfigs : controlsDatGame.controlConfigurations.map(createGameControlConfig)
  };
}

function createGameControlConfig(controlsDatControlConfig: IControlsDatControlConfiguration): IGameControlConfiguration {
  const cabinetType = cabinetTypeEnum.get(controlsDatControlConfig.targetCabinetType.val); // assume 1:1 mapping of enum values
  if (!cabinetType) throw new Error(`Unrecognized controls.dat Control Configuration Cabinet Type: ${controlsDatControlConfig.targetCabinetType.val}`);
  
  return {
    targetCabinetType: cabinetType,
    controlSets      : controlsDatControlConfig.controlSets.map(createGameControlSet),
    menuButtons      : controlsDatControlConfig.menuButtons.map(createGameButton),
  };
}

function createGameControlSet(controlsDatControlSet: IControlsDatControlSet): IGameControlSet {
  return {
    supportedPlayerNums   : controlsDatControlSet.supportedPlayerNums,
    isRequired            : controlsDatControlSet.isRequired,
    isOnOppositeScreenSide: controlsDatControlSet.isOnOppositeScreenSide,
    controls              : controlsDatControlSet.controls.map(createGameControl),
    controlPanelButtons   : controlsDatControlSet.controlPanelButtons.map(createGameButton),
  };
}

function createGameControl(controlsDatControl: IControlsDatControl): IGameControl {
  const controlType = controlTypeEnum.get(controlsDatControl.type);
  if (!controlType) throw new Error(`Unrecognized controls.dat Control Type: ${controlsDatControl.type}`);
  
  return {
    controlDef: controlDefUtil.getByType(controlType),
    descriptor: coalesceNull(controlsDatControl.descriptor, undefined),
    outputToInputMap: new Map<string, IGameInput | undefined>(
      Object.entries(controlsDatControl.outputToInputMap).map(([key, controlsDatInput]) => [
        key,
        controlsDatInput? createGameInput(controlsDatInput): undefined
      ])
    ),
    buttons: controlsDatControl.buttons.map(createGameButton)
  };
}

function createGameButton(controlsDatButton: IControlsDatButton): IGameButton {
  return {
    descriptor: coalesceNull(controlsDatButton.descriptor, undefined),
    input     : createGameInput(controlsDatButton.input)
  };
}

function createGameInput(controlsDatInput: IControlsDatInput): IGameInput {
  return {
    isAnalog: controlsDatInput.isAnalog,
    label   : coalesceNull(controlsDatInput.label,    undefined),
    negLabel: coalesceNull(controlsDatInput.negLabel, undefined),
    posLabel: coalesceNull(controlsDatInput.posLabel, undefined)
  };
}