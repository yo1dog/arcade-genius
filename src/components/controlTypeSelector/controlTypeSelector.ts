import * as controlDefUtil from '../../controlDefUtil';
import {replaceChildren}   from '../../helpers/htmlUtil';
import {
  IControlDef,
  ControlType,
  controlTypeEnum
} from '../../types/controlDef';


export default class ControlTypeSelector {
  private readonly selectElem     : HTMLSelectElement;
  private readonly descriptionElem: HTMLElement;
  
  
  public constructor(selectElem: HTMLSelectElement, descriptionElem: HTMLElement) {
    this.selectElem      = selectElem;
    this.descriptionElem = descriptionElem;
    
    selectElem.addEventListener('change', () => {
      const controlTypeInput = selectElem.value;
      if (!controlTypeInput) {
        this.setDescription();
        return;
      }
      
      const controlType = controlTypeEnum.get(controlTypeInput);
      if (!controlType) throw new Error(`Invalid control type selected: '${controlTypeInput}'`);
      
      const controlDef = controlDefUtil.getByType(controlType);
      this.setDescription(controlDef);
    });
  }
  
  public getControlDef(): IControlDef | undefined {
    const controlTypeInput = this.selectElem.value;
    if (!controlTypeInput) return;
    
    const controlType = controlTypeEnum.get(controlTypeInput);
    if (!controlType) throw new Error(`Invalid control type selected: '${controlTypeInput}'`);
    
    return controlDefUtil.getByType(controlType);
  }
  
  public populateSelect(): void {
    for (const [categoryTitle, controlTypes] of getCategoryControlTypeMap()) {
      const optgroupElem = document.createElement('optgroup');
      optgroupElem.label = categoryTitle;
      
      for (const controlType of controlTypes) {
        const controlDef = controlDefUtil.getByType(controlType);
        
        const optionElem = document.createElement('option');
        optionElem.value = controlDef.type.val;
        optionElem.innerText = controlDef.name;
        
        optgroupElem.appendChild(optionElem);
      }
      
      this.selectElem.appendChild(optgroupElem);
    }
  }
  
  private setDescription(controlDef?: IControlDef): void {
    replaceChildren(this.descriptionElem);
    
    if (!controlDef) {
      return;
    }
    
    const desc = controlDef.description;
    
    const regexp = /https?:\/\/\S+/g;
    let match:RegExpExecArray|null = null;
    let index = 0;
    
    while ((match = regexp.exec(desc))) {
      this.descriptionElem.appendChild(document.createTextNode(
        desc.substring(index, match.index)
      ));
      
      const aElem = document.createElement('a');
      aElem.href = match[0];
      aElem.innerText = '[link]';
      
      this.descriptionElem.appendChild(aElem);
      
      index = match.index + match[0].length;
    }
    
    this.descriptionElem.appendChild(document.createTextNode(
      desc.substring(index)
    ));
  }
}


function getCategoryControlTypeMap(): Map<string, ControlType[]> {
  return new Map<string, ControlType[]>(Object.entries({
    'Popular': [
      controlTypeEnum.JOY_4WAY,
      controlTypeEnum.JOY_8WAY,
      controlTypeEnum.JOY_ANALOG,
      controlTypeEnum.TRACKBALL,
      controlTypeEnum.SPINNER,
      controlTypeEnum.LIGHTGUN,
    ],
    'Joysticks': [
      controlTypeEnum.JOY_2WAY_HORIZONTAL,
      controlTypeEnum.JOY_2WAY_VERTICAL,
      //controlTypeEnum.JOY_2WAY_VERTICAL_TRIGGER,
      controlTypeEnum.JOY_4WAY,
      controlTypeEnum.JOY_4WAY_DIAGONAL,
      //controlTypeEnum.JOY_4WAY_TRIGGER,
      controlTypeEnum.JOY_8WAY,
      controlTypeEnum.JOY_8WAY_TRIGGER,
      controlTypeEnum.JOY_8WAY_TOPFIRE,
      //controlTypeEnum.JOY_8WAY_ROTARY_OPTICAL,
      //controlTypeEnum.JOY_8WAY_ROTARY_MECHANICAL,
      controlTypeEnum.JOY_49WAY,
      controlTypeEnum.JOY_ANALOG,
      controlTypeEnum.JOY_ANALOG_FLIGHTSTICK,
    ],
    'Trackball/Spinner': [
      controlTypeEnum.TRACKBALL,
      //controlTypeEnum.ROLLER_HORIZONTAL,
      //controlTypeEnum.ROLLER_VERTICAL,
      controlTypeEnum.SPINNER,
      controlTypeEnum.SPINNER_PUSHPULL,
      controlTypeEnum.PADDLE,
    ],
    'Shooting': [
      controlTypeEnum.LIGHTGUN,
      controlTypeEnum.LIGHTGUN_ANALOG,
    ],
    'Driving': [
      controlTypeEnum.STEERINGWHEEL_360,
      controlTypeEnum.STEERINGWHEEL_270,
      controlTypeEnum.PEDAL_DIGITAL,
      controlTypeEnum.PEDAL_ANALOG,
      controlTypeEnum.SHIFTER_HIGHLOW,
      controlTypeEnum.SHIFTER_UPDOWN,
      controlTypeEnum.SHIFTER_4GEAR,
    ],
    'Flying': [
      controlTypeEnum.JOY_ANALOG_FLIGHTSTICK,
      //controlTypeEnum.JOY_ANALOG_YOKE,
      //controlTypeEnum.THROTTLE,
    ],
    'Other': [
      controlTypeEnum.DIRECTIONALBUTTONS_2WAY_HORIZONTAL,
      controlTypeEnum.DIRECTIONALBUTTONS_2WAY_VERTICAL,
      controlTypeEnum.DIRECTIONALBUTTONS_4WAY,
      //controlTypeEnum.HANDLEBARS,
      //controlTypeEnum.TURNTABLE,
      //controlTypeEnum.BASEBALLPITCHER,
      //controlTypeEnum.BATTERCONTROL,
      //controlTypeEnum.FOOTBALLKICKER,
      //controlTypeEnum.TRIVIABUTTONS,
      //controlTypeEnum.MAHJONGCP,
      //controlTypeEnum.MISC,
    ]
  }));
}