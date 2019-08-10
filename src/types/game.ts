import {IControlDef}  from './controlDef';
import {CabinetType}  from './common';
import {
  IMAMEMachine,
  IMAMEMachineDisplay
} from './data/mame';
import {
  DisplayType,
  DisplayRotation
} from './common';
import {
  IControlsDatGame,
  IControlsDatControlConfiguration,
  IControlsDatControlSet,
  IControlsDatControl,
  IControlsDatButton,
  IControlsDatInput
} from './data/controlsDat';


export interface IGame {
  readonly name             : string;
  readonly description      : string;
  readonly shortDescription?: string;
  readonly cloneOfGame?     : IGame;
  readonly primaryDisplay?  : IGameDisplay;
  readonly displays         : IGameDisplay[];
  readonly controlInfo?     : IGameControlInfo;
  readonly mameMachine?     : IMAMEMachine;
}

export interface IGameDisplay {
  readonly type               : DisplayType;
  readonly rotation           : DisplayRotation;
  readonly flipx              : boolean;
  readonly refresh            : number;
  readonly width?             : number;
  readonly height?            : number;
  readonly mameMachineDisplay?: IMAMEMachineDisplay;
}

export interface IGameControlInfo {
  readonly numPlayers      : number;
  readonly alternatesTurns : boolean;
  readonly controlConfigs  : IGameControlConfiguration[];
  readonly controlsDatGame?: IControlsDatGame;
}

export interface IGameControlConfiguration {
  readonly targetCabinetType               : CabinetType;
  readonly controlSets                     : IGameControlSet[];
  readonly menuButtons                     : IGameButton[];
  readonly controlsDatControlConfiguration?: IControlsDatControlConfiguration;
}

export interface IGameControlSet {
  readonly supportedPlayerNums   : number[];
  readonly isRequired            : boolean;
  readonly isOnOppositeScreenSide: boolean;
  readonly controls              : IGameControl[];
  readonly controlPanelButtons   : IGameButton[];
  readonly controlsDatControlSet?: IControlsDatControlSet;
}

export interface IGameControl {
  readonly controlDef         : IControlDef;
  readonly descriptor?        : string;
  readonly outputToInputMap   : Map<string, IGameInput | undefined>;
  readonly buttons            : IGameButton[];
  readonly controlsDatControl?: IControlsDatControl;
}

export interface IGameButton {
  readonly descriptor?       : string;
  readonly input             : IGameInput;
  readonly controlsDatButton?: IControlsDatButton;
}

export interface IGameInput {
  readonly isAnalog         : boolean;
  readonly label?           : string;
  readonly negLabel?        : string;
  readonly posLabel?        : string;
  readonly controlsDatInput?: IControlsDatInput;
}
