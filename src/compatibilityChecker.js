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
  return machineMap[machineNameInput.trim().toLowerCase()] || null;
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
    const bestVideoStatus = Math.max(...videoComps.map(x => x.status));
    const statuses = [
      emuToMachineCompatibilityStatus     (emuComp.status),
      controlsToMachineCompatibilityStatus(controlsComp.status),
      videoToMachineCompatibilityStatus   (bestVideoStatus)
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
 */

/**
 * @param {Machine} machine
 * @returns {EmulationCompatibility}
 */
export function checkEmulation(machine) {
  const status = getEmulationStatus(machine);
  
  return {
    machine,
    status
  };
}

/**
 * @param {Machine} machine 
 * @returns {number}
 */
function getEmulationStatus(machine) {
  if (!machine) {
    return EmulationCompatibilityStatusEnum.UNKNOWN;
  }
  
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
    const modelineResult = (machine && modelineResultMap[machine.name]) || null;
    
    const status = getVideoStatus(modelineResult);
    
    return {
      machine,
      modelineConfig,
      modelineResult,
      status
    };
  });
}

/**
 * @param {ModelineResult} modelineResult 
 * @returns {number}
 */
function getVideoStatus(modelineResult) {
  if (!modelineResult || modelineResult.err) {
    return VideoCompatibilityStatusEnum.UNKNOWN;
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
 * @property {ControlPanelConfig} cpConfig
 * @property {ControlsDatGame} controlsDatGame
 * @property {ControlConfigurationCompatibility} bestControlConfigComp
 * @property {ControlConfigurationCompatibility[]} allControlConfigComp
 * @property {number} status
 * 
 * 
 * @typedef ControlConfigurationCompatibility
 * @property {GameControlConfiguration} gameControlConfig
 * @property {ControlSetCompatibility[]} controlSetComps
 * @property {number} status
 * @property {MultidimensionalScore} score
 * @property {ControlConfigurationCompatibilityMeta} meta
 * 
 * @typedef ControlConfigurationCompatibilityMeta
 * @property {BestAvailableControlSetCompatibilityContext[]} bestAvailableControlSetCompContexts
 * 
 * 
 * @typedef BestAvailableControlSetCompatibilityContext
 * @property {GameControlSet} gameControlSet
 * @property {number} stateProcessedOrder
 * @property {ControlPanelControl[]} stateCPAvailControls
 * @property {ControlPanelButtonCluster[]} stateCPAvailButtonClusters
 * @property {ControlSetCompatibility} bestControlSetComp
 * @property {ControlSetCompatibility[]} allControlSetComps
 * 
 * @typedef ControlSetCompatibility
 * @property {GameControlSet} gameControlSet
 * @property {ControlCompatibility[]} controlComps
 * @property {ButtonsCompatibility} buttonsComp
 * @property {number} status
 * @property {MultidimensionalScore} score
 * @property {ControlSetCompatibilityMeta} meta
 * 
 * @typedef ControlSetCompatibilityMeta
 * @property {BestAvailableControlCompContext[]} bestAvailableControlCompContexts
 * 
 * 
 * @typedef BestAvailableControlCompatibilityContext
 * @property {GameControl} gameControl
 * @property {number} stateProcessedOrder
 * @property {ControlPanelControl[]} sateCPControlSetAvailControls
 * @property {ControlCompatibility} bestControlComp
 * @property {ControlCompatibility[]} allControlComps
 * 
 * @typedef ControlCompatibility
 * @property {GameControl} gameControl
 * @property {ControlPanelControl} [cpControl]
 * @property {number} controlStatus
 * @property {number} buttonsStatus
 * @property {number} status
 * @property {MultidimensionalScore} score
 * 
 * 
 * 
 * @typedef ButtonsCompatibility
 * @property {GameButton[]} gameButtons
 * @property {ControlPanelButtonCluster} cpButtonCluster
 * @property {number} status
 * @property {MultidimensionalScore} score
 * 
 * @typedef ButtonsCompatibilityContext
 * @property {number} stateProcessedOrder
 */

/**
 * @param {Machine} machine
 * @param {ControlPanelConfig} cpConfig
 * @returns {ControlsCompatibility} 
 */
export function checkControls(machine, cpConfig) {
  // get controls.dat game
  const controlsDatGame = (
    machine && (
      controlsDat.gameMap[machine.name] ||
      controlsDat.gameMap[machine.cloneof]
    )
  ) || null;
  
  // get the compatibility of all game control configurations
  const gameControlConfigs = controlsDatGame? controlsDatGame.controlConfigurations : [];
  
  /** @type {ControlConfigurationCompatibility[]} */
  const allControlConfigComps = gameControlConfigs.map(gameControlConfig => 
    getControlConfigCompatibility(cpConfig, gameControlConfig)
  );
  
  // find the best compatible game control configuration
  allControlConfigComps.sort((a, b) =>
    // prefer best status disregarding unknown (-1) status
    (min0(b.status) - min0(a.status)) ||
    
    // prefer upright configs
    compareBoolean(
      a.gameControlConfig.targetCabinetType === 'upright',
      b.gameControlConfig.targetCabinetType === 'upright'
    ) ||
    
    // prefer best score
    compareScores(b.score, a.score)
  );
  
  const bestControlConfigComp = allControlConfigComps[0] || null;
  
  const status = bestControlConfigComp? bestControlConfigComp.status : ControlsCompatibilityStatusEnum.UNKNOWN;
  
  return {
    machine,
    cpConfig,
    controlsDatGame,
    bestControlConfigComp,
    allControlConfigComps,
    status,
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
  /** @type {ControlPanelControlSet[]} */
  const cpControlSets = cpConfig.controlSets.slice(0);
  
  // if there are no CP control sets, create an empty one
  if (cpControlSets.length === 0) {
    cpControlSets.push({
      controls: [],
      buttonCluster: null
    });
  }
  
  // for each game control set, find the best compatible CP control set
  /** @type {BestAvailableControlSetCompatibilityContext[]} */
  const bestAvailableControlSetCompContexts = gameControlConfig.controlSets.map((gameControlSet, stateProcessedOrder) => {
    const stateCPAvailControls       = cpAvailControls      .slice(0);
    const stateCPAvailButtonClusters = cpAvailButtonClusters.slice(0);
    
    // get the compatibility of all CP sets
    /** @type {ControlSetCompatibility[]} */
    const allControlSetComps = cpControlSets.map(cpControlSet => 
      getControlSetCompatibility(cpControlSet, stateCPAvailControls, stateCPAvailButtonClusters, gameControlSet)
    );
    
    // prefer best score
    allControlSetComps.sort((a, b) => compareScores(b.score, a.score));
    const bestControlSetComp = allControlSetComps[0];
    
    if (bestControlSetComp.status > ControlsCompatibilityStatusEnum.UNSUPPORTED) {
      // remove used CP controls so they can't be used again
      for (const controlComp of bestControlSetComp.controlComps) {
        if (controlComp.status > ControlsCompatibilityStatusEnum.UNSUPPORTED) {
          removeVal(cpAvailControls, controlComp.cpControl);
        }
      }
      
      // remove used CP button clusters so they can't be used again
      if (bestControlSetComp.buttonsComp.status > ControlsCompatibilityStatusEnum.UNSUPPORTED) {
        removeVal(cpAvailButtonClusters, bestControlSetComp.buttonsComp.cpButtonCluster);
      }
    }
    
    return {
      gameControlSet,
      stateProcessedOrder,
      stateCPAvailControls,
      stateCPAvailButtonClusters,
      bestControlSetComp,
      allControlSetComps
    };
  });
  const controlSetComps = bestAvailableControlSetCompContexts.map(x => x.bestControlSetComp);
  
  const requiredControlSetComps = [];
  const optionalControlSetComps = [];
  for (const controlSetComp of controlSetComps) {
    if (controlSetComp.gameControlSet.isRequired) {
      requiredControlSetComps.push(controlSetComp);
    }
    else {
      optionalControlSetComps.push(controlSetComp);
    }
  }
  
  // get the worst compatibility of the required control sets
  const status = Math.min(...requiredControlSetComps.map(x => x.status));
  
  const score = createScore(
    ['controlConfigComp.status',                         status                                                 ],
    ['controlConfigComp.requiredControlSetCompScoreSum', sumScores(...requiredControlSetComps.map(x => x.score))],
    ['controlConfigComp.optionalControlSetCompScoreSum', sumScores(...optionalControlSetComps.map(x => x.score))]
  );
  
  // TODO: check gameControlConfig.menuButtons
  
  return {
    gameControlConfig,
    controlSetComps,
    status,
    score,
    meta: {
      bestAvailableControlSetCompContexts
    }
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
  // get the CP controls in the control set that are available
  /** @type {ControlPanelControl[]} */
  const cpControlSetAvailControls = cpControlSet.controls.filter(cpControl =>
    cpAvailControls.includes(cpControl) &&
    cpControl.isOnOppositeScreenSide === gameControlSet.isOnOppositeScreenSide
  );
  
  // get the CP button cluster in the control set if it is available
  const cpButtonCluster = cpControlSet.buttonCluster;
  const cpControlSetAvailButtonCluster = (
    cpButtonCluster &&
    cpAvailButtonClusters.includes(cpButtonCluster) &&
    cpButtonCluster.isOnOppositeScreenSide === gameControlSet.isOnOppositeScreenSide
  )? cpButtonCluster : null;
  
  // find the most compatible CP control for each game control
  /** @type {BestAvailableControlCompatibilityContext[]} */
  const bestAvailableControlCompContexts = gameControlSet.controls.map((gameControl, stateProcessedOrder) => {
    const sateCPControlSetAvailControls = cpControlSetAvailControls.slice(0);
    
    // get the compatibility of all available CP controls in the set
    const allControlComps = sateCPControlSetAvailControls.map(cpControl => 
      getControlCompatibility(cpControl, gameControl)
    );
    
    // prefer best score
    allControlComps.sort((a, b) => compareScores(b.score, a.score));
    let bestControlComp = allControlComps[0];
    
    // if the best compatibile control status is unsupported (not considering button status), ignore it
    if (
      !bestControlComp ||
      bestControlComp.controlStatus <= ControlsCompatibilityStatusEnum.UNSUPPORTED
    ) {
      bestControlComp = getControlCompatibility(null, gameControl);
    }
    
    // remove used CP controls so they can't be used again
    if (bestControlComp.status > ControlsCompatibilityStatusEnum.UNSUPPORTED) {
      removeVal(cpControlSetAvailControls, bestControlComp.cpControl);
    }
    
    return {
      gameControl,
      stateProcessedOrder,
      sateCPControlSetAvailControls,
      bestControlComp,
      allControlComps
    };
  });
  const controlComps = bestAvailableControlCompContexts.map(x => x.bestControlComp);
  
  // get buttons compatibility
  const buttonsComp = getButtonsComptability(
    cpControlSetAvailButtonCluster,
    gameControlSet.controlPanelButtons
  );
  
  // get the worst compatibility of the controls and buttons
  const status = Math.min(
    ...controlComps.map(x => x.status),
    buttonsComp.status
  );
  
  const score = createScore(
    ['controlSetComp.status',              status                                      ],
    ['controlSetComp.controlCompScoreSum', sumScores(...controlComps.map(x => x.score))],
    ['controlSetComp.buttonCompScore',     buttonsComp.score                           ]
  );
  
  return {
    gameControlSet,
    controlComps,
    buttonsComp,
    status,
    score,
    meta: {
      bestAvailableControlCompContexts
    }
  };
}

/**
 * @param {ControlPanelControl} cpControl 
 * @param {GameControl} gameControl 
 * @returns {ControlCompatibility}
 */
function getControlCompatibility(cpControl, gameControl) {
  const controlStatus = cpControl? getControlCompatibilityControlStatus(cpControl, gameControl) : ControlsCompatibilityStatusEnum.UNSUPPORTED;
  const buttonsStatus = cpControl? getControlCompatibilityButtonsStatus(cpControl, gameControl) : ControlsCompatibilityStatusEnum.UNSUPPORTED;
  
  const status = Math.min(controlStatus, buttonsStatus);
  const score = createScore(
    ['controlComp.status',        status       ],
    ['controlComp.controlStatus', controlStatus],
    ['controlComp.buttonsStatus', buttonsStatus]
  );
  
  return {
    gameControl,
    cpControl,
    controlStatus,
    buttonsStatus,
    status,
    score
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
  return (
    cpControl.numButtons >= gameControl.buttons.length
    ? ControlsCompatibilityStatusEnum.NATIVE
    : ControlsCompatibilityStatusEnum.UNSUPPORTED
  );
}

/**
 * @param {ControlPanelButtonCluster} cpButtonCluster 
 * @param {GameButton[]} gameButtons 
 * @returns {ButtonsCompatibility}
 */
function getButtonsComptability(cpButtonCluster, gameButtons) {
  /** @type {ButtonsCompatibility} */
  const buttonComp = {
    gameButtons
  };
  
  // check if the game requires any buttons
  if (gameButtons.length === 0) {
    // don't need to use the CP button cluster
    buttonComp.cpButtonCluster = null;
    buttonComp.status = ControlsCompatibilityStatusEnum.NATIVE;
  }
  // check if the CP button cluster is available
  else if (!cpButtonCluster) {
    // can't use the CP button cluster
    buttonComp.cpButtonCluster = null;
    buttonComp.status = ControlsCompatibilityStatusEnum.UNSUPPORTED;
  }
  else {
    // use the CP button cluster
    buttonComp.cpButtonCluster = cpButtonCluster;
    buttonComp.status = (
      cpButtonCluster.numButtons >= gameButtons.length
      ? ControlsCompatibilityStatusEnum.NATIVE
      : ControlsCompatibilityStatusEnum.UNSUPPORTED
    );
  }
  
  buttonComp.score = createScore(
    ['buttonComp.status', buttonComp.status]
  );
  
  return buttonComp;
}

/**
 * @typedef MultidimensionalScore
 * @property {ScoreDimension[]} dims
 * 
 * @typedef ScoreDimension
 * @property {string} key
 * @property {number | MultidimensionalScore} val
 */

/**
 * @param {...[string, number | MultidimensionalScore]} entries 
 * @return {MultidimensionalScore}
 */
function createScore(...entries) {
  /** @type {MultidimensionalScore[]} */
  const score = {dims: []};
  
  for (let i = 0; i < entries.length; ++i) {
    const [key, val] = entries[i];
    
    if (!key || typeof key !== 'string') {
      throw new Error(`Invalid score key. entries[${i}][0]`);
    }
    
    if (typeof val === 'number') {
      if (val < 0) {
        throw new Error(`Negative score value. entries[${i}][1]`);
      }
    }
    else if (!val || !Array.isArray(val.dims)) {
      throw new Error(`Invalid score value. entries[${i}][1]`);
    }
    
    score.dims.push({key, val});
  }
  
  return score;
}

/**
 * @param {...MultidimensionalScore} scores 
 * @return {MultidimensionalScore}
 */
function sumScores(...scores) {
  /** @type {MultidimensionalScore} */
  const sumScore = {dims: []};
  
  // find the first non-empty score
  let keyScoreIndex = 0;
  while (keyScoreIndex < scores.length && scores[keyScoreIndex].dims.length === 0) {
    ++keyScoreIndex;
  }
  
  if (keyScoreIndex === scores.length) {
    return sumScore;
  }
  
  // copy values from key score
  for (let dimIndex = 0; dimIndex < scores[keyScoreIndex].dims.length; ++dimIndex) {
    const dim = scores[keyScoreIndex].dims[dimIndex];
    
    sumScore.dims[dimIndex] = {
      key: dim.key,
      val: dim.val
    };
  }
  
  for (let scoreIndex = keyScoreIndex + 1; scoreIndex < scores.length; ++scoreIndex) {
    // empty scores (scores with 0 dimensions) should be treated as all 0s and ignored
    if (scores[scoreIndex].dims.length === 0) {
      continue;
    }
    
    for (let dimIndex = 0; dimIndex < sumScore.dims.length; ++dimIndex) {
      const dim = scores[scoreIndex].dims[dimIndex];
      if (!dim) {
        throw new Error(`Attempting to add scores of different sizes. scores[${keyScoreIndex}].dims.length === ${sumScore.dims.length}, scores[${scoreIndex}].dims.length === ${scores[scoreIndex].dims.length}`);
      }
      
      const sumDim = sumScore.dims[dimIndex];
      if (sumDim.key !== dim.key) {
        throw new Error(`Attempting to add scores with different structures. scores[${keyScoreIndex}].dims[${dimIndex}].key === '${sumDim.key}', scores[${scoreIndex}].dims[${dimIndex}].key === '${dim.key}'`);
      }
      if (typeof sumDim.val !== typeof dim.val) {
        throw new Error(`Attempting to add scores with different structures. typeof scores[${keyScoreIndex}].dims[${dimIndex}].val === ${typeof sumDim.val}, typeof scores[${scoreIndex}].dims[${dimIndex}].val === ${typeof dim.val}`);
      }
      
      if (typeof sumDim.val === 'number') {
        sumDim.val += dim.val;
      }
      else {
        sumDim.val = sumScores(sumDim.val, dim.val);
      }
    }
  }
  
  return sumScore;
}

/**
 * @param {MultidimensionalScore} scoreA 
 * @param {MultidimensionalScore} scoreB 
 * @return {number}
 */
function compareScores(scoreA, scoreB) {
  // empty scores (scores with 0 dimensions) should always compare lower
  const scoreAIsEmpty = scoreA.dims.length === 0;
  const scoreBIsEmpty = scoreB.dims.length === 0;
  if (scoreAIsEmpty && scoreBIsEmpty) return 0;
  if (scoreAIsEmpty) return -1;
  if (scoreBIsEmpty) return 1;
 
  if (scoreA.dims.length !== scoreB.dims.length) {
    throw new Error(`Attempting to compare scores of different sizes. scoreA.dims.length === ${scoreA.dims.length}, scoreB.dims.length === ${scoreB.dims.length}`);
  }
  
  for (let dimIndex = 0; dimIndex < scoreA.dims.length; ++dimIndex) {
    const dimA = scoreA.dims[dimIndex];
    const dimB = scoreB.dims[dimIndex];
    
    if (dimA.key !== dimB.key) {
      throw new Error(`Attempting to add scores with different structures. scoreA.dims[${dimIndex}].key === ${dimA.key}, scoreB.dims[${dimIndex}].key === ${dimB.key}`);
    }
    if (typeof dimA.val !== typeof dimB.val) {
      throw new Error(`Attempting to add scores with different structures. typeof scoreA.dims[${dimIndex}].val === ${typeof dimA.val}, typeof scoreB.dims[${dimIndex}].val === ${typeof dimB.val}`);
    }
    
    if (typeof dimA.val === 'number') {
      if (dimA.val < dimB.val) {
        return -1;
      }
      if (dimA.val > dimB.val) {
        return 1;
      }
    }
    else {
      const diff = compareScores(dimA.val, dimB.val);
      if (diff !== 0) {
        return diff;
      }
    }
  }
  
  return 0;
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

function compareBoolean(a, b) {
  if (a === b) return 0;
  if (a) return -1;
  return 1;
}

function min0(num) {
  if (num < 0) return 0;
  return num;
}