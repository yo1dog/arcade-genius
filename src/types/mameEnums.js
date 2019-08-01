import {createStringEnum, StringEnumValue} from './enum';


export class MachineDriverStatus extends StringEnumValue {}
export const machineDriverStatusEnum = createStringEnum(MachineDriverStatus, {
  GOOD       : 'good',
  IMPERFECT  : 'imperfect',
  PRELIMINARY: 'preliminary'
});

export class MachineDriverSaveStateStatus extends StringEnumValue {}
export const machineDriverSaveStateStatusEnum = createStringEnum(MachineDriverSaveStateStatus, {
  SUPPORTED  : 'supported',
  UNSUPPORTED: 'unsupported'
});