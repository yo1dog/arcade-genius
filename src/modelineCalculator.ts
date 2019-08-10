import {TJSONValue} from './types/json';
import {
  TInitModule,
  ISwitchResEMCModule,
  ISwitchResInput,
  ISwitchResMachineInput,
  ISwitchResDisplay,
  ISwitchResConfiguration,
  TSwitchResOutput,
  ISwitchResOutputSuccess,
  switchResOrientationEnum,
  switchResDisplayTypeEnum,
  switchResDisplayRotationEnum,
} from './types/switchres';
import {
  IModelineResult,
  IModelineConfiguration,
  TModelineCalculation
} from './types/modeline';
import {
  IGame,
  IGameDisplay
} from './types/game';
import {
  deserializeMap
} from './types/jsonSerializer';
import {
  serializeSwitchResInput,
  deserializeSwitchResOutput
} from './types/switchresSerializer';

const calcCache = new Map<string, TModelineCalculation>();

function createCalcCacheKey(
  modelineConfig       : IModelineConfiguration,
  switchResMachineInput: ISwitchResMachineInput
): string {
  return JSON.stringify([modelineConfig, switchResMachineInput.display]);
}


let switchResEMCModule: ISwitchResEMCModule | null = null;

async function _init(): Promise<void> {
  const initModule: TInitModule = (await import(
    /* webpackChunkName: "switchres" */
    'switchres/groovymame_0210_switchres.js'
  )).default;
  const wasmUri = (await import(
    /* webpackChunkName: "switchres" */
    'switchres/groovymame_0210_switchres.wasm'
  )).default;
  
  const _switchResEMCModule = initModule({
    locateFile(path: string): string {
      return path.endsWith('.wasm')? wasmUri : path;
    }
  });
  
  await new Promise(resolve => {
    _switchResEMCModule.then(() => resolve());
  });
  
  switchResEMCModule = _switchResEMCModule;
}

let initPromise: Promise<void> | null = null;
export async function init(): Promise<void> {
  return (initPromise = initPromise || _init());
}

export async function calcModeline(
  modelineConfig: IModelineConfiguration,
  game          : IGame
): Promise<TModelineCalculation | undefined> {
  return (await calcModelineBulk(modelineConfig, [game])).get(game);
}

export async function calcModelineBulk(
  modelineConfig: IModelineConfiguration,
  games         : IGame[]
): Promise<Map<IGame, TModelineCalculation>> {
  if (!switchResEMCModule) throw new Error(`Not initalized.`);
  
  const calcMap = new Map<IGame, TModelineCalculation>();
  
  // create a map of machine inputs
  const switchResMachineInputMap = new Map<IGame, ISwitchResMachineInput>();
  for (const game of games) {
    // ensure the game has a display
    if (!game.primaryDisplay) {
      calcMap.set(game, {
        success: false,
        modelineConfig,
        errMsg: `Game does not have a display.`
      });
      continue;
    }
    
    // convert the game display to a SwitchRes display
    let switchResDisplay: ISwitchResDisplay;
    try {
      switchResDisplay = createSwitchResDisplay(game.primaryDisplay);
    } catch(err) {
      calcMap.set(game, {
        success: false,
        modelineConfig,
        errMsg: `Error converting game display to SwitchRes display: ${err.message}`
      });
      continue;
    }
    
    // create a SwitchRes machine input
    const switchResMachineInput: ISwitchResMachineInput = {
      name   : game.name,
      display: switchResDisplay
    };
    
    // use calculation from cache for the input when possible
    const cachedCalc = calcCache.get(createCalcCacheKey(modelineConfig, switchResMachineInput));
    if (cachedCalc) {
      calcMap.set(game, cachedCalc);
      continue;
    }
    
    switchResMachineInputMap.set(game, switchResMachineInput);
  }
  
  const input: ISwitchResInput = {
    config  : createSwitchResConfiguration(modelineConfig),
    machines: Array.from(switchResMachineInputMap.values())
  };
  
  // check if there are any modelines that need to be calculated
  if (input.machines.length === 0) {
    return calcMap;
  }
  
  // calculate modelines
  const outputStr: string = switchResEMCModule.ccall(
    'calc_modelines',
    'string',
    ['string'],
    [JSON.stringify(serializeSwitchResInput(input))]
  );
  
  // parse the output
  const outputMap = parseSwitchResOutput(outputStr);
  
  // for each output...
  for (const [gameName, output] of outputMap) {
    // get the game for the output
    const game = games.find(x => x.name === gameName);
    if (!game) throw new Error(`Name in output does not match any game: '${gameName}'`);
    
    // get the input for the game
    const switchResMachineInput = switchResMachineInputMap.get(game);
    if (!switchResMachineInput) throw new Error(`Name in output that does not exist in input: '${game.name}'`);
    
    // create the calculation
    const calc = createModelineCalculation(output, modelineConfig);
    
    // cache calculation for the input
    calcCache.set(createCalcCacheKey(modelineConfig, switchResMachineInput), calc);
    
    // add calculation to map
    calcMap.set(game, calc);
  }
  
  return calcMap;
}

function createSwitchResConfiguration(modelineConfig: IModelineConfiguration): ISwitchResConfiguration {
  const switchResOrientation = switchResOrientationEnum.get(modelineConfig.orientation.val);
  if (!switchResOrientation) throw new Error(`Unable to convert display type: ${modelineConfig.orientation.val}`);
  
  return {
    preset         : modelineConfig.preset,
    orientation    : switchResOrientation,
    ranges         : modelineConfig.ranges,
    allowInterlaced: modelineConfig.allowInterlaced,
    allowDoublescan: modelineConfig.allowDoublescan
  };
}

function createSwitchResDisplay(gameDisplay: IGameDisplay): ISwitchResDisplay {
  const switchResDisplayType = switchResDisplayTypeEnum.get(gameDisplay.type.val);
  if (!switchResDisplayType) throw new Error(`Unable to convert display type: ${gameDisplay.type}`);
  
  const switchResDisplayRotation = switchResDisplayRotationEnum.get(gameDisplay.rotation.val);
  if (!switchResDisplayRotation) throw new Error(`Unable to convert display rotation: ${gameDisplay.rotation}`);
  
  const switchResDisplay: ISwitchResDisplay = {
    type   : switchResDisplayType,
    rotate : switchResDisplayRotation,
    flipx  : gameDisplay.flipx,
    refresh: gameDisplay.refresh,
    width  : gameDisplay.width,
    height : gameDisplay.height
  };
  return switchResDisplay;
}

function parseSwitchResOutput(outputStr: string): Map<string, TSwitchResOutput> {
  let sOutput: TJSONValue;
  try {
    sOutput = JSON.parse(outputStr);
  } catch (err) {
    throw new Error(`Output is not valid JSON:\n${err.message}:\n${outputStr}`);
  }
  
  try {
    return deserializeMap(sOutput, 'sOutputMap', deserializeSwitchResOutput);
  } catch (err) {
    throw new Error(`Error deserializing SwitchRes output:\n${err.message}:\n${outputStr}`);
  }
}

function createModelineCalculation(
  output        : TSwitchResOutput,
  modelineConfig: IModelineConfiguration
): TModelineCalculation {
  const baseCalc = {
    modelineConfig
  };
  
  // check if the output was successfull
  if (isSwitchResOutputSuccess(output)) {
    return {
      success: true,
      ...baseCalc,
      modelineResult: createModelineResult(output)
    };
  }
  
  return {
    success: false,
    ...baseCalc,
    errMsg: output.err
  };
}

function createModelineResult(output: ISwitchResOutputSuccess): IModelineResult {
  return output;
}

function isSwitchResOutputSuccess(output: TSwitchResOutput): output is ISwitchResOutputSuccess {
  return (output as any).err === undefined; // eslint-disable-line @typescript-eslint/no-explicit-any
}
