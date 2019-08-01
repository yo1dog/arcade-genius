import {IMachine} from './mame';
import {IMultidimensionalScore} from './multidimensionalScore';
import {
  IModelineConfig,
  IModelineResult
} from './modeline';
import {
  ICPConfiguration,
  ICPControl,
  ICPButtonCluster
} from './controlPanel';
import {
  IControlsDatGame,
  IGameControlConfiguration,
  IGameControlSet,
  IGameControl,
  IGameButton
} from './controlsDat';
import {
  OverallCompatibilityStatus,
  EmulationCompatibilityStatus,
  VideoCompatibilityStatus,
  ControlsCompatibilityStatus
} from './compatibilityEnums';


// ----------------------------------
// Machine
// ----------------------------------

export interface IMachineCompatibility {
  readonly machineNameInput  : string;
  readonly machine?          : IMachine;
  readonly videoComps        : IVideoCompatibility[];
  readonly emuComp           : IEmulationCompatibility;
  readonly controlsComp      : IControlsCompatibility;
  readonly overallStatus     : OverallCompatibilityStatus;
  readonly knownOverallStatus: OverallCompatibilityStatus;
}


// ----------------------------------
// Emulation
// ----------------------------------

export interface IEmulationCompatibility {
  readonly machine?: IMachine;
  readonly status  : EmulationCompatibilityStatus;
}


// ----------------------------------
// Video
// ----------------------------------

export interface IVideoCompatibility {
  readonly machine?       : IMachine;
  readonly modelineConfig : IModelineConfig;
  readonly modelineResult?: IModelineResult;
  readonly status         : VideoCompatibilityStatus;
}


// ----------------------------------
// Controls
// ----------------------------------

export interface IControlsCompatibility {
  readonly machine?             : IMachine;
  readonly cpConfig             : ICPConfiguration;
  readonly controlsDatGame?     : IControlsDatGame;
  readonly bestControlConfigComp: IControlConfigurationCompatibility;
  readonly allControlConfigComps: IControlConfigurationCompatibility[];
  readonly status               : ControlsCompatibilityStatus;
}

export interface IControlConfigurationCompatibility {
  readonly gameControlConfig: IGameControlConfiguration;
  readonly controlSetComps  : IControlSetCompatibility[];
  readonly status           : ControlsCompatibilityStatus;
  readonly score            : IMultidimensionalScore;
  readonly meta             : IControlConfigurationCompatibilityMeta;
}
export interface IControlConfigurationCompatibilityMeta {
  readonly gameControlSetCompOptRounds: IGameControlSetCompatibilityOptimizationRound[];
}

export interface IGameControlSetCompatibilityOptimizationRound {
  readonly roundCPAvailControls       : ICPControl[];
  readonly roundCPAvailButtonClusters : ICPButtonCluster[];
  readonly allocGameControlSetCompOpts: IGameControlSetCompatibilityOptimization[];
  readonly allGameControlSetCompOpts  : IGameControlSetCompatibilityOptimization[];
}
export interface IGameControlSetCompatibilityOptimization {
  readonly gameControlSet    : IGameControlSet;
  readonly bestControlSetComp: IControlSetCompatibility;
  readonly allControlSetComps: IControlSetCompatibility[];
}

export interface IControlSetCompatibility {
  readonly gameControlSet: IGameControlSet;
  readonly controlComps  : IControlCompatibility[];
  readonly buttonsComp   : IButtonsCompatibility;
  readonly status        : ControlsCompatibilityStatus;
  readonly score         : IMultidimensionalScore;
  readonly meta          : IControlSetCompatibilityMeta;
}
export interface IControlSetCompatibilityMeta {
  readonly gameControlCompOptRounds: IGameControlCompatibilityOptimizationRound[];
}

export interface IGameControlCompatibilityOptimizationRound {
  readonly roundCPControlSetAvailControls: ICPControl[];
  readonly allocGameControlCompOpts      : IGameControlCompatibilityOptimization[];
  readonly allGameControlCompOpts        : IGameControlCompatibilityOptimization[];
}
export interface IGameControlCompatibilityOptimization {
  readonly gameControl    : IGameControl;
  readonly bestControlComp: IControlCompatibility;
  readonly allControlComps: IControlCompatibility[];
}

export interface IControlCompatibility {
  readonly gameControl  : IGameControl;
  readonly cpControl?   : ICPControl;
  readonly controlStatus: ControlsCompatibilityStatus;
  readonly buttonsStatus: ControlsCompatibilityStatus;
  readonly status       : ControlsCompatibilityStatus;
  readonly score        : IMultidimensionalScore;
}

export interface IButtonsCompatibility {
  readonly gameButtons     : IGameButton[];
  readonly cpButtonCluster?: ICPButtonCluster;
  readonly status          : ControlsCompatibilityStatus;
  readonly score           : IMultidimensionalScore;
}