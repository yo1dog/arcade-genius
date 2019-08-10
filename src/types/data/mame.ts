import {
  createStringEnum,
  createNumberEnum,
  StringEnumValue,
  NumberEnumValue
} from '../enum';


export interface IMAMEList {
  readonly build   : string;
  readonly debug   : boolean;
  readonly machines: IMAMEMachine[];
}

export interface IMAMEMachine {
  readonly name         : string;
  readonly description  : string;
  readonly year?        : string;
  readonly manufacturer?: string;
  readonly cloneof?     : string;
  readonly displays     : IMAMEMachineDisplay[];
  readonly driver       : IMAMEMachineDriver;
}

export interface IMAMEMachineDisplay {
  readonly tag?     : string;
  readonly type     : MAMEMachineDisplayType;
  readonly rotate   : MAMEMachineDisplayRotation;
  readonly flipx    : boolean;
  readonly width?   : number;
  readonly height?  : number;
  readonly refresh  : number;
  readonly pixclock?: number;
  readonly htotal?  : number;
  readonly hbend?   : number;
  readonly hbstart? : number;
  readonly vtotal?  : number;
  readonly vbend?   : number;
  readonly vbstart? : number;
}

export interface IMAMEMachineDriver {
  readonly status           : MAMEMachineDriverStatus;
  readonly emulation        : MAMEMachineDriverStatus;
  readonly color            : MAMEMachineDriverStatus;
  readonly sound            : MAMEMachineDriverStatus;
  readonly graphic          : MAMEMachineDriverStatus;
  readonly drivercocktail?  : MAMEMachineDriverStatus;
  readonly driverprotection?: MAMEMachineDriverStatus;
  readonly savestate        : MAMEMachineDriverSaveStateStatus;
}

export class MAMEMachineDisplayType extends StringEnumValue {
  public readonly __type: 'MAMEMachineDisplayType' = 'MAMEMachineDisplayType';
}
export const mameMachineDisplayTypeEnum = createStringEnum(MAMEMachineDisplayType, {
  RASTER : 'raster',
  VECTOR : 'vector',
  LCD    : 'lcd',
  UNKNOWN: 'unknown'
});

export class MAMEMachineDisplayRotation extends NumberEnumValue {
  public readonly __type: 'MAMEMachineDisplayRotation' = 'MAMEMachineDisplayRotation';
}
export const mameMachineDisplayRotationEnum = createNumberEnum(MAMEMachineDisplayRotation, [
    0,   'R0',
   90,  'R90',
  180, 'R180',
  270, 'R270',
]);

export class MAMEMachineDriverStatus extends StringEnumValue {
  public readonly __type: 'MAMEMachineDriverStatus' = 'MAMEMachineDriverStatus';
}
export const mameMachineDriverStatusEnum = createStringEnum(MAMEMachineDriverStatus, {
  GOOD       : 'good',
  IMPERFECT  : 'imperfect',
  PRELIMINARY: 'preliminary'
});

export class MAMEMachineDriverSaveStateStatus extends StringEnumValue {
  public readonly __type: 'MAMEMachineDriverSaveStateStatus' = 'MAMEMachineDriverSaveStateStatus';
}
export const mameMachineDriverSaveStateStatusEnum = createStringEnum(MAMEMachineDriverSaveStateStatus, {
  SUPPORTED  : 'supported',
  UNSUPPORTED: 'unsupported'
});