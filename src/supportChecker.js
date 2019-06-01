import machineMap from './dataAccess/machineMap';
import controlsDat from './dataAccess/controlsDat';

/**
 * @typedef {import('./dataAccess/mameList').Machine} Machine
 * @typedef {import('./dataAccess/mameList').DriverStatus} DriverStatus
 * 
 * @typedef {import('./dataAccess/controlsDat').ControlsDatGame} ControlsDatGame
 * 
 * @typedef SupportResult
 * @property {string} machineNameInput
 * @property {Machine} machine
 * @property {ControlsDatGame} controlsDatGame
 * @property {EmulationStatus} emuStatus
 * @property {ControlsStatus} controlsStatus
 * @property {VideoStatus} videoStatus
 * 
 * @typedef {DriverStatus | 'notfound'} EmulationStatus
 * @typedef {'native' | 'good' | 'ok' | 'bad' | 'missing'} ControlsStatus
 * @typedef {'native' | 'good' | 'ok' | 'bad' | 'unsupported'} VideoStatus
 */


/**
 * @param {string} machineNameInput 
 * @returns {SupportResult}
 */
export function check(machineNameInput) {
  // get machine and controls.dat game
  const machine = machineMap[machineNameInput];
  
  const controlsDatGame = machine && (
    controlsDat.gameMap[machine.name] ||
    controlsDat.gameMap[machine.cloneof]
  );
  
  return {
    machineNameInput,
    machine,
    controlsDatGame,
    emuStatus: getEmuStatus(machine),
    controlsStatus: getControlsStatus(controlsDatGame),
    videoStatus: getVideoStatus(machine)
  };
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
  return controlsDatGame? 'good' : null;
}

/**
 * @param {Machine} machine 
 * @returns {VideoStatus}
 */
function getVideoStatus(machine) {
  return machine? 'good' : null;
}