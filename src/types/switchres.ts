import {
  createStringEnum,
  createNumberEnum,
  StringEnumValue,
  NumberEnumValue
} from './enum';


export type TInitModule = (options: {
  locateFile?: (path: string) => string;
}) => ISwitchResEMCModule;

export interface ISwitchResEMCModule {
  then: (cb: () => void) => void;
  ccall(
    methodName: 'calc_modelines',
    returnType: 'string',
    argTypes  : ['string'],
    args      : [string]
  ): string;
}

export interface ISwitchResInput {
  readonly config  : ISwitchResConfiguration;
  readonly machines: ISwitchResMachineInput[];
}

export interface ISwitchResConfiguration {
  readonly preset         : string;
  readonly orientation    : SwitchResOrientation;
  readonly ranges         : string[];
  readonly allowInterlaced: boolean;
  readonly allowDoublescan: boolean;
}

export interface ISwitchResMachineInput {
  readonly name   : string;
  readonly display: ISwitchResDisplay;
}

export interface ISwitchResDisplay {
  readonly type   : SwitchResDisplayType;
  readonly rotate : SwitchResDisplayRotation;
  readonly flipx  : boolean;
  readonly refresh: number;
  readonly width? : number;
  readonly height?: number;
}

export type TSwitchResOutput = ISwitchResOutputSuccess | ISwitchResOutputFailure;

export interface ISwitchResOutputSuccess {
  readonly inRange    : boolean;
  readonly description: string;
  readonly modelineStr: string;
  readonly details    : string;
  readonly vfreqOff   : boolean;
  readonly resStretch : boolean;
  readonly weight     : number;
  readonly xScale     : number;
  readonly yScale     : number;
  readonly vScale     : number;
  readonly xDiff      : number;
  readonly yDiff      : number;
  readonly vDiff      : number;
  readonly xRatio     : number;
  readonly yRatio     : number;
  readonly vRatio     : number;
  readonly rotated    : boolean;
  readonly modeline   : ISwitchResModeline;
}

export interface ISwitchResOutputFailure {
  readonly err: string;
}

export interface ISwitchResModeline {
  readonly pclock    : number;
  readonly hactive   : number;
  readonly hbegin    : number;
  readonly hend      : number;
  readonly htotal    : number;
  readonly vactive   : number;
  readonly vbegin    : number;
  readonly vend      : number;
  readonly vtotal    : number;
  readonly interlace : number;
  readonly doublescan: number;
  readonly hsync     : number;
  readonly vsync     : number;
  readonly vfreq     : number;
  readonly hfreq     : number;
  readonly width     : number;
  readonly height    : number;
  readonly refresh   : number;
  readonly type      : number;
  readonly range     : number;
}

export class SwitchResOrientation extends StringEnumValue {
  public readonly __type: 'SwitchResOrientation' = 'SwitchResOrientation';
}
export const switchResOrientationEnum = createStringEnum(SwitchResOrientation, {
  HORIZONTAL: 'horizontal',
  VERTICAL  : 'vertical'
});

export class SwitchResDisplayType extends StringEnumValue {
  public readonly __type: 'SwitchResDisplayType' = 'SwitchResDisplayType';
} 
export const switchResDisplayTypeEnum = createStringEnum(SwitchResDisplayType, {
  RASTER: 'raster',
  VECTOR: 'vector',
  LCD   : 'lcd',
  SVG   : 'svg'
});

export class SwitchResDisplayRotation extends NumberEnumValue {
  public readonly __type: 'SwitchResDisplayRotation' = 'SwitchResDisplayRotation';
}
export const switchResDisplayRotationEnum = createNumberEnum(SwitchResDisplayRotation, [
    0,   'R0',
   90,  'R90',
  180, 'R180',
  270, 'R270',
]);