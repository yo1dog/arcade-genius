import {createNumberEnum, NumberEnumValue} from './enum';
import {IGame}                             from './game';
import MultidimensionalScore               from '../multidimensionalScore';
import {IMonitorConfiguration}             from './monitor';
import {TModelineCalculation}              from './modeline';
import {
  ICPConfiguration,
  ICPControl,
  ICPButtonCluster
} from './controlPanel';
import {
  IGameControlConfiguration,
  IGameControlSet,
  IGameControl,
  IGameButton
} from './game';


// ----------------------------------
// Overall
// ----------------------------------

export class OverallCompatibilityStatus extends NumberEnumValue {
  public readonly __type: 'OverallCompatibilityStatus' = 'OverallCompatibilityStatus';
}
export const overallCompatibilityStatusEnum = createNumberEnum(OverallCompatibilityStatus, [
  -1,
  'UNKNOWN',
  'UNSUPPORTED',
  'BAD',
  'OK',
  'GOOD',
  'NATIVE',
]);


// ----------------------------------
// Game
// ----------------------------------

export interface IGameCompatibility {
  readonly gameNameInput     : string;
  readonly game?             : IGame;
  readonly emuComp           : IEmulationCompatibility;
  readonly videoComps        : IVideoCompatibility[];
  readonly controlsComps     : IControlsCompatibility[];
  readonly overallStatus     : OverallCompatibilityStatus;
  readonly knownOverallStatus: OverallCompatibilityStatus;
}


// ----------------------------------
// Emulation
// ----------------------------------

export class EmulationCompatibilityStatus extends NumberEnumValue {
  public readonly __type: 'EmulationCompatibilityStatus' = 'EmulationCompatibilityStatus';
}
export const emulationCompatibilityStatusEnum = createNumberEnum(EmulationCompatibilityStatus, [
  -1,
  'UNKNOWN',
  'PRELIMINARY',
  'IMPERFECT',
  'GOOD',
]);

export interface IEmulationCompatibility {
  readonly game? : IGame;
  readonly status: EmulationCompatibilityStatus;
}


// ----------------------------------
// Video
// ----------------------------------

export class VideoCompatibilityStatus extends NumberEnumValue {
  public readonly __type: 'VideoCompatibilityStatus' = 'VideoCompatibilityStatus';
}
export const videoCompatibilityStatusEnum = createNumberEnum(VideoCompatibilityStatus, [
  -1,
  'UNKNOWN',
  'UNSUPPORTED',
  'BAD',
  'VFREQ_SLIGHTLY_OFF',
  'INT_SCALE',
  'NATIVE',
]);

export interface IVideoCompatibility {
  readonly game?        : IGame;
  readonly monitorConfig: IMonitorConfiguration;
  readonly modelineCalc?: TModelineCalculation;
  readonly status       : VideoCompatibilityStatus;
}


// ----------------------------------
// Controls
// ----------------------------------

export class ControlsCompatibilityStatus extends NumberEnumValue {
  public readonly __type: 'ControlsCompatibilityStatus' = 'ControlsCompatibilityStatus';
}
export const controlsCompatibilityStatusEnum = createNumberEnum(ControlsCompatibilityStatus, [
  -1,
  'UNKNOWN',
  'UNSUPPORTED',
  'BAD',
  'OK',
  'GOOD',
  'NATIVE',
]);

export interface IControlsCompatibility {
  readonly game?                 : IGame;
  readonly cpConfig              : ICPConfiguration;
  readonly bestControlConfigComp?: IControlConfigurationCompatibility;
  readonly allControlConfigComps : IControlConfigurationCompatibility[];
  readonly status                : ControlsCompatibilityStatus;
}

export interface IControlConfigurationCompatibility {
  readonly gameControlConfig: IGameControlConfiguration;
  readonly controlSetComps  : IControlSetCompatibility[];
  readonly status           : ControlsCompatibilityStatus;
  readonly score            : MultidimensionalScore;
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
  readonly score         : MultidimensionalScore;
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
  readonly score        : MultidimensionalScore;
}

export interface IButtonsCompatibility {
  readonly gameButtons     : IGameButton[];
  readonly cpButtonCluster?: ICPButtonCluster;
  readonly status          : ControlsCompatibilityStatus;
  readonly score           : MultidimensionalScore;
}