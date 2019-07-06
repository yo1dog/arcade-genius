import machineMap from './dataAccess/machineMap';
import controlsDat from './dataAccess/controlsDat';
import * as modelineCaculator from './dataAccess/modelineCalculator';

/**
 * @typedef {import('./dataAccess/mameList').Machine} Machine
 * @typedef {import('./dataAccess/mameList').MachineDriverStatus} MachineDriverStatus
 * 
 * @typedef {import('./dataAccess/controlsDat').ControlsDatGame} ControlsDatGame
 * 
 * @typedef {import('./dataAccess/modelineCalculator').ModelineConfig} ModelineConfig
 * @typedef {import('./dataAccess/modelineCalculator').ModelineResult} ModelineResult
 */


// ----------------------------------
// Machine
// ----------------------------------

/**
 * @typedef MachineCompatibility
 * @property {string} machineNameInput
 * @property {Machine} machine
 * @property {VideoCompatibility[]} videoComps
 * @property {EmulationCompatibility} emuComp
 * @property {ControlsCompatibility} controlsComp
 */

/**
 * @param {string} machineNameInput 
 * @returns {Machine}
 */
export function getMachineByInput(machineNameInput) {
  return machineMap[machineNameInput.trim().toLowerCase()];
}

/**
 * @param {string[]} machineNameInputs 
 * @param {ModelineConfig[]} modelineConfigs 
 * @returns {MachineCompatibility[]}
 */
export async function checkMachineBulk(machineNameInputs, modelineConfigs) {
  const machines = machineNameInputs.map(machineNameInput =>
    getMachineByInput(machineNameInput)
  );
  
  // check video compatibility in bulk
  const modelineConfigsVideoComps = [];
  for (let i = 0; i < modelineConfigs.length; ++i) {
    modelineConfigsVideoComps[i] = await checkVideoBulk(machines, modelineConfigs[i]);
  }
  
  return machines.map((machine, i) => {
    const machineNameInput = machineNameInputs[i];
    
    const videoComps = [];
    for (let j = 0; j < modelineConfigs.length; ++j) {
      videoComps[j] = modelineConfigsVideoComps[j][i];
    }
    
    return {
      machineNameInput,
      machine,
      videoComps,
      emuComp: checkEmulation(machine),
      controlsComp: checkControls(machine)
    };
  });
}

/**
 * @param {string} machineNameInput 
 * @param {ModelineConfig[]} modelineConfigs 
 * @returns {MachineCompatibility}
 */
export async function checkMachine(machineNameInput, modelineConfigs) {
  return await checkMachineBulk([machineNameInput], modelineConfigs)[0];
}


// ----------------------------------
// Emulation
// ----------------------------------

/**
 * @typedef EmulationCompatibility
 * @property {Machine} machine
 * @property {EmulationCompatibilityStatus} status
 * 
 * @typedef {MachineDriverStatus} EmulationCompatibilityStatus
 */

/**
 * @param {Machine} machine
 * @returns {EmulationCompatibility}
 */
export function checkEmulation(machine) {
  return {
    machine,
    status: getEmulationStatus(machine)
  };
}

/**
 * @param {Machine} machine 
 * @returns {EmulationCompatibilityStatus}
 */
function getEmulationStatus(machine) {
  return machine? machine.driver.status : null;
}


// ----------------------------------
// Video
// ----------------------------------

/**
 * @typedef VideoCompatibility
 * @property {Machine} machine
 * @property {ModelineConfig} modelineConfig
 * @property {ModelineResult} modelineResult
 * @property {VideoCompatibilityStatus} status
 * 
 * @typedef {'native'|'int-scale'|'vfreq-slightly-off'|'bad'|'unsupported'} VideoCompatibilityStatus
 */

/**
 * @param {Machine} machine 
 * @param {ModelineConfig} modelineConfig 
 * @returns {Promise<VideoCompatibility>}
 */
export async function checkVideo(machine, modelineConfig) {
  return await checkVideoBulk([machine], modelineConfig)[0];
}

/**
 * @param {Machine[]} machines 
 * @param {ModelineConfig} modelineConfig 
 * @returns {Promise<VideoCompatibility[]>}
 */
export async function checkVideoBulk(machines, modelineConfig) {
  // calculate modelines
  const modelineResultMap = await modelineCaculator.calcModelineBulk(modelineConfig, machines);
  
  // for each machine... 
  return machines.map(machine => {
    // get modeline result
    const modelineResult = machine && modelineResultMap[machine.name];
    
    return {
      machine,
      modelineConfig,
      modelineResult,
      status: getVideoStatus(modelineResult)
    };
  });
}

/**
 * @param {ModelineResult} modelineResult 
 * @returns {VideoCompatibilityStatus}
 */
function getVideoStatus(modelineResult) {
  if (!modelineResult || modelineResult.err) {
    return null;
  }
  
  if (!modelineResult.inRange) {
    return 'unsupported';
  }
  
  if (
    modelineResult.modeline.interlace ||
    modelineResult.resStretch ||
    modelineResult.vfreqOff ||
    modelineResult.xDiff !== 0 ||
    modelineResult.yDiff !== 0
  ) {
    return 'bad';
  }
    
  if (modelineResult.vDiff !== 0) {
    return 'vfreq-slightly-off';
  }
  
  if (
    modelineResult.xScale !== 1 ||
    modelineResult.yScale !== 1
  ) {
    return 'int-scale';
  }
  
  return 'native';
}


// ----------------------------------
// Controls
// ----------------------------------

/**
 * @typedef ControlsCompatibility
 * @property {Machine} machine
 * @property {ControlsDatGame} controlsDatGame
 * @property {ControlsCompatibilityStatus} status
 * 
 * @typedef {'native'|'good'|'ok'|'bad'|'unsupported'} ControlsCompatibilityStatus
 */

/**
 * @param {Machine} machine
 * @returns {ControlsCompatibility} 
 */
export function checkControls(machine) {
  // get controls.dat game
  const controlsDatGame = machine && (
    controlsDat.gameMap[machine.name] ||
    controlsDat.gameMap[machine.cloneof]
  );
  
  return {
    machine,
    controlsDatGame,
    status: getControlsStatus(controlsDatGame),
  };
}

/**
 * @param {ControlsDatGame} controlsDatGame 
 * @returns {ControlsCompatibilityStatus}
 */
function getControlsStatus(controlsDatGame) {
  return null;
}