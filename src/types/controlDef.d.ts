import {IJSONObject} from './json';
import {
  ControlType,
  ControlFallbackLevel
} from './controlDefEnums';


export interface IControlDef {
  readonly type             : ControlType;
  readonly name             : string;
  readonly description      : string;
  readonly outputMap        : Map<string, IControlOutput>;
  readonly descriptors      : string[];
  readonly buttonDescriptors: string[];
  readonly fallbacks        : IControlFallback[];
}

export interface IControlOutput {
  readonly name?                     : string;
  readonly isAnalog                  : boolean;
  readonly defaultMAMEInputPortSuffix: string;
  readonly defaultLabel?             : string;
  readonly negDefaultLabel?          : string;
  readonly posDefaultLabel?          : string;
}

export interface IControlFallback {
  readonly controlType            : ControlType;
  readonly level                  : ControlFallbackLevel;
  readonly outputMapping          : Map<string, string|string[]>;
  readonly buttonDescriptorMapping: Map<string, string|string[]>;
}
