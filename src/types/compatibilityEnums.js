import {createNumberEnum, NumberEnumValue} from './enum';


export class OverallCompatibilityStatus extends NumberEnumValue {}
export const overallCompatibilityStatusEnum = createNumberEnum(OverallCompatibilityStatus, [
  -1,
  'UNKNOWN',
  'UNSUPPORTED',
  'BAD',
  'OK',
  'GOOD',
  'NATIVE',
]);

export class EmulationCompatibilityStatus extends NumberEnumValue {}
export const emulationCompatibilityStatusEnum = createNumberEnum(EmulationCompatibilityStatus, [
  -1,
  'UNKNOWN',
  'PRELIMINARY',
  'IMPERFECT',
  'GOOD',
]);

export class VideoCompatibilityStatus extends NumberEnumValue {}
export const videoCompatibilityStatusEnum = createNumberEnum(VideoCompatibilityStatus, [
  -1,
  'UNKNOWN',
  'UNSUPPORTED',
  'BAD',
  'VFREQ_SLIGHTLY_OFF',
  'INT_SCALE',
  'NATIVE',
]);

export class ControlsCompatibilityStatus extends NumberEnumValue {}
export const controlsCompatibilityStatusEnum = createNumberEnum(ControlsCompatibilityStatus, [
  -1,
  'UNKNOWN',
  'UNSUPPORTED',
  'BAD',
  'OK',
  'GOOD',
  'NATIVE',
]);