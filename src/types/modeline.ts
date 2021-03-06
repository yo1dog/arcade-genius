import {Orientation} from './common';


export interface IModelineResult {
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
  readonly modeline   : IModeline;
}

export interface IModeline {
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

export interface IModelineConfiguration {
  readonly preset         : string;
  readonly orientation    : Orientation;
  readonly ranges         : string[];
  readonly allowInterlaced: boolean;
  readonly allowDoublescan: boolean;
}

interface IModelineCalculationBase {
  readonly success       : boolean; 
  readonly modelineConfig: IModelineConfiguration;
}
export interface IModelineCalculationSucess extends IModelineCalculationBase {
  readonly success: true;
  readonly modelineResult: IModelineResult;
}
export interface IModelineCalculationFailure extends IModelineCalculationBase {
  readonly success: false;
  readonly errMsg: string;
}
export type TModelineCalculation = IModelineCalculationSucess | IModelineCalculationFailure;