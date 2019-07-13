import machineMap from './dataAccess/machineMap';
import controlsDat from './dataAccess/controlsDat';
import * as modelineCaculator from './dataAccess/modelineCalculator';

/**
 * @typedef {import('./dataAccess/mameList').Machine} Machine
 * @typedef {import('./dataAccess/mameList').MachineDriverStatus} MachineDriverStatus
 * 
 * @typedef {import('./dataAccess/controlsDat').ControlsDatGame} ControlsDatGame
 * @typedef {import('./dataAccess/controlsDat').ControlConfiguration} ControlConfiguration
 * @typedef {import('./components/controlPanelConfigurator/controlPanelConfigurator').ControlPanelConfig} ControlPanelConfig
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
    modelineResult.vfreqOff /*||
    modelineResult.xDiff !== 0 ||
    modelineResult.yDiff !== 0*/
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

///**
// * @param {ControlConfiguration} controlConfig 
// * @param {ControlPanelConfig} controlPanelConfig 
// */
//function getControlConfigCompatibility(controlConfig, controlPanelConfig) {
//  /** @type {Object<string, number>} */
//  const missingControlTypeCountMap = {};
//  
//  /** @type {ControlPanelConfig} */
//  const usedControlPanelConfig = {
//    ...controlPanelConfig,
//    controlTypeCountMap: {
//      ...controlPanelConfig.controlTypeCountMap
//    }
//  };
//  
//  // TODO: check controlConfig.menuButtons
//  // TODO: check controlConfig.requiresCocktailCabinet
//  
//  const requiredControlSets = controlConfig.controlSets.filter(x => x.isRequired);
//  for (const controlSet of requiredControlSets) {
//    const playerIndex = Math.min(...controlSet.supportedPlayerNums) - 1;
//    const controlPanelButtonCount = controlPanelConfig.playerButtonCounts[playerIndex];
//    
//    // check if the control panel has enough buttons
//    if (controlSet.controlPanelButtons.length > controlPanelButtonCount) {
//      
//    }
//  }
//  
//  controlConfig.controlSets.every(gameControlSet => {
//    // find a cab control set that matches the game control set (and has not yet been used)
//    const matchedCabControlSet = Array.from(unsuedCabControlSetsSet).find(cabControlSet =>
//      matchCabControlSet(cabControlSet, gameControlSet, controlDefMap)
//    );
//    
//    if (matchedCabControlSet) {
//      unsuedCabControlSetsSet.delete(matchedCabControlSet);
//      return true;
//    }
//    
//    return !gameControlSet.isRequired;
//  });
//}
//
//function matchCabControlSet(cabControlSet, gameControlSet, controlDefMap) {
//  // check if control sets are on the same side 
//  if (cabControlSet.isOnOppositeScreenSide !== gameControlSet.isOnOppositeScreenSide) {
//    return false;
//  }
//  
//  const unusedControlTypeCounts = Object.assign({}, cabControlSet.controlTypeCounts);
//  
//  // for each control...
//  for (let i = 0; i < gameControlSet.controls.length; ++i) {
//    const control = gameControlSet.controls[i];
//    const controlDef = controlDefMap[control.type];
//    
//    let useableControlTypes;
//    if (controlDef) {
//      useableControlTypes = [controlDef.type].concat(
//        (controlDef.fallbacks || [])
//        .filter(fallback => fallback.level === 'good')
//        .map(fallback => fallback.controlType)
//      );
//    }
//    else {
//      useableControlTypes = [control.type];
//    }
//    
//    const unusedControlType = useableControlTypes.find(controlType => unusedControlTypeCounts[controlType] > 0);
//    if (!unusedControlType) {
//      return false;
//    }
//    
//    --unusedControlTypeCounts[unusedControlType];
//  }
//  
//  // ensure enough buttons are supported
//  const cabNumButtons = cabControlSet.numButtons;
//  const gameNumButtons = gameControlSet.controlPanelButtons.length;
//  if (cabNumButtons < gameNumButtons) {
//    return false;
//  }
//  
//  return true;
//}

/**
 * @param {ControlsDatGame} controlsDatGame 
 * @returns {ControlsCompatibilityStatus}
 */
function getControlsStatus(controlsDatGame) {
  return null;
}