import './controlPanelConfigurator.less';
import cpConfiguratorTemplate              from './controlPanelConfigurator.html';
import cpConfiguratorButtonClusterTemplate from './controlPanelConfiguratorButtonCluster.html';
import cpConfiguratorControlSetTemplate    from './controlPanelConfiguratorControlSet.html';
import * as stateUtil                      from '../../dataAccess/stateUtil';
import * as controlDefUtil                 from '../../dataAccess/controlDefUtil';
import createUUID                          from 'lib/get_uuid.js';
import {
  serializeState,
  deserializeState
} from './controlPanelConfiguratorSerializer';
import {
  htmlToBlock,
  selectR,
  firstChildR,
  replaceChildren
} from '../../helpers/htmlUtil';
import {
  ICPConfiguration,
  ICPButtonCluster
} from '../../types/controlPanel';
import {
  IControlDef,
  ControlType,
  controlTypeEnum
} from '../../types/controlDef';

export interface ICPConfiguratorState {
  readonly cpConfig: ICPConfiguration;
}

export interface IButtonClusterRowDef {
  readonly buttonClusterId: string;
  readonly rowElem        : HTMLTableRowElement;
  readonly nameInputElem  : HTMLInputElement;
  readonly countInputElem : HTMLInputElement;
}

export interface IControlSetRowDef {
  readonly controlId                   : string;
  readonly controlDef                  : IControlDef;
  readonly rowElem                     : HTMLTableRowElement;
  readonly controlNameInputElem        : HTMLInputElement;
  readonly controlButtonsCountInputElem: HTMLInputElement;
  readonly buttonClusterSelectElem     : HTMLSelectElement;
}


export default class ControlPanelConfigurator {
  public readonly id  : string;
  public readonly elem: HTMLElement;
  
  private readonly buttonClusterTableBodyElem   : HTMLElement;
  private readonly addButtonClusterTableBodyElem: HTMLElement;
  private readonly controlSetTableBodyElem      : HTMLElement;
  private readonly controlTypeSelectElem        : HTMLSelectElement;
  private readonly addControlSetButtonElem      : HTMLElement;
  private readonly controlDescriptionElem       : HTMLElement;
  
  private readonly buttonClusterRowDefs: IButtonClusterRowDef[];
  private readonly controlSetRowDefs   : IControlSetRowDef[];
  
  
  public constructor(id: string) {
    this.id = id;
    
    this.elem = firstChildR(htmlToBlock(cpConfiguratorTemplate));
    this.buttonClusterTableBodyElem    = selectR(this.elem, '.control-panel-configurator__button-cluster-table__body');
    this.addButtonClusterTableBodyElem = selectR(this.elem, '.control-panel-configurator__add-button-cluster-button');
    
    this.controlSetTableBodyElem = selectR(this.elem, '.control-panel-configurator__control-set-table__body');
    this.controlTypeSelectElem   = selectR(this.elem, '.control-panel-configurator__control-type-select', 'select');
    this.addControlSetButtonElem = selectR(this.elem, '.control-panel-configurator__add-control-set-button');
    this.controlDescriptionElem  = selectR(this.elem, '.control-panel-configurator__control-description');
    
    this.buttonClusterRowDefs = [];
    this.controlSetRowDefs = [];
    
    this.addButtonClusterTableBodyElem.addEventListener('click', () => {
      this.addButtonClusterRow();
      this.updateAllButtonClusterSelectElems();
    });
    
    this.controlTypeSelectElem.addEventListener('change', () => {
      const controlTypeInput = this.controlTypeSelectElem.value;
      if (!controlTypeInput) {
        this.setControlDescription();
        return;
      }
      
      const controlType = controlTypeEnum.get(controlTypeInput);
      if (!controlType) throw new Error(`Invalid control type selected: '${controlTypeInput}'`);
      
      const controlDef = controlDefUtil.getByType(controlType);
      this.setControlDescription(controlDef);
    });
    
    this.addControlSetButtonElem.addEventListener('click', () => {
      const controlTypeInput = this.controlTypeSelectElem.value;
      if (!controlTypeInput) {
        return;
      }
      
      const controlType = controlTypeEnum.get(controlTypeInput);
      if (!controlType) {
        throw new Error(`Invalid control type selected: '${controlTypeInput}'`);
      }
      
      const controlDef = controlDefUtil.getByType(controlType);
      this.addControlSetRow(controlDef);
    });
  }
  
  private addButtonClusterRow({
    buttonClusterId = createUUID(),
    name            = this.getAutoButtonClusterName(),
    numButtons      = 1
  } = {}): IButtonClusterRowDef {
    const rowElem = firstChildR(htmlToBlock(cpConfiguratorButtonClusterTemplate), 'tr');
    const nameInputElem    = selectR(rowElem, '.control-panel-configurator__button-cluster__name-input', 'input');
    const countInputElem   = selectR(rowElem, '.control-panel-configurator__button-cluster__count-input', 'input');
    const removeButtonElem = selectR(rowElem, '.control-panel-configurator__button-cluster__remove-button');
    
    rowElem.setAttribute('data-button-cluster-id', buttonClusterId);
    nameInputElem.value = name;
    countInputElem.value = numButtons.toString();
    
    nameInputElem.addEventListener('change', () => {
      this.updateAllButtonClusterSelectElems();
    });
    removeButtonElem.addEventListener('click', () => {
      this.removeButtonClusterRow(buttonClusterId);
      this.updateAllButtonClusterSelectElems();
    });
    
    this.buttonClusterTableBodyElem.appendChild(rowElem);
    
    const buttonClusterRowDef: IButtonClusterRowDef = {
      buttonClusterId,
      rowElem,
      nameInputElem,
      countInputElem
    };
    this.buttonClusterRowDefs.push(buttonClusterRowDef);
    
    return buttonClusterRowDef;
  }
  
  private removeButtonClusterRow(buttonClusterId: string): void {
    const index = this.buttonClusterRowDefs.findIndex(x => x.buttonClusterId === buttonClusterId);
    if (index === -1) return;
    
    const buttonClusterRowDef = this.buttonClusterRowDefs[index];
    buttonClusterRowDef.rowElem.remove();
    
    this.buttonClusterRowDefs.splice(index, 1);
  }
  
  private getAutoButtonClusterName():string {
    const autoNameBase = 'Buttons';
    const regexp = new RegExp(`^\\s*${autoNameBase}\\s+(\\d+)\\s*$`);
    let maxAutoNameNumSuffix = 0;
    
    for (const buttonClusterRowRef of this.buttonClusterRowDefs) {
      const result = regexp.exec(buttonClusterRowRef.nameInputElem.value);
      if (!result) continue;
      
      const autoNameNumSuffix = parseInt(result[1], 10);
      if (autoNameNumSuffix > maxAutoNameNumSuffix) {
        maxAutoNameNumSuffix = autoNameNumSuffix;
      }
    }
    
    return `${autoNameBase} ${maxAutoNameNumSuffix + 1}`;
  }
  
  private addControlSetRow(
    controlDef: IControlDef,
    options: {
      controlId?        : string;
      controlName?      : string;
      numControlButtons?: number;
      buttonClusterId?  : string;
    } = {}
  ): IControlSetRowDef {
    const {
      defaultNumControlButtons,
      canEditNumControlButtons
    } = this.getControlButtonsDescOptions(controlDef);
    
    const {
      controlId         = createUUID(),
      controlName       = this.getAutoControlName(controlDef),
      numControlButtons = defaultNumControlButtons,
      buttonClusterId
    } = options;
    
    const rowElem = firstChildR(htmlToBlock(cpConfiguratorControlSetTemplate), 'tr');
    const controlNameInputElem         = selectR(rowElem, '.control-panel-configurator__control-set__control-name-input', 'input');
    const controlDefNameElem           = selectR(rowElem, '.control-panel-configurator__control-set__control-def-name');
    const controlButtonsDescElem       = selectR(rowElem, '.control-panel-configurator__control-set__control-buttons-desc');
    const controlButtonsCountElem      = selectR(rowElem, '.control-panel-configurator__control-set__control-buttons-desc__count');
    const controlButtonsCountInputElem = selectR(rowElem, '.control-panel-configurator__control-set__control-buttons-desc__count-input', 'input');
    const buttonClusterSelectElem      = selectR(rowElem, '.control-panel-configurator__control-set__button-cluster-select', 'select');
    const removeButtonElem             = selectR(rowElem, '.control-panel-configurator__control-set__remove-button');
    
    rowElem.setAttribute('data-control-id', controlId);
    controlNameInputElem.value = controlName;
    controlDefNameElem.innerText = controlDef.name;
    
    controlButtonsCountElem.innerText = numControlButtons.toString();
    controlButtonsCountInputElem.value = numControlButtons.toString();
    
    if (numControlButtons > 0 || canEditNumControlButtons) {
      controlButtonsDescElem.classList.remove('hidden');
      
      if (canEditNumControlButtons) {
        controlButtonsCountInputElem.classList.remove('hidden');
        controlButtonsCountInputElem.addEventListener('change', () => {
          this.updateControlButtonsDescription(
            controlButtonsDescElem,
            parseInt(controlButtonsCountInputElem.value, 10) || 0
          );
        });
      }
      else {
        controlButtonsCountElem.classList.remove('hidden');
      }
    }
    
    this.updateControlButtonsDescription(controlButtonsDescElem, numControlButtons);
    
    this.updateButtonClusterSelectElem(buttonClusterSelectElem);
    if (buttonClusterId) {
      // ensure button cluster ID exists
      if (this.buttonClusterRowDefs.findIndex(x => x.buttonClusterId === buttonClusterId) !== -1) {
        buttonClusterSelectElem.value = buttonClusterId;
      }
    }
    
    removeButtonElem.addEventListener('click', () => {
      this.removeControlSetRow(controlId);
    });
    
    this.controlSetTableBodyElem.appendChild(rowElem);
    
    const controlSetRowDef:IControlSetRowDef = {
      controlId,
      controlDef,
      rowElem,
      controlNameInputElem,
      controlButtonsCountInputElem,
      buttonClusterSelectElem
    };
    this.controlSetRowDefs.push(controlSetRowDef);
    
    return controlSetRowDef;
  }
  
  private removeControlSetRow(controlId: string): IControlSetRowDef | undefined {
    const index = this.controlSetRowDefs.findIndex(x => x.controlId === controlId);
    if (index === -1) return;
    
    const controlSetRowDef = this.controlSetRowDefs[index];
    controlSetRowDef.rowElem.remove();
    
    return this.controlSetRowDefs.splice(index, 1)[0];
  }
  
  private getAutoControlName(controlDef:IControlDef): string {
    const autoNameBase = controlDef.name;
    const regexp = new RegExp(`^\\s*${autoNameBase}(\\s+(\\d+))?\\s*$`);
    let maxAutoNameNumSuffix = 0;
    
    for (const controlSetRowRef of this.controlSetRowDefs) {
      const result = regexp.exec(controlSetRowRef.controlNameInputElem.value);
      if (!result) continue;
      
      const autoNameNumSuffix = result[2]? parseInt(result[2], 10) : 1;
      if (autoNameNumSuffix > maxAutoNameNumSuffix) {
        maxAutoNameNumSuffix = autoNameNumSuffix;
      }
    }
    
    return `${autoNameBase} ${maxAutoNameNumSuffix + 1}`;
  }
  
  private getControlButtonsDescOptions(controlDef:IControlDef): {
    defaultNumControlButtons: number;
    canEditNumControlButtons: boolean;
  } {
    switch (controlDef.type) {
      case controlTypeEnum.JOY_2WAY_VERTICAL_TRIGGER:
      case controlTypeEnum.JOY_4WAY_TRIGGER:
      case controlTypeEnum.JOY_8WAY_TRIGGER:
        return {
          defaultNumControlButtons: 1,
          canEditNumControlButtons: true
        };
      
      case controlTypeEnum.JOY_8WAY_TOPFIRE:
        return {
          defaultNumControlButtons: 1,
          canEditNumControlButtons: false
        };
      
      case controlTypeEnum.JOY_ANALOG_FLIGHTSTICK:
        return {
          defaultNumControlButtons: 3,
          canEditNumControlButtons: true
        };
      
      case controlTypeEnum.JOY_ANALOG_YOKE:
      case controlTypeEnum.THROTTLE:
        return {
          defaultNumControlButtons: 2,
          canEditNumControlButtons: true
        };
      
      case controlTypeEnum.STEERINGWHEEL_360:
      case controlTypeEnum.STEERINGWHEEL_270:
      case controlTypeEnum.SHIFTER_HIGHLOW:
      case controlTypeEnum.SHIFTER_UPDOWN:
      case controlTypeEnum.SHIFTER_4GEAR:
        return {
          defaultNumControlButtons: 0,
          canEditNumControlButtons: true
        };
      
      case controlTypeEnum.LIGHTGUN:
      case controlTypeEnum.LIGHTGUN_ANALOG:
        return {
          defaultNumControlButtons: 1,
          canEditNumControlButtons: true
        };
      
      default:
        return {
          defaultNumControlButtons: 0,
          canEditNumControlButtons: false
        };
    }
  }
  
  private updateControlButtonsDescription(
    controlButtonsDescElem: HTMLElement,
    numControlButtons     : number
  ): void {
    const isSingular = numControlButtons === 1;
    
    controlButtonsDescElem.classList.toggle('control-panel-configurator__control-set__control-buttons-desc--singular', isSingular);
    controlButtonsDescElem.classList.toggle('control-panel-configurator__control-set__control-buttons-desc--plural', !isSingular);
  }
  
  private updateAllButtonClusterSelectElems() {
    for (const controlSetRowDef of this.controlSetRowDefs) {
      this.updateButtonClusterSelectElem(controlSetRowDef.buttonClusterSelectElem);
    }
  }
  
  private updateButtonClusterSelectElem(selectElem: HTMLSelectElement): void {
    const prevValue = selectElem.value;
    let prevValueExists = false;
    
    replaceChildren(selectElem);
    
    const noneOptionElem = document.createElement('option');
    noneOptionElem.value = '';
    noneOptionElem.innerText = 'None';
    selectElem.appendChild(noneOptionElem);
    
    for (const buttonClusterRowDef of this.buttonClusterRowDefs) {
      const optionElem = document.createElement('option');
      optionElem.value = buttonClusterRowDef.buttonClusterId;
      optionElem.innerText = buttonClusterRowDef.nameInputElem.value.trim() || '<unnamed>';
      
      selectElem.appendChild(optionElem);
      
      if (optionElem.value === prevValue) {
        prevValueExists = true;
      }
    }
    
    selectElem.value = prevValueExists? prevValue : '';
  }
  
  private populateControlTypeSelect(): void {
    for (const [categoryTitle, controlTypes] of this.getCategoryControlTypeMap()) {
      const optgroupElem = document.createElement('optgroup');
      optgroupElem.label = categoryTitle;
      
      for (const controlType of controlTypes) {
        const controlDef = controlDefUtil.getByType(controlType);
        
        const optionElem = document.createElement('option');
        optionElem.value = controlDef.type.val;
        optionElem.innerText = controlDef.name;
        
        optgroupElem.appendChild(optionElem);
      }
      
      this.controlTypeSelectElem.appendChild(optgroupElem);
    }
  }
  
  private setControlDescription(controlDef?: IControlDef): void {
    replaceChildren(this.controlDescriptionElem);
    
    if (!controlDef) {
      return;
    }
    
    const desc = controlDef.description;
    
    const regexp = /https?:\/\/\S+/g;
    let match:RegExpExecArray|null = null;
    let index = 0;
    
    // tslint:disable-next-line no-conditional-assignment
    while ((match = regexp.exec(desc))) {
      this.controlDescriptionElem.appendChild(document.createTextNode(
        desc.substring(index, match.index)
      ));
      
      const aElem = document.createElement('a');
      aElem.href = match[0];
      aElem.innerText = match[0];
      
      this.controlDescriptionElem.appendChild(aElem);
      
      index = match.index + match[0].length;
    }
    
    this.controlDescriptionElem.appendChild(document.createTextNode(
      desc.substring(index)
    ));
  }
  
  
  public async init() {
    await controlDefUtil.init();
    
    const state = this.loadState();
    
    if (state) {
      const {cpConfig} = state;
      
      for (const buttonCluster of cpConfig.buttonClusters) {
        this.addButtonClusterRow({
          buttonClusterId: buttonCluster.id,
          name           : buttonCluster.name,
          numButtons     : buttonCluster.numButtons
        });
      }
      
      for (const controlSet of cpConfig.controlSets) {
        this.addControlSetRow(
          controlSet.controls[0].controlDef,
          {
            controlId        : controlSet.controls[0].id,
            controlName      : controlSet.controls[0].name,
            numControlButtons: controlSet.controls[0].numButtons,
            buttonClusterId  : controlSet.buttonCluster? controlSet.buttonCluster.id : undefined
          }
        );
      }
    }
    
    if (this.buttonClusterRowDefs.length === 0) {
      this.addButtonClusterRow({numButtons: 3});
    }
    
    this.updateAllButtonClusterSelectElems();
    
    if (this.controlSetRowDefs.length === 0) {
      this.addControlSetRow(
        controlDefUtil.getByType(controlTypeEnum.JOY_8WAY),
        {buttonClusterId: this.buttonClusterRowDefs[0].buttonClusterId}
      );
    }
    
    this.populateControlTypeSelect();
  }
  
  public getControlPanelConfig():ICPConfiguration {
    const buttonClusters = this.buttonClusterRowDefs.map(buttonClusterRowDef => {
      const buttonCluster:ICPButtonCluster = {
        id  : buttonClusterRowDef.buttonClusterId,
        name: buttonClusterRowDef.nameInputElem.value.trim(),
        numButtons: parseInt(buttonClusterRowDef.countInputElem.value, 10) || 0,
        isOnOppositeScreenSide: false
      };
      return buttonCluster;
    });
    
    const controlSets = this.controlSetRowDefs.map(controlSetRowDef => {
      /** @type {ICPControlSet} */
      const controlSet = {
        controls: [{
          id        : controlSetRowDef.controlId,
          name      : controlSetRowDef.controlNameInputElem.value.trim(),
          controlDef: controlSetRowDef.controlDef,
          numButtons: parseInt(controlSetRowDef.controlButtonsCountInputElem.value, 10) || 0,
          isOnOppositeScreenSide: false
        }],
        buttonCluster: buttonClusters.find(x => x.id === controlSetRowDef.buttonClusterSelectElem.value)
      };
      return controlSet;
    });
    
    // assume each control set row defines a physical control
    // 
    // this may seem backwards as you would assume you define the physical
    // controls first and then create control sets based on those. However,
    // we do it this way for now to keep the UI simple
    
    const controls = controlSets.flatMap(x => x.controls);
    
    /** @type {ICPConfiguration} */
    const controlPanelConfig = {
      controls,
      buttonClusters,
      controlSets
    };
    return controlPanelConfig;
  }
  
  private getStateKey():string {
    return `controlPanelConfigurator-${this.id}`;
  }
  
  public saveState():void {
    const state:ICPConfiguratorState = {
      cpConfig: this.getControlPanelConfig()
    };
    
    const sState = serializeState(state);
    stateUtil.set(this.getStateKey(), sState);
  }
  
  private loadState(): ICPConfiguratorState | undefined {
    const sState = stateUtil.get(this.getStateKey());
    if (!sState) return;
    
    try {
      return deserializeState(sState, 'sCPConfiguratorState');
    }
    catch (err) {
      console.error(`Error deserializing Control Panel Configurator '${this.id}' state:`);
      console.error(err);
    }
  }
  
  public clearState():void {
    stateUtil.remove(this.getStateKey());
  }
  
  private getCategoryControlTypeMap(): Map<string, ControlType[]> {
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
}
