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
 * 
 * @typedef SupportResult
 * @property {string} machineNameInput
 * @property {Machine} machine
 * @property {ControlsDatGame} controlsDatGame
 * @property {ModelineResult} modelineResult
 * @property {EmulationStatus} emuStatus
 * @property {ControlsStatus} controlsStatus
 * @property {VideoStatus} videoStatus
 * 
 * @typedef {MachineDriverStatus|'notfound'} EmulationStatus
 * @typedef {'native'|'good'|'ok'|'bad'|'missing'} ControlsStatus
 * @typedef {'native'|'good'|'ok'|'bad'|'unsupported'} VideoStatus
 */


/**
 * @param {ModelineConfig} modelineConfig 
 * @param {string} machineNameInput 
 * @returns {Promise<SupportResult>}
 */
export async function check(modelineConfig, machineNameInput) {
  return await checkBulk(modelineConfig, [machineNameInput])[0];
}

/**
 * @param {ModelineConfig} modelineConfig 
 * @param {string[]} machineNameInputs 
 * @returns {Promise<SupportResult[]>}
 */
export async function checkBulk(modelineConfig, machineNameInputs) {
  // map the input names to machines
  const nameInputMachineMap = {};
  for (const machineNameInput of machineNameInputs) {
    nameInputMachineMap[machineNameInput] = machineMap[
      machineNameInput.trim().toLowerCase()
    ];
  }
  
  // calculate modelines
  const machines = Object.values(nameInputMachineMap).filter(x => x);
  const modelineResultMap = await modelineCaculator.calcModelineBulk(modelineConfig, machines);
  
  // for each input name... 
  return machineNameInputs.map(machineNameInput => {
    // get machine
    const machine = nameInputMachineMap[machineNameInput];
    
    // get controls.dat game
    const controlsDatGame = machine && (
      controlsDat.gameMap[machine.name] ||
      controlsDat.gameMap[machine.cloneof]
    );
    
    // get modeline result
    const modelineResult = machine && modelineResultMap[machine.name];
    
    return {
      machineNameInput,
      machine,
      controlsDatGame,
      modelineResult,
      emuStatus: getEmuStatus(machine),
      controlsStatus: getControlsStatus(controlsDatGame),
      videoStatus: getVideoStatus(modelineResult)
    };
  });
}

/**
 * @param {Machine} machine 
 * @returns {EmulationStatus}
 */
function getEmuStatus(machine) {
  return machine? machine.driver.status : 'notfound';
}

/**
 * @param {ControlsDat.Game} controlsDatGame 
 * @returns {ControlsStatus}
 */
function getControlsStatus(controlsDatGame) {
  return null;
}

/**
 * @param {ModelineResult} modelineResult 
 * @returns {VideoStatus}
 */
function getVideoStatus(modelineResult) {
  if (!modelineResult || modelineResult.err) {
    return null;
  }
  
  if (!modelineResult.inRange) {
    return 'unsupported';
  }
  
  if (
    modelineResult.resStretch ||
    modelineResult.modeline.interlace
  ) {
    return 'bad';
  }
  
  if (modelineResult.vfreqOff) {
    return 'ok';
  }
  
  if (
    modelineResult.xDiff === 0 &&
    modelineResult.yDiff === 0 &&
    modelineResult.vDiff === 0
  ) {
    return 'native';
  }
  
  return 'good';
}