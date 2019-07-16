import machineMap from './dataAccess/machineMap';
import controlsDat from './dataAccess/controlsDat';
import * as modelineCaculator from './dataAccess/modelineCalculator';
import controlDefMap from './dataAccess/controlDefMap';
import coalesceUndefined from './helpers/coalesceUndefined';

/**
 * @typedef {import('./dataAccess/mameList').Machine} Machine
 * @typedef {import('./dataAccess/mameList').MachineDriverStatus} MachineDriverStatus
 * 
 * @typedef {import('./dataAccess/controlsDat').ControlsDatGame} ControlsDatGame
 * @typedef {import('./dataAccess/controlsDat').GameControlConfiguration} GameControlConfiguration
 * @typedef {import('./dataAccess/controlsDat').GameControlSet} GameControlSet
 * @typedef {import('./dataAccess/controlsDat').GameControl} GameControl
 * @typedef {import('./dataAccess/controlsDat').GameButton} GameButton
 * @typedef {import('./components/controlPanelConfigurator/controlPanelConfigurator').ControlPanelConfig} ControlPanelConfig
 * @typedef {import('./components/controlPanelConfigurator/controlPanelConfigurator').ControlPanelButtonCluster} ControlPanelButtonCluster
 * @typedef {import('./components/controlPanelConfigurator/controlPanelConfigurator').ControlPanelControlSet} ControlPanelControlSet
 * @typedef {import('./components/controlPanelConfigurator/controlPanelConfigurator').ControlPanelControl} ControlPanelControl
 * 
 * @typedef {import('./dataAccess/modelineCalculator').ModelineConfig} ModelineConfig
 * @typedef {import('./dataAccess/modelineCalculator').ModelineResult} ModelineResult
 */

export const MachineCompatibilityStatusEnum = {
  UNKNOWN    : -1,
  UNSUPPORTED:  0,
  BAD        :  1,
  OK         :  2,
  GOOD       :  3,
  NATIVE     :  4,
  
  /** @param {number} val */
  translate(val) {
    const entry = Object.entries(MachineCompatibilityStatusEnum).find(e => e[1] === val);
    return entry? entry[0] : val;
  }
};

export const EmulationCompatibilityStatusEnum = {
  UNKNOWN    : -1,
  PRELIMINARY:  0,
  IMPERFECT  :  1,
  GOOD       :  2,
  
  /** @param {number} val */
  translate(val) {
    const entry = Object.entries(EmulationCompatibilityStatusEnum).find(e => e[1] === val);
    return entry? entry[0] : val;
  }
};

export const VideoCompatibilityStatusEnum = {
  UNKNOWN           : -1,
  UNSUPPORTED       :  0,
  BAD               :  1,
  VFREQ_SLIGHTLY_OFF:  2,
  INT_SCALE         :  3,
  NATIVE            :  4,
  
  /** @param {number} val */
  translate(val) {
    const entry = Object.entries(VideoCompatibilityStatusEnum).find(e => e[1] === val);
    return entry? entry[0] : val;
  }
};

export const ControlsCompatibilityStatusEnum = {
  UNKNOWN    : -1,
  UNSUPPORTED:  0,
  BAD        :  1,
  OK         :  2,
  GOOD       :  3,
  NATIVE     :  4,
  
  /** @param {number} val */
  translate(val) {
    const entry = Object.entries(ControlsCompatibilityStatusEnum).find(e => e[1] === val);
    return entry? entry[0] : val;
  }
};

const emuMachineCompatibilityStatusMap = {
  [EmulationCompatibilityStatusEnum.UNKNOWN    ]: MachineCompatibilityStatusEnum.UNKNOWN,
  [EmulationCompatibilityStatusEnum.PRELIMINARY]: MachineCompatibilityStatusEnum.BAD,
  [EmulationCompatibilityStatusEnum.IMPERFECT  ]: MachineCompatibilityStatusEnum.OK,
  [EmulationCompatibilityStatusEnum.GOOD       ]: MachineCompatibilityStatusEnum.NATIVE,
};
/** @param {number} emuCompatibilityStatus */
export function emuToMachineCompatibilityStatus(emuCompatibilityStatus) {
  return coalesceUndefined(emuMachineCompatibilityStatusMap[emuCompatibilityStatus], MachineCompatibilityStatusEnum.UNKNOWN);
}
const controlsMachineCompatibilityStatusMap = {
  [ControlsCompatibilityStatusEnum.UNKNOWN    ]: MachineCompatibilityStatusEnum.UNKNOWN,
  [ControlsCompatibilityStatusEnum.UNSUPPORTED]: MachineCompatibilityStatusEnum.UNSUPPORTED,
  [ControlsCompatibilityStatusEnum.BAD        ]: MachineCompatibilityStatusEnum.BAD,
  [ControlsCompatibilityStatusEnum.OK         ]: MachineCompatibilityStatusEnum.OK,
  [ControlsCompatibilityStatusEnum.GOOD       ]: MachineCompatibilityStatusEnum.GOOD,
  [ControlsCompatibilityStatusEnum.NATIVE     ]: MachineCompatibilityStatusEnum.NATIVE,
};
/** @param {number} controlsCompatibilityStatus */
export function controlsToMachineCompatibilityStatus(controlsCompatibilityStatus) {
  return coalesceUndefined(controlsMachineCompatibilityStatusMap[controlsCompatibilityStatus], MachineCompatibilityStatusEnum.UNKNOWN);
}
const videoMachineCompatibilityStatusMap = {
  [VideoCompatibilityStatusEnum.UNKNOWN           ]: MachineCompatibilityStatusEnum.UNKNOWN,
  [VideoCompatibilityStatusEnum.UNSUPPORTED       ]: MachineCompatibilityStatusEnum.UNSUPPORTED,
  [VideoCompatibilityStatusEnum.BAD               ]: MachineCompatibilityStatusEnum.BAD,
  [VideoCompatibilityStatusEnum.VFREQ_SLIGHTLY_OFF]: MachineCompatibilityStatusEnum.OK,
  [VideoCompatibilityStatusEnum.INT_SCALE         ]: MachineCompatibilityStatusEnum.GOOD,
  [VideoCompatibilityStatusEnum.NATIVE            ]: MachineCompatibilityStatusEnum.NATIVE,
};
/** @param {number} videoCompatibilityStatus */
export function videoToMachineCompatibilityStatus(videoCompatibilityStatus) {
  return coalesceUndefined(videoMachineCompatibilityStatusMap[videoCompatibilityStatus], MachineCompatibilityStatusEnum.UNKNOWN);
}


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
 * @property {number} status
 * @property {number} knownStatus
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
 * @param {ControlPanelConfig} cpConfig 
 * @returns {MachineCompatibility[]}
 */
export async function checkMachineBulk(machineNameInputs, modelineConfigs, cpConfig) {
  const machines = machineNameInputs.map(machineNameInput =>
    getMachineByInput(machineNameInput)
  );
  
  // check video compatibility in bulk
  /** @type {VideoCompatibility[][]} */
  const modelineConfigsVideoComps = [];
  for (let i = 0; i < modelineConfigs.length; ++i) {
    modelineConfigsVideoComps[i] = await checkVideoBulk(machines, modelineConfigs[i]);
  }
  
  return machines.map((machine, i) => {
    const machineNameInput = machineNameInputs[i];
    
    /** @type {VideoCompatibility[]} */
    const videoComps = [];
    for (let j = 0; j < modelineConfigs.length; ++j) {
      videoComps[j] = modelineConfigsVideoComps[j][i];
    }
    
    // check emulation compatibility
    const emuComp = checkEmulation(machine);
    
    // check controls compatibility
    const controlsComp = checkControls(machine, cpConfig);
    
    // machine overall compatibility is worst of all compatibilities
    const bestVideoMachineStatus = Math.max(...videoComps.map(x => x.machineStatus));
    const statuses = [
      emuComp.machineStatus,
      controlsComp.machineStatus,
      bestVideoMachineStatus
    ];
    const knownStatuses = statuses.filter(x => x !== MachineCompatibilityStatusEnum.UNKNOWN);
    
    const status = Math.min(...statuses);
    const knownStatus = knownStatuses.length > 0? Math.min(...knownStatuses) : MachineCompatibilityStatusEnum.UNKNOWN;
    
    return {
      machineNameInput,
      machine,
      videoComps,
      emuComp,
      controlsComp,
      status,
      knownStatus
    };
  });
}

/**
 * @param {string} machineNameInput 
 * @param {ModelineConfig[]} modelineConfigs 
 * @param {ControlPanelConfig} cpConfig 
 * @returns {MachineCompatibility}
 */
export async function checkMachine(machineNameInput, modelineConfigs, cpConfig) {
  return await checkMachineBulk([machineNameInput], modelineConfigs, cpConfig)[0];
}


// ----------------------------------
// Emulation
// ----------------------------------

/**
 * @typedef EmulationCompatibility
 * @property {Machine} machine
 * @property {number} status
 * @property {number} machineStatus
 */

/**
 * @param {Machine} machine
 * @returns {EmulationCompatibility}
 */
export function checkEmulation(machine) {
  const status = getEmulationStatus(machine);
  const machineStatus = emuToMachineCompatibilityStatus(status);
  
  return {
    machine,
    status,
    machineStatus
  };
}

/**
 * @param {Machine} machine 
 * @returns {number}
 */
function getEmulationStatus(machine) {
  if (!machine) return null;
  
  switch (machine.driver.status) {
    case 'preliminary': return EmulationCompatibilityStatusEnum.PRELIMINARY;
    case 'imperfect'  : return EmulationCompatibilityStatusEnum.IMPERFECT;
    case 'good'       : return EmulationCompatibilityStatusEnum.GOOD;
    default           : return EmulationCompatibilityStatusEnum.UNKNOWN;
  }
}


// ----------------------------------
// Video
// ----------------------------------

/**
 * @typedef VideoCompatibility
 * @property {Machine} machine
 * @property {ModelineConfig} modelineConfig
 * @property {ModelineResult} modelineResult
 * @property {number} status
 * @property {number} machineStatus
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
    
    const status = getVideoStatus(modelineResult);
    const machineStatus = videoToMachineCompatibilityStatus(status);
    
    return {
      machine,
      modelineConfig,
      modelineResult,
      status,
      machineStatus
    };
  });
}

/**
 * @param {ModelineResult} modelineResult 
 * @returns {number}
 */
function getVideoStatus(modelineResult) {
  if (!modelineResult || modelineResult.err) {
    return null;
  }
  
  if (!modelineResult.inRange) {
    return VideoCompatibilityStatusEnum.UNSUPPORTED;
  }
  
  if (
    modelineResult.modeline.interlace ||
    modelineResult.resStretch ||
    modelineResult.vfreqOff /*||
    modelineResult.xDiff !== 0 ||
    modelineResult.yDiff !== 0*/
  ) {
    return VideoCompatibilityStatusEnum.BAD;
  }
    
  if (modelineResult.vDiff !== 0) {
    return VideoCompatibilityStatusEnum.VFREQ_SLIGHTLY_OFF;
  }
  
  if (
    modelineResult.xScale !== 1 ||
    modelineResult.yScale !== 1
  ) {
    return VideoCompatibilityStatusEnum.INT_SCALE;
  }
  
  return VideoCompatibilityStatusEnum.NATIVE;
}


// ----------------------------------
// Controls
// ----------------------------------

/**
 * @typedef ControlsCompatibility
 * @property {Machine} machine
 * @property {ControlsDatGame} controlsDatGame
 * @property {ControlConfigurationCompatibility} controlConfigComp
 * @property {number} status
 * @property {number} machineStatus
 * 
 * @typedef ControlConfigurationCompatibility
 * @property {GameControlConfiguration} gameControlConfig
 * @property {ControlSetCompatibility[]} controlSetComps
 * @property {number} status
 * 
 * @typedef ControlSetCompatibility
 * @property {GameControlSet} gameControlSet
 * @property {ControlCompatibility[]} controlComps
 * @property {ButtonsCompatibility} buttonsComp
 * @property {number} status
 * 
 * @typedef ControlCompatibility
 * @property {GameControl} gameControl
 * @property {ControlPanelControl} cpControl
 * @property {number} controlStatus
 * @property {number} buttonsStatus
 * @property {number} status
 * 
 * @typedef ButtonsCompatibility
 * @property {GameButton[]} gameButtons
 * @property {ControlPanelButtonCluster} cpButtonCluster
 * @property {number} status
 */

/**
 * @param {Machine} machine
 * @param {ControlPanelConfig} cpConfig
 * @returns {ControlsCompatibility} 
 */
export function checkControls(machine, cpConfig) {
  // get controls.dat game
  const controlsDatGame = machine && (
    controlsDat.gameMap[machine.name] ||
    controlsDat.gameMap[machine.cloneof]
  );
  
  // find the most compatible game control configuration
  /** @type {ControlConfigurationCompatibility} */
  let bestControlConfigComp = null;
  if (controlsDatGame) {
    for (const gameControlConfig of controlsDatGame.controlConfigurations) {
      const controlConfigComp = getControlConfigCompatibility(cpConfig, gameControlConfig);
      
      if (
        !bestControlConfigComp ||
        controlConfigComp.status > bestControlConfigComp.status
      ) {
        bestControlConfigComp = controlConfigComp;
      }
    }
  }
  
  const status = bestControlConfigComp? bestControlConfigComp.status : ControlsCompatibilityStatusEnum.UNKNOWN;
  const machineStatus = controlsToMachineCompatibilityStatus(status);
  
  return {
    machine,
    controlsDatGame,
    controlConfigComp: bestControlConfigComp,
    status,
    machineStatus
  };
}

/**
 * @param {ControlPanelConfig} cpConfig 
 * @param {GameControlConfiguration} gameControlConfig 
 * @returns {ControlConfigurationCompatibility}
 */
function getControlConfigCompatibility(cpConfig, gameControlConfig) {
  /** @type {ControlPanelControl[]} */
  const cpAvailControls = cpConfig.controls.slice(0);
  /** @type {ControlPanelButtonCluster[]} */
  const cpAvailButtonClusters = cpConfig.buttonClusters.slice(0);
  
  // find the most compatible control panel control set for each game control set
  /** @type {ControlSetCompatibility[]} */
  const controlSetComps = gameControlConfig.controlSets.map(gameControlSet => {
    /** @type {ControlSetCompatibility} */
    let bestControlSetComp = {
      gameControlSet,
      controlComps: [],
      buttonsComp: null,
      status: ControlsCompatibilityStatusEnum.UNKNOWN
    };
    
    for (const cpControlSet of cpConfig.controlSets) {
      const controlSetComp = getControlSetCompatibility(cpControlSet, cpAvailControls, cpAvailButtonClusters, gameControlSet);
      if (controlSetComp.status > bestControlSetComp.status) {
        bestControlSetComp = controlSetComp;
      }
    }
    
    // remove used control panel controls so they can't be used again
    if (bestControlSetComp.status > ControlsCompatibilityStatusEnum.UNSUPPORTED) {
      for (const controlComp of bestControlSetComp.controlComps) {
        if (controlComp.status > ControlsCompatibilityStatusEnum.UNSUPPORTED) {
          removeVal(cpAvailControls, controlComp.cpControl);
        }
      }
      
      if (
        bestControlSetComp.buttonsComp &&
        bestControlSetComp.buttonsComp.status > ControlsCompatibilityStatusEnum.UNSUPPORTED
      ) {
        removeVal(cpAvailButtonClusters, bestControlSetComp.buttonsComp.cpButtonCluster);
      }
    }
    
    return bestControlSetComp;
  });
  
  // get the worst compatibility of the required control sets
  const worstCompStatus = Math.min(
    ...controlSetComps
    .filter(x => x.gameControlSet.isRequired)
    .map(x => x.status)
  );
  
  // TODO: check gameControlConfig.menuButtons
  const status = worstCompStatus;
  
  return {
    gameControlConfig,
    controlSetComps,
    status
  };
}

/**
 * @param {ControlPanelControlSet} cpControlSet 
 * @param {ControlPanelControl[]} cpAvailControls 
 * @param {ControlPanelButtonCluster[]} cpAvailButtonClusters 
 * @param {GameControlSet} gameControlSet 
 * @returns {ControlSetCompatibility}
 */
function getControlSetCompatibility(cpControlSet, cpAvailControls, cpAvailButtonClusters, gameControlSet) {
  // get the control panel controls in the control set that are available
  /** @type {ControlPanelControl[]} */
  const cpControlSetAvailControls = cpControlSet.controls.filter(control =>
    cpAvailControls.includes(control) &&
    control.isOnOppositeScreenSide === gameControlSet.isOnOppositeScreenSide
  );
  
  // find the most compatible control panel control for each game control
  /** @type {ControlCompatibility[]} */
  const controlComps = gameControlSet.controls.map(gameControl => {
    /** @type {ControlCompatibility} */
    let bestControlComp = {
      gameControl,
      cpControl: null,
      status: ControlsCompatibilityStatusEnum.UNSUPPORTED
    };
    
    for (const cpControl of cpControlSetAvailControls) {
      const controlComp = getControlCompatibility(cpControl, gameControl);
      if (controlComp.status > bestControlComp.status) {
        bestControlComp = controlComp;
      }
    }
    
    // remove used control panel controls so they can't be used again
    if (bestControlComp.status > ControlsCompatibilityStatusEnum.UNSUPPORTED) {
      removeVal(cpControlSetAvailControls, bestControlComp.cpControl);
    }
    
    return bestControlComp;
  });
  
  // get buttons compatability
  const buttonsComp = getButtonsComptability(
    cpControlSet.buttonCluster,
    cpAvailButtonClusters,
    gameControlSet.controlPanelButtons
  );
  
  // get the worst compatibility of the controls and buttons
  const worstCompStatus = Math.min(
    ...controlComps.map(x => x.status),
    ...buttonsComp? [buttonsComp.status] : []
  );
  
  const status = worstCompStatus;
  
  return {
    gameControlSet,
    controlComps,
    buttonsComp,
    status
  };
}

/**
 * @param {ControlPanelControl} cpControl 
 * @param {GameControl} gameControl 
 * @returns {ControlCompatibility}
 */
function getControlCompatibility(cpControl, gameControl) {
  const controlStatus = getControlCompatibilityControlStatus(cpControl, gameControl);
  const buttonsStatus = getControlCompatibilityButtonsStatus(cpControl, gameControl);
  
  const status = Math.min(controlStatus, buttonsStatus);
  
  return {
    gameControl,
    cpControl,
    controlStatus,
    buttonsStatus,
    status
  };
}

/**
 * @param {ControlPanelControl} cpControl 
 * @param {GameControl} gameControl 
 * @returns {number}
 */
function getControlCompatibilityControlStatus(cpControl, gameControl) {
  const cpControlDef = cpControl.controlDef;
  const gameControlDef = controlDefMap[gameControl.type];
  
  if (cpControlDef.type === gameControl.type) {
    return ControlsCompatibilityStatusEnum.NATIVE;
  }
  
  const controlFallback = (gameControlDef.fallbacks || []).find(x => x.controlType === cpControlDef.type);
  if (!controlFallback) {
    return ControlsCompatibilityStatusEnum.UNSUPPORTED;
  }
  
  switch (controlFallback.level) {
    case 'good': return ControlsCompatibilityStatusEnum.GOOD;
    case 'ok'  : return ControlsCompatibilityStatusEnum.OK;
    case 'bad' : return ControlsCompatibilityStatusEnum.BAD;
    default    : return ControlsCompatibilityStatusEnum.UNKNOWN;
  }
}

/**
 * @param {ControlPanelControl} cpControl 
 * @param {GameControl} gameControl 
 * @returns {number}
 */
function getControlCompatibilityButtonsStatus(cpControl, gameControl) {
  const isSupported = (
    cpControl.numButtons >= gameControl.buttons.length
  );
  
  return (
    isSupported
    ? ControlsCompatibilityStatusEnum.NATIVE
    : ControlsCompatibilityStatusEnum.UNSUPPORTED
  );
}

/**
 * @param {ControlPanelButtonCluster} cpButtonCluster 
 * @param {ControlPanelButtonCluster[]} cpAvailButtonClusters 
 * @param {GameButton[]} gameButtons 
 * @returns {ButtonsCompatibility}
 */
function getButtonsComptability(cpButtonCluster, cpAvailButtonClusters, gameButtons) {
  if (gameButtons.length === 0) {
    return null;
  }
  
  const isSupported = (
    cpAvailButtonClusters.includes(cpButtonCluster) &&
    cpButtonCluster.numButtons >= gameButtons.length
  );
  
  const status = (
    isSupported
    ? ControlsCompatibilityStatusEnum.NATIVE
    : ControlsCompatibilityStatusEnum.UNSUPPORTED
  );
  
  return {
    gameButtons,
    cpButtonCluster,
    status
  };
}

/**
 * @param {any[]} arr 
 * @param {any} val 
 * @returns {any[]}
 */
function removeVal(arr, val) {
  const index = arr.indexOf(val);
  if (index > -1) {
    arr.splice(index, 1);
  }
  return arr;
}