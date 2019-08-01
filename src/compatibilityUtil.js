import * as mameUtil           from './dataAccess/mameUtil';
import * as controlsDatUtil    from './dataAccess/controlsDatUtil';
import * as modelineCalculator from './dataAccess/modelineCalculator';
import {IMachine}              from './types/mame';
import {
  createScore,
  compareScores,
  sumScores
} from './multidimensionalScoreUtil';
import {
  IModelineConfig,
  IModelineResult,
} from './types/modeline';
import {
  IControlsDatGame,
  IGameControlConfiguration,
  IGameControlSet,
  IGameControl,
  IGameButton,
} from './types/controlsDat';
import {
  ICPConfiguration,
  ICPControl,
  ICPButtonCluster,
  ICPControlSet
} from './types/controlPanel';
import {
  IMachineCompatibility,
  IEmulationCompatibility,
  IVideoCompatibility,
  IControlsCompatibility,
  IControlConfigurationCompatibility,
  IControlSetCompatibility,
  IControlCompatibility,
  IButtonsCompatibility,
  IGameControlSetCompatibilityOptimizationRound,
  IGameControlSetCompatibilityOptimization,
  IGameControlCompatibilityOptimizationRound,
  IGameControlCompatibilityOptimization
} from './types/compatibility';
import {
  OverallCompatibilityStatus,
  EmulationCompatibilityStatus,
  VideoCompatibilityStatus,
  ControlsCompatibilityStatus,
  overallCompatibilityStatusEnum,
  emulationCompatibilityStatusEnum,
  videoCompatibilityStatusEnum,
  controlsCompatibilityStatusEnum,
} from './types/compatibilityEnums';
import {
  controlFallbackLevelEnum
} from './types/controlDefEnums';
import {
  cabinetTypeEnum
} from './types/commonEnums';
import {
  machineDriverStatusEnum
} from './types/mameEnums';


/**
 * @param {EmulationCompatibilityStatus} status
 * @returns {OverallCompatibilityStatus}
 */
export function emuToOverallCompatibilityStatus(status) {
  switch (status) {
    case emulationCompatibilityStatusEnum.UNKNOWN    : return overallCompatibilityStatusEnum.UNKNOWN;
    case emulationCompatibilityStatusEnum.PRELIMINARY: return overallCompatibilityStatusEnum.BAD;
    case emulationCompatibilityStatusEnum.IMPERFECT  : return overallCompatibilityStatusEnum.OK;
    case emulationCompatibilityStatusEnum.GOOD       : return overallCompatibilityStatusEnum.NATIVE;
    default                                          : return overallCompatibilityStatusEnum.UNKNOWN;
  }
}

/**
 * @param {ControlsCompatibilityStatus} status
 * @returns {OverallCompatibilityStatus}
 */
export function controlsToOverallCompatibilityStatus(status) {
  switch (status) {
    case controlsCompatibilityStatusEnum.UNKNOWN    : return overallCompatibilityStatusEnum.UNKNOWN;
    case controlsCompatibilityStatusEnum.UNSUPPORTED: return overallCompatibilityStatusEnum.UNSUPPORTED;
    case controlsCompatibilityStatusEnum.BAD        : return overallCompatibilityStatusEnum.BAD;
    case controlsCompatibilityStatusEnum.OK         : return overallCompatibilityStatusEnum.OK;
    case controlsCompatibilityStatusEnum.GOOD       : return overallCompatibilityStatusEnum.GOOD;
    case controlsCompatibilityStatusEnum.NATIVE     : return overallCompatibilityStatusEnum.NATIVE;
    default                                         : return overallCompatibilityStatusEnum.UNKNOWN;
  }
}

/**
 * @param {VideoCompatibilityStatus} status
 * @returns {OverallCompatibilityStatus}
 */
export function videoToOverallCompatibilityStatus(status) {
  switch (status) {
    case videoCompatibilityStatusEnum.UNKNOWN           : return overallCompatibilityStatusEnum.UNKNOWN;
    case videoCompatibilityStatusEnum.UNSUPPORTED       : return overallCompatibilityStatusEnum.UNSUPPORTED;
    case videoCompatibilityStatusEnum.BAD               : return overallCompatibilityStatusEnum.BAD;
    case videoCompatibilityStatusEnum.VFREQ_SLIGHTLY_OFF: return overallCompatibilityStatusEnum.OK;
    case videoCompatibilityStatusEnum.INT_SCALE         : return overallCompatibilityStatusEnum.GOOD;
    case videoCompatibilityStatusEnum.NATIVE            : return overallCompatibilityStatusEnum.NATIVE;
    default                                             : return overallCompatibilityStatusEnum.UNKNOWN;
  }
}


// ----------------------------------
// Machine
// ----------------------------------

/**
 * @param {string} machineNameInput 
 * @returns {IMachine | undefined}
 */
export function getMachineByInput(machineNameInput) {
  return mameUtil.getMachineByName(
    machineNameInput.trim().toLowerCase()
  );
}

/**
 * @param {string[]}          machineNameInputs 
 * @param {IModelineConfig[]} modelineConfigs 
 * @param {ICPConfiguration}  cpConfig 
 * @returns {Promise<IMachineCompatibility[]>}
 */
export async function checkMachineBulk(machineNameInputs, modelineConfigs, cpConfig) {
  const machines = machineNameInputs.map(machineNameInput =>
    getMachineByInput(machineNameInput)
  );
  
  // check video compatibility in bulk
  /** @type {IVideoCompatibility[][]} */
  const modelineConfigsVideoComps = [];
  for (let i = 0; i < modelineConfigs.length; ++i) {
    modelineConfigsVideoComps[i] = await checkVideoBulk(machines, modelineConfigs[i]);
  }
  
  return machines.map((machine, i) => {
    const machineNameInput = machineNameInputs[i];
    
    /** @type {IVideoCompatibility[]} */
    const videoComps = [];
    for (let j = 0; j < modelineConfigs.length; ++j) {
      videoComps[j] = modelineConfigsVideoComps[j][i];
    }
    
    // check emulation compatibility
    const emuComp = checkEmulation(machine);
    
    // check controls compatibility
    const controlsComp = checkControls(machine, cpConfig);
    
    // machine overall compatibility is worst of all compatibilities
    const bestVideoStatus = videoCompatibilityStatusEnum.max(...videoComps.map(x => x.status));
    const statuses = [
      emuToOverallCompatibilityStatus     (emuComp.status),
      controlsToOverallCompatibilityStatus(controlsComp.status),
      videoToOverallCompatibilityStatus   (bestVideoStatus)
    ];
    const knownStatuses = statuses.filter(x => x !== overallCompatibilityStatusEnum.UNKNOWN);
    
    const overallStatus = overallCompatibilityStatusEnum.min(...statuses);
    const knownOverallStatus = (
      knownStatuses.length > 0
      ? overallCompatibilityStatusEnum.min(...knownStatuses)
      : overallCompatibilityStatusEnum.UNKNOWN
    );
    
    /** @type {IMachineCompatibility} */
    const machineComp = {
      machineNameInput,
      machine,
      videoComps,
      emuComp,
      controlsComp,
      overallStatus,
      knownOverallStatus
    };
    return machineComp;
  });
}

/**
 * @param {string}            machineNameInput 
 * @param {IModelineConfig[]} modelineConfigs 
 * @param {ICPConfiguration}  cpConfig 
 */
export async function checkMachine(machineNameInput, modelineConfigs, cpConfig) {
  return (await checkMachineBulk([machineNameInput], modelineConfigs, cpConfig))[0];
}


// ----------------------------------
// Emulation
// ----------------------------------

/**
 * @param {IMachine|undefined} machine 
 * @returns {IEmulationCompatibility}
 */
export function checkEmulation(machine) {
  const status = getEmulationStatus(machine);
  
  return {
    machine,
    status
  };
}

/**
 * @param {IMachine|undefined} machine 
 * @returns {EmulationCompatibilityStatus}
 */
function getEmulationStatus(machine) {
  if (!machine) {
    return emulationCompatibilityStatusEnum.UNKNOWN;
  }
  
  switch (machine.driver.status) {
    case machineDriverStatusEnum.PRELIMINARY: return emulationCompatibilityStatusEnum.PRELIMINARY;
    case machineDriverStatusEnum.IMPERFECT  : return emulationCompatibilityStatusEnum.IMPERFECT;
    case machineDriverStatusEnum.GOOD       : return emulationCompatibilityStatusEnum.GOOD;
    default                                 : return emulationCompatibilityStatusEnum.UNKNOWN;
  }
}


// ----------------------------------
// Video
// ----------------------------------

/**
 * @param {IMachine}        machine 
 * @param {IModelineConfig} modelineConfig 
 * @returns {Promise<IVideoCompatibility>}
 */
export async function checkVideo(machine, modelineConfig) {
  return (await checkVideoBulk([machine], modelineConfig))[0];
}

/**
 * @param {Array<IMachine | undefined>} machines 
 * @param {IModelineConfig} modelineConfig 
 * @returns {Promise<IVideoCompatibility[]>}
 */
export async function checkVideoBulk(machines, modelineConfig) {
  // calculate modelines
  const modelineResultMap = await modelineCalculator.calcModelineBulk(modelineConfig, machines);
  
  // for each machine... 
  return machines.map(machine => {
    // get modeline result
    const modelineResult = machine && modelineResultMap.get(machine.name);
    
    const status = getVideoStatus(modelineResult);
    
    /** @type {IVideoCompatibility} */
    const videoComp = {
      machine,
      modelineConfig,
      modelineResult,
      status
    };
    return videoComp;
  });
}

/**
 * @param {IModelineResult | undefined} modelineResult 
 * @returns {VideoCompatibilityStatus}
 */
function getVideoStatus(modelineResult) {
  if (!modelineResult || modelineResult.err) {
    return videoCompatibilityStatusEnum.UNKNOWN;
  }
  
  if (!modelineResult.inRange) {
    return videoCompatibilityStatusEnum.UNSUPPORTED;
  }
  
  if (
    modelineResult.modeline.interlace ||
    modelineResult.resStretch ||
    modelineResult.vfreqOff /*||
    modelineResult.xDiff !== 0 ||
    modelineResult.yDiff !== 0*/
  ) {
    return videoCompatibilityStatusEnum.BAD;
  }
    
  if (modelineResult.vDiff !== 0) {
    return videoCompatibilityStatusEnum.VFREQ_SLIGHTLY_OFF;
  }
  
  if (
    modelineResult.xScale !== 1 ||
    modelineResult.yScale !== 1
  ) {
    return videoCompatibilityStatusEnum.INT_SCALE;
  }
  
  return videoCompatibilityStatusEnum.NATIVE;
}


// ----------------------------------
// Controls
// ----------------------------------

/**
 * @param {IMachine | undefined} machine 
 * @param {ICPConfiguration} cpConfig 
 * @returns {IControlsCompatibility}
 */
export function checkControls(machine, cpConfig) {
  // get controls.dat game
  /** @type {IControlsDatGame | undefined} */
  let controlsDatGame;
  if (machine) {
    controlsDatGame = controlsDatUtil.getGameByName(machine.name);
    if (!controlsDatGame && machine.cloneof) {
      controlsDatUtil.getGameByName(machine.cloneof);
    }
  }
  
  // get the compatibility of all game control configurations
  const gameControlConfigs = controlsDatGame? controlsDatGame.controlConfigurations : [];
  
  const allControlConfigComps = gameControlConfigs.map(
    gameControlConfig => getControlConfigCompatibility(cpConfig, gameControlConfig)
  );
  
  // find the best compatible game control configuration
  allControlConfigComps.sort((a, b) =>
    // prefer best status disregarding unknown (-1) status
    (min0(b.status.val) - min0(a.status.val)) ||
    
    // prefer upright configs
    compareBoolean(
      a.gameControlConfig.targetCabinetType === cabinetTypeEnum.UPRIGHT,
      b.gameControlConfig.targetCabinetType === cabinetTypeEnum.UPRIGHT
    ) ||
    
    // prefer best score
    compareScores(b.score, a.score)
  );
  
  const bestControlConfigComp = allControlConfigComps[0] || null;
  
  const status = bestControlConfigComp? bestControlConfigComp.status : controlsCompatibilityStatusEnum.UNKNOWN;
  
  /** @type {IControlsCompatibility} */
  const controlsComp = {
    machine,
    cpConfig,
    controlsDatGame,
    bestControlConfigComp,
    allControlConfigComps,
    status,
  };
  return controlsComp;
}

/**
 * @param {ICPConfiguration}          cpConfig 
 * @param {IGameControlConfiguration} gameControlConfig 
 * @returns {IControlConfigurationCompatibility}
 */
function getControlConfigCompatibility(cpConfig, gameControlConfig) {
  const cpAvailControls       = cpConfig.controls      .slice(0);
  const cpAvailButtonClusters = cpConfig.buttonClusters.slice(0);
  const cpControlSets         = cpConfig.controlSets   .slice(0);
  
  // if there are no CP control sets, create an empty one
  if (cpControlSets.length === 0) {
    cpControlSets.push({
      controls: [],
      buttonCluster: undefined
    });
  }
  
  /** @type {IGameControlSetCompatibilityOptimizationRound[]} */
  const gameControlSetCompOptRounds = [];
  const remainingGameControlSets = gameControlConfig.controlSets.slice(0);
  
  while (remainingGameControlSets.length > 0) {
    const roundCPAvailControls = cpAvailControls.slice(0);
    const roundCPAvailButtonClusters = cpAvailButtonClusters.slice(0);
    
    // for each game control set, find the best compatible CP control set
    const allGameControlSetCompOpts = remainingGameControlSets.map(gameControlSet => {
      
      // get the compatibility of all available CP sets
      const allControlSetComps = cpControlSets.map(cpControlSet => 
        getControlSetCompatibility(cpControlSet, roundCPAvailControls, roundCPAvailButtonClusters, gameControlSet)
      );
      
      // prefer best score
      allControlSetComps.sort((a, b) => compareScores(b.score, a.score));
      const bestControlSetComp = allControlSetComps[0];
      
      /** @type {IGameControlSetCompatibilityOptimization} */
      const gameControlSetCompOpt = {
        gameControlSet,
        bestControlSetComp,
        allControlSetComps
      };
      return gameControlSetCompOpt;
    });
    
    // prefer best score
    allGameControlSetCompOpts.sort((a, b) => compareScores(b.bestControlSetComp.score, a.bestControlSetComp.score));
    
    // for each optimization (best compatibile optimizations first)...
    /** @type {IGameControlSetCompatibilityOptimization[]} */
    const allocGameControlSetCompOpts = [];
    for (const controlSetCompOpt of allGameControlSetCompOpts) {
      // check if all the optimal CP controls are still available
      const isCPControlsAvail = (
        controlSetCompOpt.bestControlSetComp.controlComps.every(controlComp => 
          !controlComp.cpControl ||
          cpAvailControls.includes(controlComp.cpControl)
        )
      );
      
      // check if the optimal CP button cluster is still available
      const cpButtonCluster = controlSetCompOpt.bestControlSetComp.buttonsComp.cpButtonCluster;
      const isCPButtonClusterAvail = (
        !cpButtonCluster ||
        cpAvailButtonClusters.includes(cpButtonCluster)
      );
      
      if (!isCPControlsAvail || !isCPButtonClusterAvail) {
        continue;
      }
      
      // allocate the optimization's controls
      allocGameControlSetCompOpts.push(controlSetCompOpt);
      removeVal(remainingGameControlSets, controlSetCompOpt.gameControlSet);
      
      // remove the optimal CP controls so they can't be used again
      for (const controlComp of controlSetCompOpt.bestControlSetComp.controlComps) {
        if (controlComp.cpControl) {
          removeVal(cpAvailControls, controlComp.cpControl);
        }
      }
      
      // remove the optimal CP button cluster so it can't be used again
      if (cpButtonCluster) {
        removeVal(cpAvailButtonClusters, cpButtonCluster);
      }
    }
    
    gameControlSetCompOptRounds.push({
      roundCPAvailControls,
      roundCPAvailButtonClusters,
      allocGameControlSetCompOpts,
      allGameControlSetCompOpts
    });
  }
  
  // collect the allocated controls from each round of optimization
  /** @type {IControlSetCompatibility[]} */
  const controlSetComps = [];
  for (const gameControlSetCompOptRound of gameControlSetCompOptRounds) {
    for (const gameControlSetCompOpt of gameControlSetCompOptRound.allocGameControlSetCompOpts) {
      controlSetComps.push(gameControlSetCompOpt.bestControlSetComp);
    }
  }
  
  /** @type {IControlSetCompatibility[]} */
  const requiredControlSetComps = [];
  /** @type {IControlSetCompatibility[]} */
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
  const status = controlsCompatibilityStatusEnum.min(
    ...requiredControlSetComps.map(x => x.status)
  );
  
  const score = createScore(
    ['controlConfigComp.status',                         status                                                 ],
    ['controlConfigComp.requiredControlSetCompScoreSum', sumScores(...requiredControlSetComps.map(x => x.score))],
    ['controlConfigComp.optionalControlSetCompScoreSum', sumScores(...optionalControlSetComps.map(x => x.score))]
  );
  
  // TODO: check gameControlConfig.menuButtons
  
  /** @type {IControlConfigurationCompatibility} */
  const controlConfigComp = {
    gameControlConfig,
    controlSetComps,
    status,
    score,
    meta: {
      gameControlSetCompOptRounds
    }
  };
  return controlConfigComp;
}

/**
 * @param {ICPControlSet}      cpControlSet 
 * @param {ICPControl[]}       cpAvailControls 
 * @param {ICPButtonCluster[]} cpAvailButtonClusters 
 * @param {IGameControlSet}    gameControlSet 
 * @returns {IControlSetCompatibility}
 */
function getControlSetCompatibility(cpControlSet, cpAvailControls, cpAvailButtonClusters, gameControlSet) {
  // get the CP controls in the control set that are available
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
  )? cpButtonCluster : undefined;
  
  /**  @type {IGameControlCompatibilityOptimizationRound[]} */
  const gameControlCompOptRounds = [];
  const remainingGameControls = gameControlSet.controls.slice(0);
  
  while (remainingGameControls.length > 0) {
    const roundCPControlSetAvailControls = cpControlSetAvailControls.slice(0);
    
    // for each game control, find the most compatible CP control
    const allGameControlCompOpts = remainingGameControls.map(gameControl => {
      
      // get the compatibility of all available CP controls in the set
      const allControlComps = roundCPControlSetAvailControls.map(cpControl => 
        getControlCompatibility(cpControl, gameControl)
      );
      
      // prefer best score
      allControlComps.sort((a, b) => compareScores(b.score, a.score));
      let bestControlComp = allControlComps[0];
      
      // if the best compatibile control status is unsupported (not considering button status), ignore it
      if (
        !bestControlComp ||
        bestControlComp.controlStatus.val <= controlsCompatibilityStatusEnum.UNSUPPORTED.val
      ) {
        bestControlComp = getControlCompatibility(undefined, gameControl);
      }
      
      /** @type {IGameControlCompatibilityOptimization} */
      const gameControlCompOpt = {
        gameControl,
        bestControlComp,
        allControlComps
      };
      return gameControlCompOpt;
    });
    
    // prefer best score
    allGameControlCompOpts.sort((a, b) => compareScores(b.bestControlComp.score, a.bestControlComp.score));
    
    // for each optimization (best compatibile optimizations first)...
    const allocGameControlCompOpts = [];
    for (const controlCompOpt of allGameControlCompOpts) {
      const cpControl = controlCompOpt.bestControlComp.cpControl;
      
      // if the optimal CP control is still available
      // (or if the optimization is not compatibile with any CP control)
      if (
        !cpControl ||
        cpControlSetAvailControls.includes(cpControl)
      ) {
        // allocate the optimization's controls
        allocGameControlCompOpts.push(controlCompOpt);
        removeVal(remainingGameControls, controlCompOpt.gameControl);
        
        // remove the optimal CP control so it can't be used again
        if (cpControl) {
          removeVal(cpControlSetAvailControls, cpControl);
        }
      }
    }
    
    gameControlCompOptRounds.push({
      roundCPControlSetAvailControls,
      allocGameControlCompOpts,
      allGameControlCompOpts
    });
  }
  
  // collect the allocated controls from each round of optimization
  /** @type {IControlCompatibility[]} */
  const controlComps = [];
  for (const gameControlCompOptRound of gameControlCompOptRounds) {
    for (const gameControlCompOpt of gameControlCompOptRound.allocGameControlCompOpts) {
      controlComps.push(gameControlCompOpt.bestControlComp);
    }
  }
  
  // get buttons compatibility
  const buttonsComp = getButtonsComptability(
    cpControlSetAvailButtonCluster,
    gameControlSet.controlPanelButtons
  );
  
  // get the worst compatibility of the controls and buttons
  const status = controlsCompatibilityStatusEnum.min(
    ...controlComps.map(x => x.status),
    buttonsComp.status
  );
  
  const score = createScore(
    ['controlSetComp.status',              status                                      ],
    ['controlSetComp.controlCompScoreSum', sumScores(...controlComps.map(x => x.score))],
    ['controlSetComp.buttonCompScore',     buttonsComp.score                           ]
  );
  
  /** @type {IControlSetCompatibility} */
  const controlSetComp = {
    gameControlSet,
    controlComps,
    buttonsComp,
    status,
    score,
    meta: {
      gameControlCompOptRounds
    }
  };
  return controlSetComp;
}

/**
 * @param {ICPControl | undefined} cpControl 
 * @param {IGameControl}           gameControl 
 * @returns {IControlCompatibility}
 */
function getControlCompatibility(cpControl, gameControl) {
  const controlStatus = cpControl? getControlCompatibilityControlStatus(cpControl, gameControl) : controlsCompatibilityStatusEnum.UNSUPPORTED;
  const buttonsStatus = cpControl? getControlCompatibilityButtonsStatus(cpControl, gameControl) : controlsCompatibilityStatusEnum.UNSUPPORTED;
  
  const status = controlsCompatibilityStatusEnum.min(controlStatus, buttonsStatus);
  const score = createScore(
    ['controlComp.status',        status       ],
    ['controlComp.controlStatus', controlStatus],
    ['controlComp.buttonsStatus', buttonsStatus]
  );
  
  /** @type {IControlCompatibility} */
  const controlsComp = {
    gameControl,
    cpControl,
    controlStatus,
    buttonsStatus,
    status,
    score
  };
  return controlsComp;
}

/**
 * @param {ICPControl}   cpControl 
 * @param {IGameControl} gameControl 
 * @returns {ControlsCompatibilityStatus}
 */
function getControlCompatibilityControlStatus(cpControl, gameControl) {
  const cpControlDef = cpControl.controlDef;
  const gameControlDef = gameControl.controlDef;
  
  if (cpControlDef.type === gameControl.type) {
    return controlsCompatibilityStatusEnum.NATIVE;
  }
  
  const controlFallback = gameControlDef.fallbacks.find(x => x.controlType === cpControlDef.type);
  if (!controlFallback) {
    return controlsCompatibilityStatusEnum.UNSUPPORTED;
  }
  
  switch (controlFallback.level) {
    case controlFallbackLevelEnum.GOOD: return controlsCompatibilityStatusEnum.GOOD;
    case controlFallbackLevelEnum.OK  : return controlsCompatibilityStatusEnum.OK;
    case controlFallbackLevelEnum.BAD : return controlsCompatibilityStatusEnum.BAD;
    default                           : return controlsCompatibilityStatusEnum.UNKNOWN;
  }
}

/**
 * @param {ICPControl}   cpControl 
 * @param {IGameControl} gameControl 
 * @returns {ControlsCompatibilityStatus}
 */
function getControlCompatibilityButtonsStatus(cpControl, gameControl) {
  return (
    cpControl.numButtons >= gameControl.buttons.length
    ? controlsCompatibilityStatusEnum.NATIVE
    : controlsCompatibilityStatusEnum.UNSUPPORTED
  );
}

/**
 * @param {ICPButtonCluster | undefined} _cpButtonCluster 
 * @param {IGameButton[]}                gameButtons 
 * @returns {IButtonsCompatibility}
 */
function getButtonsComptability(_cpButtonCluster, gameButtons) {
  /** @type {ICPButtonCluster | undefined} */
  let cpButtonCluster;
  /** @type {ControlsCompatibilityStatus} */
  let status;
  
  // check if the game requires any buttons
  if (gameButtons.length === 0) {
    // don't need to use the CP button cluster
    cpButtonCluster = undefined;
    status = controlsCompatibilityStatusEnum.NATIVE;
  }
  // check if the CP button cluster is available
  else if (!_cpButtonCluster) {
    // can't use the CP button cluster
    cpButtonCluster = undefined;
    status = controlsCompatibilityStatusEnum.UNSUPPORTED;
  }
  else {
    // use the CP button cluster
    cpButtonCluster = _cpButtonCluster;
    status = (
      _cpButtonCluster.numButtons >= gameButtons.length
      ? controlsCompatibilityStatusEnum.NATIVE
      : controlsCompatibilityStatusEnum.UNSUPPORTED
    );
  }
  
  /** @type {IButtonsCompatibility} */
  const buttonComp = {
    gameButtons,
    cpButtonCluster,
    status,
    score: createScore(
      ['buttonComp.status', status]
    )
  };
  return buttonComp;
}


/**
 * @template T
 * @param {T[]} arr 
 * @param {T} val 
 * @returns {T[]}
 */
function removeVal(arr, val) {
  const index = arr.indexOf(val);
  if (index > -1) {
    arr.splice(index, 1);
  }
  return arr;
}

/**
 * @template T
 * @param {T} a 
 * @param {T} b 
 */
function compareBoolean(a, b) {
  if (a === b) return 0;
  if (a) return -1;
  return 1;
}

/**
 * @param {number} num 
 */
function min0(num) {
  if (num < 0) return 0;
  return num;
}
