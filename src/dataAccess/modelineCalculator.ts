import * as modelineCache from './modelineCache';
import {
  IModelineResult,
  IModelineConfig
} from '../types/modeline';
import {
  IMachine,
  IMachineDisplay
} from '../types/mame';

interface IEMCModule {
  then: (cb: () => void) => void;
  ccall(
    methodName: 'calc_modelines',
    returnType: 'string',
    argTypes  : ['string'],
    args      : [string]
  ): string;
}

type TInitModule = (options: {
  locateFile?: (path: string) => string;
}) => IEMCModule;


let emcModule: IEMCModule | null = null;

async function _init(): Promise<void> {
  const initModule:TInitModule = (await import(
    /* webpackChunkName: "switchres" */
    'switchres/groovymame_0210_switchres.js'
  )).default;
  const wasmUri = (await import(
    /* webpackChunkName: "switchres" */
    'switchres/groovymame_0210_switchres.wasm'
  )).default;
  
  const _emcModule = initModule({
    locateFile(path: string): string {
      return path.endsWith('.wasm')? wasmUri : path;
    }
  });
  
  await new Promise(resolve => {
    _emcModule.then(() => resolve());
  });
  
  emcModule = _emcModule;
}

let initPromise: Promise<void> | null = null;
export async function init(): Promise<void> {
  return (initPromise = initPromise || _init());
}

export async function calcModeline(
  config : IModelineConfig,
  machine: IMachine
): Promise<IModelineResult | undefined> {
  return (await calcModelineBulk(config, [machine])).get(machine.name);
}

export async function calcModelineBulk(
  config  : IModelineConfig,
  machines: (IMachine | undefined)[]
): Promise<Map<string, IModelineResult>> {
  if (!emcModule) {
    throw new Error(`Not initalized.`);
  }
  
  // create a map of machine inputs
  // this ensures there are no duplicates and also ensures results can be mapped
  // for caching
  interface IMachineInput {
    name   : string;
    display: IMachineDisplay;
  }
  
  const machineInputMap = new Map<string, IMachineInput>();
  for (const machine of machines) {
    if (machine) {
      machineInputMap.set(machine.name, {
        name: machine.name,
        display: machine.displays[0]
      });
    }
  }
  
  // get machines from cache when possible
  const modelineResultMapCached = new Map<string, IModelineResult>();
  for (const [machineName, machineInput] of machineInputMap) {
    const modelineResult = modelineCache.get(config, machineInput.display);
    if (modelineResult) {
      modelineResultMapCached.set(machineName, modelineResult);
    }
  }
  
  const input = {
    config,
    machines: (
      Array.from(machineInputMap.values())
      // don't recalculate modelines that were cached
      .filter(machineInput => !modelineResultMapCached.get(machineInput.name))
    )
  };
  
  // check if there are any modelines that need to be calculated
  if (input.machines.length === 0) {
    return modelineResultMapCached;
  }
  
  // calculate modelines
  const outputStr: string = emcModule.ccall(
    'calc_modelines',
    'string',
    ['string'],
    [JSON.stringify(input)]
  );
  
  let output: {[key:string]: IModelineResult | null | undefined};
  try {
    output = JSON.parse(outputStr);
  } catch(praseErr) {
    const err = new Error(`Output is not valid JSON: ${outputStr}`);
    throw err;
  }
  
  const modelineResultMapCalcd = new Map(Object.entries(output));
  
  // cache calculated modelines
  for (const [machineName, modelineResult] of modelineResultMapCalcd) {
    const machine = machineInputMap.get(machineName);
    if (!machine) {
      throw new Error(`Machine name in output that does not exist in input: '${machineName}'`);
    }
    
    if (modelineResult) {
      modelineCache.set(config, machine.display, modelineResult);
      modelineResultMapCached.set(machineName, modelineResult);
    }
  }
  
  return modelineResultMapCached;
}
