import {createStringEnum, StringEnumValue} from './enum';


export interface IControlDef {
  readonly type             : ControlType;
  readonly name             : string;
  readonly description      : string;
  readonly outputMap        : Map<string, IControlDefOutput>;
  readonly descriptors      : string[];
  readonly buttonDescriptors: string[];
  readonly fallbacks        : IControlDefFallback[];
}

export interface IControlDefOutput {
  readonly name?           : string;
  readonly isAnalog        : boolean;
  readonly defaultLabel?   : string;
  readonly negDefaultLabel?: string;
  readonly posDefaultLabel?: string;
}

export interface IControlDefFallback {
  readonly controlType            : ControlType;
  readonly level                  : ControlDefFallbackLevel;
  readonly outputMapping          : Map<string, string|string[]>;
  readonly buttonDescriptorMapping: Map<string, string|string[]>;
}

export class ControlDefFallbackLevel extends StringEnumValue {
  public readonly __type: 'ControlDefFallbackLevel' = 'ControlDefFallbackLevel';
}
export const controlDefFallbackLevelEnum = createStringEnum(ControlDefFallbackLevel, {
  GOOD: 'good',
  OK  : 'ok',
  BAD : 'bad'
});

export class ControlType extends StringEnumValue {
  public readonly __type: 'ControlType' = 'ControlType';
}
export const controlTypeEnum = createStringEnum(ControlType, {
  JOY_2WAY_HORIZONTAL               : 'joy-2way-horizontal',
  JOY_2WAY_VERTICAL                 : 'joy-2way-vertical',
  JOY_2WAY_VERTICAL_TRIGGER         : 'joy-2way-vertical-trigger',
  JOY_4WAY                          : 'joy-4way',
  JOY_4WAY_DIAGONAL                 : 'joy-4way-diagonal',
  JOY_4WAY_TRIGGER                  : 'joy-4way-trigger',
  JOY_8WAY                          : 'joy-8way',
  JOY_8WAY_TRIGGER                  : 'joy-8way-trigger',
  JOY_8WAY_TOPFIRE                  : 'joy-8way-topfire',
  JOY_8WAY_ROTARY_OPTICAL           : 'joy-8way-rotary-optical',
  JOY_8WAY_ROTARY_MECHANICAL        : 'joy-8way-rotary-mechanical',
  JOY_49WAY                         : 'joy-49way',
  JOY_ANALOG                        : 'joy-analog',
  JOY_ANALOG_FLIGHTSTICK            : 'joy-analog-flightstick',
  DIRECTIONALBUTTONS_2WAY_HORIZONTAL: 'directionalbuttons-2way-horizontal',
  DIRECTIONALBUTTONS_2WAY_VERTICAL  : 'directionalbuttons-2way-vertical',
  DIRECTIONALBUTTONS_4WAY           : 'directionalbuttons-4way',
  JOY_ANALOG_YOKE                   : 'joy-analog-yoke',
  THROTTLE                          : 'throttle',
  TRACKBALL                         : 'trackball',
  ROLLER_HORIZONTAL                 : 'roller-horizontal',
  ROLLER_VERTICAL                   : 'roller-vertical',
  SPINNER                           : 'spinner',
  SPINNER_PUSHPULL                  : 'spinner-pushpull',
  PADDLE                            : 'paddle',
  STEERINGWHEEL_360                 : 'steeringwheel-360',
  STEERINGWHEEL_270                 : 'steeringwheel-270',
  PEDAL_DIGITAL                     : 'pedal-digital',
  PEDAL_ANALOG                      : 'pedal-analog',
  SHIFTER_HIGHLOW                   : 'shifter-highlow',
  SHIFTER_UPDOWN                    : 'shifter-updown',
  SHIFTER_4GEAR                     : 'shifter-4gear',
  LIGHTGUN                          : 'lightgun',
  LIGHTGUN_ANALOG                   : 'lightgun-analog',
  HANDLEBARS                        : 'handlebars',
  TURNTABLE                         : 'turntable',
  BASEBALLPITCHER                   : 'baseballpitcher',
  BATTERCONTROL                     : 'battercontrol',
  FOOTBALLKICKER                    : 'footballkicker',
  TRIVIABUTTONS                     : 'triviabuttons',
  MAHJONGCP                         : 'mahjongcp',
  MISC                              : 'misc',
});
