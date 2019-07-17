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
 * 
 * @typedef ControlConfigurationCompatibility
 * @property {GameControlConfiguration} gameControlConfig
 * @property {ControlSetCompatibility[]} controlSetComps
 * @property {number} status
 * @property {MultidimensionalScore} score
 * 
 * @typedef ControlSetCompatibility
 * @property {GameControlSet} gameControlSet
 * @property {ControlCompatibility[]} controlComps
 * @property {ButtonsCompatibility} buttonsComp
 * @property {number} status
 * @property {MultidimensionalScore} score
 * 
 * @typedef ControlCompatibility
 * @property {GameControl} gameControl
 * @property {ControlPanelControl} [cpControl]
 * @property {number} controlStatus
 * @property {number} buttonsStatus
 * @property {number} status
 * @property {MultidimensionalScore} score
 * 
 * @typedef ButtonsCompatibility
 * @property {GameButton[]} gameButtons
 * @property {ControlPanelButtonCluster} cpButtonCluster
 * @property {number} status
 * @property {MultidimensionalScore} score
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
  
  return {
    machine,
    controlsDatGame,
    controlConfigComp: bestControlConfigComp,
    status
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
  
  // create an empty control panel control set if there are none
  if (cpControlSets.length === 0) {
    cpControlSets.push({
      controls: [],
      buttonCluster: null
    });
  }
  
  // find the most compatible control panel control set for each game control set
  /** @type {ControlSetCompatibility[]} */
  const controlSetComps = gameControlConfig.controlSets.map(gameControlSet => {
    
    // get the compatibility of all control panel sets
    const controlSetComps = cpControlSets.map(cpControlSet => 
      getControlSetCompatibility(cpControlSet, cpAvailControls, cpAvailButtonClusters, gameControlSet)
    );
    
    // order best score first
    controlSetComps.sort((a, b) => compareScores(b.score, a.score));
    const bestControlSetComp = controlSetComps[0];
    
    if (bestControlSetComp.status > ControlsCompatibilityStatusEnum.UNSUPPORTED) {
      // remove used control panel controls so they can't be used again
      for (const controlComp of bestControlSetComp.controlComps) {
        if (controlComp.status > ControlsCompatibilityStatusEnum.UNSUPPORTED) {
          removeVal(cpAvailControls, controlComp.cpControl);
        }
      }
      
      // remove used control panel button clusters so they can't be used again
      if (bestControlSetComp.buttonsComp.status > ControlsCompatibilityStatusEnum.UNSUPPORTED) {
        removeVal(cpAvailButtonClusters, bestControlSetComp.buttonsComp.cpButtonCluster);
      }
    }
    
    return bestControlSetComp;
  });
  
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
    score
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
    // get the compatibility of all available control panel controls in the set
    const controlComps = cpControlSetAvailControls.map(cpControl => 
      getControlCompatibility(cpControl, gameControl)
    );
    
    // order best score first
    controlComps.sort((a, b) => compareScores(b.score, a.score));
    let bestControlComp = controlComps[0];
    
    // if the best compatibile control status is unsupported (not considering button status), ignore it
    if (
      !bestControlComp ||
      bestControlComp.controlStatus <= ControlsCompatibilityStatusEnum.UNSUPPORTED
    ) {
      bestControlComp = getControlCompatibility(null, gameControl);
    }
    
    // remove used control panel controls so they can't be used again
    if (bestControlComp.status > ControlsCompatibilityStatusEnum.UNSUPPORTED) {
      removeVal(cpControlSetAvailControls, bestControlComp.cpControl);
    }
    
    return bestControlComp;
  });
  
  // get buttons compatibility
  const buttonsComp = getButtonsComptability(
    cpControlSet.buttonCluster,
    cpAvailButtonClusters,
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
    score
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
 * @param {ControlPanelButtonCluster[]} cpAvailButtonClusters 
 * @param {GameButton[]} gameButtons 
 * @returns {ButtonsCompatibility}
 */
function getButtonsComptability(cpButtonCluster, cpAvailButtonClusters, gameButtons) {
  /** @type {ButtonsCompatibility} */
  const comp = {
    gameButtons
  };
  
  // check if the game requires any buttons
  if (gameButtons.length === 0) {
    // don't need to use the control panel button cluster
    comp.cpButtonCluster = null;
    comp.status = ControlsCompatibilityStatusEnum.NATIVE;
  }
  // check if the control panel button cluster is available
  else if (
    !cpButtonCluster ||
    !cpAvailButtonClusters.includes(cpButtonCluster)
  ) {
    // can't use the control panel button cluster
    comp.cpButtonCluster = null;
    comp.status = ControlsCompatibilityStatusEnum.UNSUPPORTED;
  }
  else {
    // use the control panel button cluster
    comp.cpButtonCluster = cpButtonCluster;
    comp.status = (
      cpButtonCluster.numButtons >= gameButtons.length
      ? ControlsCompatibilityStatusEnum.NATIVE
      : ControlsCompatibilityStatusEnum.UNSUPPORTED
    );
  }
  
  comp.score = createScore(
    ['buttonComp.status', comp.status]
  );
  
  return comp;
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
  
  if (scores.length === 0) {
    return sumScore;
  }
  
  for (let dimIndex = 0; dimIndex < scores[0].dims.length; ++dimIndex) {
    for (let scoreIndex = 0; scoreIndex < scores.length; ++scoreIndex) {
      const dim = scores[scoreIndex].dims[dimIndex];
      
      if (scoreIndex === 0) {
        sumScore.dims[dimIndex] = {
          key: dim.key,
          val: dim.val
        };
      }
      else {
        let sumDim = sumScore.dims[dimIndex];
        
        if (!dim) {
          throw new Error(`Attempting to add scores of different sizes. scores[0].dims.length === ${scores[0].length}, scores[${scoreIndex}].dims.length === ${scores[scoreIndex].length}`);
        }
        if (sumDim.key !== dim.key) {
          throw new Error(`Attempting to add scores with different structures. scores[0].dims[${dimIndex}].key === ${sumDim.key}, scores[${scoreIndex}][${dimIndex}].key === ${dim.key}`);
        }
        if (typeof sumDim.val !== typeof dim.val) {
          throw new Error(`Attempting to add scores with different structures. typeof scores[0].dims[${dimIndex}].val === ${typeof sumDim.val}, typeof scores[${scoreIndex}].dims[${dimIndex}].val === ${typeof dim.val}`);
        }
        
        if (typeof sumDim.val === 'number') {
          sumDim.val += dim.val;
        }
        else {
          sumDim.val = sumScores(sumDim.val, dim.val);
        }
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
  if (scoreA.dims.length !== scoreB.dims.length) {
    throw new Error(`Attempting to compare scores of different sizes. scoreA.dims.length === ${scoreA.dims.length}, scoreB.dims.length === ${scoreB.dims.length}`);
  }
  
  for (let dimIndex = 0; dimIndex < scoreA.dims.length; ++dimIndex) {
    const dimA = scoreA.dims[dimIndex];
    const dimB = scoreB.dims[dimIndex];
    
    if (dimA.key !== dimB.key) {
      throw new Error(`Attempting to add scores with different structures. scoreA.dims[${dimIndex}].key === ${dimA.key}, scoreB[${dimIndex}].key === ${dimB.key}`);
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

///**
// * @param {...number[]} nums 
// * @return {number}
// */
//const tens = [
//  1,
//  10,
//  100,
//  1000,
//  10000,
//  100000,
//  1000000,
//  10000000,
//  100000000,
//  1000000000,
//  10000000000,
//  100000000000,
//  1000000000000,
//  10000000000000,
//  100000000000000,
////9007199254740991 (Number.MAX_SAFE_INTEGER)
//];
//function calcScore(...nums) {
//  if (nums.length > tens.length) {
//    // Yes, this could be down with Math.pow(10, ...) but this is a
//    // lot faster and we should never have scores over 15 digits.
//    // We can always replace it if we need to.
//    throw new Error(`Too many values given. Cannot calculate score: nums.length = ${nums.length} > ${tens.length}`);
//  }
//  
//  let score = 0;
//  for (let i = 0; i < nums.length; ++i) {
//    if (nums[i] > 9) {
//      // this method requires each value to be between 0-9 as each
//      // value is stored in a digit. If values outside this range
//      // are required, an array-based solution should be used instead
//      throw new Error(`Value > 9 given. Cannot calculate score: nums[${i}] = ${nums[i]} > 9`);
//    }
//    score += tens[nums.length - 1 - i] * nums[i];
//  }
//  
//  return score;
//}


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