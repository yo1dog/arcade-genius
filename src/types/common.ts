import {
  createStringEnum,
  createNumberEnum,
  StringEnumValue,
  NumberEnumValue
} from './enum';


export class Orientation extends StringEnumValue {}
export const orientationEnum = createStringEnum(Orientation, {
  HORIZONTAL: 'horizontal',
  VERTICAL  : 'vertical'
});

export class CabinetType extends StringEnumValue {}
export const cabinetTypeEnum = createStringEnum(CabinetType, {
  UPRIGHT : 'upright',
  COCKTAIL: 'cocktail'
});

export class DisplayType extends StringEnumValue {}
export const displayTypeEnum = createStringEnum(DisplayType, {
  RASTER : 'raster',
  VECTOR : 'vector',
  LCD    : 'lcd',
  UNKNOWN: 'unknown'
});

export class DisplayRotation extends NumberEnumValue {}
export const displayRotationEnum = createNumberEnum(DisplayRotation, [
    0,   'R0',
   90,  'R90',
  180, 'R180',
  270, 'R270',
]);
