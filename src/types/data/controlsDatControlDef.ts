import {createStringEnum, StringEnumValue} from '../enum';


export interface IControlsDatControlDef {
  readonly type              : string;
  readonly name              : string;
  readonly description       : string;
  readonly outputMap?        : {[key: string]: IControlsDatControlDefOutput};
  readonly descriptors?      : string[];
  readonly buttonDescriptors?: string[];
  readonly fallbacks?        : IControlsDatControlDefFallback[];
}

export interface IControlsDatControlDefOutput {
  readonly name?                     : string;
  readonly isAnalog?                 : boolean;
  readonly defaultMAMEInputPortSuffix: string;
  readonly defaultLabel?             : string;
  readonly negDefaultLabel?          : string;
  readonly posDefaultLabel?          : string;
}

export interface IControlsDatControlDefFallback {
  readonly controlType             : string;
  readonly level                   : ControlsDatControlDefFallbackLevel;
  readonly outputMapping?          : {[key: string]: string|string[]};
  readonly buttonDescriptorMapping?: {[key: string]: string|string[]};
}

export class ControlsDatControlDefFallbackLevel extends StringEnumValue {
  public readonly __type: 'ControlsDatControlDefFallbackLevel' = 'ControlsDatControlDefFallbackLevel';
}
export const controlsDatControlDefFallbackLevelEnum = createStringEnum(ControlsDatControlDefFallbackLevel, {
  GOOD: 'good',
  OK  : 'ok',
  BAD : 'bad'
});