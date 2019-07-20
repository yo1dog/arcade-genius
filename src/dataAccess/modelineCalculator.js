import * as modelineCache from './modelineCache';

/**
 * @typedef {import('./mameList').Machine} Machine
 * @typedef {import('./mameList').MachineDisplay} MachineDisplay
 */

/**
 * @typedef Modeline
 * @property {number} pclock
 * @property {number} hactive
 * @property {number} hbegin
 * @property {number} hend
 * @property {number} htotal
 * @property {number} vactive
 * @property {number} vbegin
 * @property {number} vend
 * @property {number} vtotal
 * @property {number} interlace
 * @property {number} doublescan
 * @property {number} hsync
 * @property {number} vsync
 * @property {number} vfreq
 * @property {number} hfreq
 * @property {number} width
 * @property {number} height
 * @property {number} refresh
 * @property {number} type
 * @property {number} range
 * 
 * @typedef ModelineResult
 * @property {string}   [err]
 * @property {boolean}  inRange
 * @property {string}   description
 * @property {string}   details
 * @property {boolean}  vfreqOff
 * @property {boolean}  resStretch
 * @property {number}   weight
 * @property {number}   xScale
 * @property {number}   yScale
 * @property {number}   vScale
 * @property {number}   xDiff
 * @property {number}   yDiff
 * @property {number}   vDiff
 * @property {number}   xRatio
 * @property {number}   yRatio
 * @property {number}   vRatio
 * @property {boolean}  rotated
 * @property {Modeline} modeline
 * 
 * @typedef ModelineConfig
 * @property {string}   preset
 * @property {'horizontal'|'vertical'} orientation
 * @property {string[]} ranges
 * @property {boolean}  allowInterlaced
 * @property {boolean}  allowDoublescan
 */


let Module = null;

async function _init() {
  const {default: initModule} = await import(
    /* webpackChunkName: "switchres" */
    '../../groovymame_0210_switchres/out/prod/groovymame_0210_switchres.js'
  );
  const {default: wasmUri} = await import(
    /* webpackChunkName: "switchres" */
    '../../groovymame_0210_switchres/out/prod/groovymame_0210_switchres.wasm'
  );
  
  const _Module = initModule({
    locateFile(path) {
      return path.endsWith('.wasm')? wasmUri : path;
    }
  });
  
  await new Promise(resolve => {
    _Module.then(() => resolve());
  });
  
  Module = _Module;
}

let initPromise = null;
export async function init() {
  return (initPromise = initPromise || _init());
}

/**
 * @param {object}   config
 * @param {string}   config.preset
 * @param {'horizontal'|'vertical'} config.orientation
 * @param {string[]} [config.ranges]
 * @param {boolean}  [config.allowInterlaced]
 * @param {boolean}  [config.allowDoublescan]
 * @returns {ModelineConfig}
 */
export function createModelineConfig({
  preset,
  orientation,
  ranges = [],
  allowInterlaced = true,
  allowDoublescan = true
}) {
  return {
    preset,
    orientation,
    ranges: ranges.slice(0, 10).map(range => range.replace(/s+/g, '')),
    allowInterlaced,
    allowDoublescan
  };
}

/**
 * @param {ModelineConfig} config
 * @param {Machine} machine
 * @returns {Promise<ModelineResult>}
 */
export async function calcModeline(config, machine) {
  return await calcModelineBulk(config, [machine])[machine.name];
}

/**
 * @param {ModelineConfig} _config
 * @param {Machine[]} _machines
 * @returns {Promise<Object<string, ModelineResult>>}
 */
export async function calcModelineBulk(_config, _machines) {
  if (!Module) {
    throw new Error(`Not initalized.`);
  }
  
  const config = createModelineConfig(_config);
  
  /** @type {Machine[]} */
  const machines = (
    Array.isArray(_machines)? _machines.slice(0) : [_machines]
  ).filter(x => x);
  
  // create a map of machine inputs
  // this ensures there are no duplicates and also ensures results can be mapped
  // for caching
  /** @type {Object<string, {name:string, display:MachineDisplay}>} */
  const machineInputMap = {};
  for (const machine of machines) {
    machineInputMap[machine.name] = {
      name: machine.name,
      display: machine.displays[0]
    };
  }
  
  // get machines from cache when possible
  /** @type {Object<string, ModelineResult>} */
  const modelineResultMapCached = {};
  for (const machineInput of Object.values(machineInputMap)) {
    modelineResultMapCached[machineInput.name] = modelineCache.get(config, machineInput.display);
  }
  
  const input = {
    config,
    machines: (
      Object.values(machineInputMap)
      // don't recalculate modelines that were cached
      .filter(machineInput => !modelineResultMapCached[machineInput.name])
    )
  };
  
  // check if there are any modelines that need to be calculated
  if (input.machines.length === 0) {
    return modelineResultMapCached;
  }
  
  // calculate modelines
  console.log(input);
  const outputStr = Module.ccall(
    'calc_modelines',
    'string',
    ['string'],
    [JSON.stringify(input)]
  );
  
  let output;
  try {
    output = JSON.parse(outputStr);
  } catch(praseErr) {
    const err = new Error(`Output is not valid JSON: ${outputStr}`);
    err.praseErr = praseErr;
    err.outputStr = outputStr;
    throw err;
  }
  
  /** @type {Object<string, ModelineResult>} */
  const modelineResultMapCalcd = output;
  
  // cache calculated modelines
  for (const machineName in modelineResultMapCalcd) {
    const modelineResult = modelineResultMapCalcd[machineName];
    
    if (modelineResult) {
      const display = machineInputMap[machineName].display;
      modelineCache.set(config, display, modelineResult);
    }
  }
  
  /** @type {Object<string, ModelineResult>} */
  const modelineResultMap = {...modelineResultMapCached, ...modelineResultMapCalcd};
  return modelineResultMap;
}
