import {
  DisplayType,
  DisplayRotation
} from './commonEnums';
import {
  MachineDriverStatus
} from './mameEnums';


export interface IMAMEList {
  readonly build   : string;
  readonly debug   : boolean;
  readonly machines: IMachine[];
}

export interface IMachine {
  readonly name         : string;
  readonly description  : string;
  readonly year?        : string;
  readonly manufacturer?: string;
  readonly cloneof?     : string;
  readonly displays     : IMachineDisplay[];
  readonly driver       : IMachineDriver;
}

export interface IMachineDisplay {
  readonly tag?     : string;
  readonly type     : DisplayType;
  readonly rotate   : DisplayRotation;
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

export interface IMachineDriver {
  readonly status           : MachineDriverStatus;
  readonly emulation        : MachineDriverStatus;
  readonly color            : MachineDriverStatus;
  readonly sound            : MachineDriverStatus;
  readonly graphic          : MachineDriverStatus;
  readonly drivercocktail?  : MachineDriverStatus;
  readonly driverprotection?: MachineDriverStatus;
  readonly savestate        : MachineDriverStatus;
}
