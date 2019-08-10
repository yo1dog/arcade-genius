import {
  createStringEnum,
  createNumberEnum,
  StringEnumValue,
  NumberEnumValue
} from './enum';


export class Orientation extends StringEnumValue {
  public readonly __type: 'Orientation' = 'Orientation';
}
export const orientationEnum = createStringEnum(Orientation, {
  HORIZONTAL: 'horizontal',
  VERTICAL  : 'vertical'
});

export class CabinetType extends StringEnumValue {
  public readonly __type: 'CabinetType' = 'CabinetType';
}
export const cabinetTypeEnum = createStringEnum(CabinetType, {
  UPRIGHT : 'upright',
  COCKTAIL: 'cocktail'
});

export class DisplayType extends StringEnumValue {
  public readonly __type: 'DisplayType' = 'DisplayType';
}
export const displayTypeEnum = createStringEnum(DisplayType, {
  RASTER : 'raster',
  VECTOR : 'vector',
  LCD    : 'lcd',
  UNKNOWN: 'unknown'
});

export class DisplayRotation extends NumberEnumValue {
  public readonly __type: 'DisplayRotation' = 'DisplayRotation';
}
export const displayRotationEnum = createNumberEnum(DisplayRotation, [
    0,   'R0',
   90,  'R90',
  180, 'R180',
  270, 'R270',
]);
