import * as mameUtil           from './dataAccess/mameUtil';
import * as controlsDatUtil    from './dataAccess/controlsDatUtil';
import * as modelineCalculator from './dataAccess/modelineCalculator';
import MultidimensionalScore   from './multidimensionalScore';
import {
  IMachine,
  machineDriverStatusEnum
} from './types/mame';
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
  IGameControlCompatibilityOptimization,
  OverallCompatibilityStatus,
  EmulationCompatibilityStatus,
  VideoCompatibilityStatus,
  ControlsCompatibilityStatus,
  overallCompatibilityStatusEnum,
  emulationCompatibilityStatusEnum,
  videoCompatibilityStatusEnum,
  controlsCompatibilityStatusEnum,
} from './types/compatibility';
import {
  controlFallbackLevelEnum
} from './types/controlDef';
import {
  cabinetTypeEnum
} from './types/common';


export function emuToOverallCompatibilityStatus(status: EmulationCompatibilityStatus): OverallCompatibilityStatus {
  switch (status) {
    case emulationCompatibilityStatusEnum.UNKNOWN    : return overallCompatibilityStatusEnum.UNKNOWN;
    case emulationCompatibilityStatusEnum.PRELIMINARY: return overallCompatibilityStatusEnum.BAD;
    case emulationCompatibilityStatusEnum.IMPERFECT  : return overallCompatibilityStatusEnum.OK;
    case emulationCompatibilityStatusEnum.GOOD       : return overallCompatibilityStatusEnum.NATIVE;
    default                                          : return overallCompatibilityStatusEnum.UNKNOWN;
  }
}

export function controlsToOverallCompatibilityStatus(status: ControlsCompatibilityStatus): OverallCompatibilityStatus {
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

export function videoToOverallCompatibilityStatus(status: VideoCompatibilityStatus): OverallCompatibilityStatus {
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

export function getMachineByInput(machineNameInput: string): IMachine | undefined {
  return mameUtil.getMachineByName(
    machineNameInput.trim().toLowerCase()
  );
}

export async function checkMachineBulk(
  machineNameInputs: string[],
  modelineConfigs  : IModelineConfig[],
  cpConfig         : ICPConfiguration
): Promise<IMachineCompatibility[]> {
  const machines = machineNameInputs.map(machineNameInput =>
    getMachineByInput(machineNameInput)
  );
  
  // check video compatibility in bulk
  const modelineConfigsVideoComps: IVideoCompatibility[][] = [];
  for (let i = 0; i < modelineConfigs.length; ++i) {
    modelineConfigsVideoComps[i] = await checkVideoBulk(machines, modelineConfigs[i]);
  }
  
  return machines.map((machine, i) => {
    const machineNameInput = machineNameInputs[i];
    
    const videoComps: IVideoCompatibility[] = [];
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
    
    const machineComp: IMachineCompatibility = {
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

export async function checkMachine(
  machineNameInput: string,
  modelineConfigs : IModelineConfig[],
  cpConfig        : ICPConfiguration
): Promise<IMachineCompatibility> {
  return (await checkMachineBulk([machineNameInput], modelineConfigs, cpConfig))[0];
}


// ----------------------------------
// Emulation
// ----------------------------------

export function checkEmulation(machine: IMachine|undefined): IEmulationCompatibility {
  const status = getEmulationStatus(machine);
  
  return {
    machine,
    status
  };
}

function getEmulationStatus(machine: IMachine|undefined): EmulationCompatibilityStatus {
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

export async function checkVideo(
  machine       : IMachine,
  modelineConfig: IModelineConfig
): Promise<IVideoCompatibility> {
  return (await checkVideoBulk([machine], modelineConfig))[0];
}

export async function checkVideoBulk(
  machines      : (IMachine | undefined)[],
  modelineConfig: IModelineConfig
): Promise<IVideoCompatibility[]> {
  // calculate modelines
  const modelineResultMap = await modelineCalculator.calcModelineBulk(modelineConfig, machines);
  
  // for each machine... 
  return machines.map(machine => {
    // get modeline result
    const modelineResult = machine && modelineResultMap.get(machine.name);
    
    const status = getVideoStatus(modelineResult);
    
    const videoComp: IVideoCompatibility = {
      machine,
      modelineConfig,
      modelineResult,
      status
    };
    return videoComp;
  });
}

function getVideoStatus(modelineResult: IModelineResult | undefined): VideoCompatibilityStatus {
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

export function checkControls(machine: IMachine | undefined, cpConfig: ICPConfiguration): IControlsCompatibility {
  // get controls.dat game
  let controlsDatGame: IControlsDatGame | undefined;
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
    b.score.compare(a.score)
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

function getControlConfigCompatibility(
  cpConfig         : ICPConfiguration,
  gameControlConfig: IGameControlConfiguration
): IControlConfigurationCompatibility {
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
  
  const gameControlSetCompOptRounds: IGameControlSetCompatibilityOptimizationRound[] = [];
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
      allControlSetComps.sort((a, b) => b.score.compare(a.score));
      const bestControlSetComp = allControlSetComps[0];
      
      const gameControlSetCompOpt: IGameControlSetCompatibilityOptimization = {
        gameControlSet,
        bestControlSetComp,
        allControlSetComps
      };
      return gameControlSetCompOpt;
    });
    
    // prefer best score
    allGameControlSetCompOpts.sort((a, b) => b.bestControlSetComp.score.compare(a.bestControlSetComp.score));
    
    // for each optimization (best compatibile optimizations first)...
    const allocGameControlSetCompOpts: IGameControlSetCompatibilityOptimization[] = [];
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
  const controlSetComps: IControlSetCompatibility[] = (
    gameControlSetCompOptRounds
    .flatMap(x => x.allocGameControlSetCompOpts)
    .flatMap(x => x.bestControlSetComp)
  );
  
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
  
  const score = MultidimensionalScore.create(
    ['controlConfigComp.status',                         status                                                                 ],
    ['controlConfigComp.requiredControlSetCompScoreSum', MultidimensionalScore.sum(...requiredControlSetComps.map(x => x.score))],
    ['controlConfigComp.optionalControlSetCompScoreSum', MultidimensionalScore.sum(...optionalControlSetComps.map(x => x.score))]
  );
  
  // TODO: check gameControlConfig.menuButtons
  
  const controlConfigComp: IControlConfigurationCompatibility = {
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

function getControlSetCompatibility(
  cpControlSet         : ICPControlSet,
  cpAvailControls      : ICPControl[],
  cpAvailButtonClusters: ICPButtonCluster[],
  gameControlSet       : IGameControlSet
): IControlSetCompatibility {
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
  
  const gameControlCompOptRounds: IGameControlCompatibilityOptimizationRound[] = [];
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
      allControlComps.sort((a, b) => b.score.compare(a.score));
      let bestControlComp = allControlComps[0];
      
      // if the best compatibile control status is unsupported (not considering button status), ignore it
      if (
        !bestControlComp ||
        bestControlComp.controlStatus.val <= controlsCompatibilityStatusEnum.UNSUPPORTED.val
      ) {
        bestControlComp = getControlCompatibility(undefined, gameControl);
      }
      
      const gameControlCompOpt: IGameControlCompatibilityOptimization = {
        gameControl,
        bestControlComp,
        allControlComps
      };
      return gameControlCompOpt;
    });
    
    // prefer best score
    allGameControlCompOpts.sort((a, b) => b.bestControlComp.score.compare(a.bestControlComp.score));
    
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
  const controlComps: IControlCompatibility[] = (
    gameControlCompOptRounds
    .flatMap(x => x.allocGameControlCompOpts)
    .flatMap(x => x.bestControlComp)
  );
  
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
  
  const score = MultidimensionalScore.create(
    ['controlSetComp.status',              status                                                      ],
    ['controlSetComp.controlCompScoreSum', MultidimensionalScore.sum(...controlComps.map(x => x.score))],
    ['controlSetComp.buttonCompScore',     buttonsComp.score                                           ]
  );
  
  const controlSetComp: IControlSetCompatibility = {
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

function getControlCompatibility(
  cpControl  : ICPControl | undefined,
  gameControl: IGameControl
): IControlCompatibility {
  const controlStatus = cpControl? getControlCompatibilityControlStatus(cpControl, gameControl) : controlsCompatibilityStatusEnum.UNSUPPORTED;
  const buttonsStatus = cpControl? getControlCompatibilityButtonsStatus(cpControl, gameControl) : controlsCompatibilityStatusEnum.UNSUPPORTED;
  
  const status = controlsCompatibilityStatusEnum.min(controlStatus, buttonsStatus);
  const score = MultidimensionalScore.create(
    ['controlComp.status',        status       ],
    ['controlComp.controlStatus', controlStatus],
    ['controlComp.buttonsStatus', buttonsStatus]
  );
  
  const controlsComp: IControlCompatibility = {
    gameControl,
    cpControl,
    controlStatus,
    buttonsStatus,
    status,
    score
  };
  return controlsComp;
}

function getControlCompatibilityControlStatus(cpControl: ICPControl, gameControl: IGameControl): ControlsCompatibilityStatus {
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

function getControlCompatibilityButtonsStatus(cpControl: ICPControl, gameControl: IGameControl): ControlsCompatibilityStatus {
  return (
    cpControl.numButtons >= gameControl.buttons.length
    ? controlsCompatibilityStatusEnum.NATIVE
    : controlsCompatibilityStatusEnum.UNSUPPORTED
  );
}

function getButtonsComptability(
  _cpButtonCluster: ICPButtonCluster | undefined,
  gameButtons     : IGameButton[]
): IButtonsCompatibility {
  let cpButtonCluster: ICPButtonCluster | undefined;
  let status         : ControlsCompatibilityStatus;
  
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
  
  const buttonComp: IButtonsCompatibility = {
    gameButtons,
    cpButtonCluster,
    status,
    score: MultidimensionalScore.create(
      ['buttonComp.status', status]
    )
  };
  return buttonComp;
}

function removeVal<T>(arr: T[], val: T): T[] {
  const index = arr.indexOf(val);
  if (index > -1) {
    arr.splice(index, 1);
  }
  return arr;
}

function compareBoolean<T>(a: T, b: T): -1|0|1 {
  if (a === b) return 0;
  if (a) return -1;
  return 1;
}

function min0(num: number): number {
  if (num < 0) return 0;
  return num;
}
