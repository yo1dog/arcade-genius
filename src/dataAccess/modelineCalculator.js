import * as modelineCache from './modelineCache';
import {
  IModelineResult,
  IModelineConfig
} from '../types/modeline';
import {
  IMachine,
  IMachineDisplay
} from '../types/mame';


/** @type {{[key:string]: any} | null} */
let emcModule = null;

async function _init() {
  const {default: initModule} = await import(
    /* webpackChunkName: "switchres" */
    '../../groovymame_0210_switchres/out/wasm/groovymame_0210_switchres.js' + '' // avoid loading large types
  );
  const {default: wasmUri} = await import(
    /* webpackChunkName: "switchres" */
    '../../groovymame_0210_switchres/out/wasm/groovymame_0210_switchres.wasm'
  );
  
  const _emcModule = initModule({
    /** @param {string} path */
    locateFile(path) {
      return path.endsWith('.wasm')? wasmUri : path;
    }
  });
  
  await new Promise(resolve => {
    _emcModule.then(() => resolve());
  });
  
  emcModule = _emcModule;
}

/** @type {Promise<void> | null} */
let initPromise = null;
export async function init() {
  return (initPromise = initPromise || _init());
}

/**
 * @param {IModelineConfig} config
 * @param {IMachine}        machine
 */
export async function calcModeline(config, machine) {
  return (await calcModelineBulk(config, [machine])).get(machine.name);
}

/**
 * @param {IModelineConfig}             config 
 * @param {Array<IMachine | undefined>} machines 
 */
export async function calcModelineBulk(config, machines) {
  if (!emcModule) {
    throw new Error(`Not initalized.`);
  }
  
  // create a map of machine inputs
  // this ensures there are no duplicates and also ensures results can be mapped
  // for caching
  /**
   * @typedef IMachineInput
   * @property {string}          name
   * @property {IMachineDisplay} display
   */
  
  /** @type {Map<string, IMachineInput>} */
  const machineInputMap = new Map();
  for (const machine of machines) {
    if (machine) {
      machineInputMap.set(machine.name, {
        name: machine.name,
        display: machine.displays[0]
      });
    }
  }
  
  // get machines from cache when possible
  /** @type {Map<string, IModelineResult>} */
  const modelineResultMapCached = new Map();
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
  /** @type {string} */
  const outputStr = emcModule.ccall(
    'calc_modelines',
    'string',
    ['string'],
    [JSON.stringify(input)]
  );
  
  /** @type {{[key:string]: IModelineResult|null|undefined}} */
  let output;
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
