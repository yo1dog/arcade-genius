import {createStringEnum, StringEnumValue} from '../enum';


export interface IControlsDat {
  readonly meta: {
    readonly description: string;
    readonly version    : string;
    readonly time       : string;
    readonly generatedBy: string;
  };
  readonly gameMap: {[key: string]: IControlsDatGame};
}

export interface IControlsDatGame {
  readonly name                 : string;
  readonly numPlayers           : number;
  readonly alternatesTurns      : boolean;
  readonly controlConfigurations: IControlsDatControlConfiguration[];
}

export interface IControlsDatControlConfiguration {
  readonly targetCabinetType      : ControlsDatCabinetType;
  readonly requiresCocktailCabinet: boolean;
  readonly playerControlSetIndexes: number[];
  readonly controlSets            : IControlsDatControlSet[];
  readonly menuButtons            : IControlsDatButton[];
}

export interface IControlsDatControlSet {
  readonly supportedPlayerNums   : number[];
  readonly isRequired            : boolean;
  readonly isOnOppositeScreenSide: boolean;
  readonly controls              : IControlsDatControl[];
  readonly controlPanelButtons   : IControlsDatButton[];
}

export interface IControlsDatControl {
  readonly type            : string;
  readonly descriptor      : string | null;
  readonly outputToInputMap: {[key: string]: IControlsDatInput | null};
  readonly buttons         : IControlsDatButton[];
}

export interface IControlsDatButton {
  readonly descriptor : string | null;
  readonly input      : IControlsDatInput;
}

export interface IControlsDatInput {
  readonly isAnalog     : boolean;
  readonly mameInputPort: string;
  readonly label        : string | null | undefined;
  readonly negLabel     : string | null | undefined;
  readonly posLabel     : string | null | undefined;
}

export class ControlsDatCabinetType extends StringEnumValue {
  public readonly __type: 'ControlsDatCabinetType' = 'ControlsDatCabinetType';
}
export const controlsDatCabinetTypeEnum = createStringEnum(ControlsDatCabinetType, {
  UPRIGHT : 'upright',
  COCKTAIL: 'cocktail'
});