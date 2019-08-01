import {IControlDef} from './controlDef';
import {ControlType} from './controlDefEnums';
import {CabinetType} from './commonEnums';


export interface IControlsDat {
  readonly meta: {
    readonly description: string;
    readonly version    : string;
    readonly time       : string;
    readonly generatedBy: string;
  };
  readonly gameMap: Map<string, IControlsDatGame>;
}

export interface IControlsDatGame {
  readonly name                 : string;
  readonly numPlayers           : number;
  readonly alternatesTurns      : boolean;
  readonly controlConfigurations: IGameControlConfiguration[];
}

export interface IGameControlConfiguration {
  readonly targetCabinetType      : CabinetType;
  readonly requiresCocktailCabinet: boolean;
  readonly playerControlSetIndexes: number[];
  readonly controlSets            : IGameControlSet[];
  readonly menuButtons            : IGameButton[];
}

export interface IGameControlSet {
  readonly supportedPlayerNums   : number[];
  readonly isRequired            : boolean;
  readonly isOnOppositeScreenSide: boolean;
  readonly controls              : IGameControl[];
  readonly controlPanelButtons   : IGameButton[];
}

export interface IGameControl {
  readonly type            : ControlType;
  readonly controlDef      : IControlDef;
  readonly descriptor?     : string;
  readonly outputToInputMap: Map<string, IGameInput | null>;
  readonly buttons         : IGameButton[];
}

export interface IGameButton {
  readonly descriptor?: string;
  readonly input      : IGameInput;
}

export interface IGameInput {
  readonly isAnalog     : boolean;
  readonly mameInputPort: string;
  readonly label?       : string;
  readonly negLabel?    : string;
  readonly posLabel?    : string;
}
