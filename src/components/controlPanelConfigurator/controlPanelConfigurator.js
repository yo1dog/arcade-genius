import './controlPanelConfigurator.less';
import cpConfiguratorTemplate from './controlPanelConfigurator.html';
import cpConfiguratorButtonClusterTemplate from './controlPanelConfiguratorButtonCluster.html';
import cpConfiguratorControlSetTemplate from './controlPanelConfiguratorControlSet.html';
import htmlToBlock from '../../helpers/htmlToBlock';
import * as state from '../../dataAccess/state';
import * as controlDefUtil from '../../dataAccess/controlDefUtil';
import replaceNodeChildren from '../../helpers/replaceNodeChildren';
import createUUID from '../../helpers/createUUID';

/** @typedef {import('../../dataAccess/controlDefUtil').ControlDef} ControlDef */

/**
 * @typedef ControlPanelConfig
 * @property {ControlPanelControl[]} controls
 * @property {ControlPanelButtonCluster[]} buttonClusters
 * @property {ControlPanelControlSet[]} controlSets
 * 
 * @typedef ControlPanelButtonCluster
 * @property {string} id
 * @property {string} name
 * @property {number} numButtons
 * @property {boolean} isOnOppositeScreenSide
 * 
 * @typedef ControlPanelControlSet
 * @property {ControlPanelControl[]} controls
 * @property {ControlPanelButtonCluster} buttonCluster
 * 
 * @typedef ControlPanelControl
 * @property {string} id
 * @property {string} name
 * @property {ControlDef} controlDef
 * @property {number} numButtons
 * @property {boolean} isOnOppositeScreenSide
 * 
 * @typedef ButtonClusterRowDef
 * @property {string} buttonClusterId
 * @property {HTMLTableRowElement} rowElem
 * @property {HTMLInputElement} nameInputElem
 * @property {HTMLInputElement} countInputElem
 * 
 * @typedef ControlSetRowDef
 * @property {string} controlId
 * @property {ControlDef} controlDef
 * @property {HTMLTableRowElement} rowElem
 * @property {HTMLInputElement} controlNameInputElem
 * @property {HTMLInputElement} controlButtonsCountInputElem
 * @property {HTMLSelectElement} buttonClusterSelectElem
 */


export default class ControlPanelConfigurator {
  /**
   * @param {string} id 
   */
  constructor(id) {
    this.id = id;
    
    this.elem = htmlToBlock(cpConfiguratorTemplate).firstElementChild;
    this.buttonClusterTableBodyElem    = this.elem.querySelector('.control-panel-configurator__button-cluster-table__body');
    this.addButtonClusterTableBodyElem = this.elem.querySelector('.control-panel-configurator__add-button-cluster-button');
    
    this.controlSetTableBodyElem = this.elem.querySelector('.control-panel-configurator__control-set-table__body');
    this.controlTypeSelectElem   = this.elem.querySelector('.control-panel-configurator__control-type-select');
    this.addControlSetButtonElem = this.elem.querySelector('.control-panel-configurator__add-control-set-button');
    this.controlDescriptionElem  = this.elem.querySelector('.control-panel-configurator__control-description');
    
    /** @type {ButtonClusterRowDef[]} */
    this.buttonClusterRowDefs = [];
    /** @type {ControlSetRowDef[]} */
    this.controlSetRowDefs = [];
    
    this.addButtonClusterTableBodyElem.addEventListener('click', () => {
      this.addButtonClusterRow();
      this.updateAllButtonClusterSelectElems();
    });
    
    this.controlTypeSelectElem.addEventListener('change', () => {
      const controlType = this.controlTypeSelectElem.value;
      const controlDef = controlDefUtil.getByType(controlType);
      
      this.setControlDescription(controlDef);
    });
    
    this.addControlSetButtonElem.addEventListener('click', () => {
      const controlType = this.controlTypeSelectElem.value;
      if (!controlType) {
        return;
      }
      
      const controlDef = controlDefUtil.getByType(controlType);
      this.addControlSetRow({controlDef});
    });
  }
  
  /**
   * @param {object} [options] 
   * @param {string} [options.buttonClusterId] 
   * @param {string} [options.name] 
   * @param {number} [options.numButtons] 
   * @returns {ButtonClusterRowDef}
   */
  addButtonClusterRow({buttonClusterId = null, name = null, numButtons = null} = {}) {
    buttonClusterId = buttonClusterId || createUUID();
    
    const rowElem = htmlToBlock(cpConfiguratorButtonClusterTemplate).firstElementChild;
    const nameInputElem    = rowElem.querySelector('.control-panel-configurator__button-cluster__name-input');
    const countInputElem   = rowElem.querySelector('.control-panel-configurator__button-cluster__count-input');
    const removeButtonElem = rowElem.querySelector('.control-panel-configurator__button-cluster__remove-button');
    
    rowElem.setAttribute('data-button-cluster-id', buttonClusterId);
    nameInputElem.value = name || this.getAutoButtonClusterName();
    countInputElem.value = numButtons || 1;
    
    nameInputElem.addEventListener('change', () => {
      this.updateAllButtonClusterSelectElems();
    });
    removeButtonElem.addEventListener('click', () => {
      this.removeButtonClusterRow(buttonClusterId);
      this.updateAllButtonClusterSelectElems();
    });
    
    this.buttonClusterTableBodyElem.appendChild(rowElem);
    
    /** @type {ButtonClusterRowDef} */
    const buttonClusterRowDef = {
      buttonClusterId,
      rowElem,
      nameInputElem,
      countInputElem
    };
    this.buttonClusterRowDefs.push(buttonClusterRowDef);
    
    return buttonClusterRowDef;
  }
  
  removeButtonClusterRow(buttonClusterId) {
    const index = this.buttonClusterRowDefs.findIndex(x => x.buttonClusterId === buttonClusterId);
    if (index === -1) return;
    
    const buttonClusterRowDef = this.buttonClusterRowDefs[index];
    
    buttonClusterRowDef.rowElem.remove();
    
    this.buttonClusterRowDefs.splice(index, 1);
  }
  
  /**
   * @returns {string}
   */
  getAutoButtonClusterName() {
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
  
  /**
   * @param {object} options 
   * @param {ControlDef} options.controlDef 
   * @param {string} [options.controlId] 
   * @param {string} [options.controlName] 
   * @param {string} [options.buttonClusterId] 
   * @returns {ButtonClusterRowDef}
   */
  addControlSetRow({controlDef, controlId = null, controlName = null, numControlButtons = null, buttonClusterId = null}) {
    controlId = controlId || createUUID();
    
    const rowElem = htmlToBlock(cpConfiguratorControlSetTemplate).firstElementChild;
    const controlNameInputElem         = rowElem.querySelector('.control-panel-configurator__control-set__control-name-input');
    const controlDefNameElem           = rowElem.querySelector('.control-panel-configurator__control-set__control-def-name');
    const controlButtonsDescElem       = rowElem.querySelector('.control-panel-configurator__control-set__control-buttons-desc');
    const controlButtonsCountElem      = rowElem.querySelector('.control-panel-configurator__control-set__control-buttons-desc__count');
    const controlButtonsCountInputElem = rowElem.querySelector('.control-panel-configurator__control-set__control-buttons-desc__count-input');
    const buttonClusterSelectElem      = rowElem.querySelector('.control-panel-configurator__control-set__button-cluster-select');
    const removeButtonElem             = rowElem.querySelector('.control-panel-configurator__control-set__remove-button');
    
    rowElem.setAttribute('data-control-id', controlId);
    controlNameInputElem.value = controlName || this.getAutoControlName(controlDef);
    controlDefNameElem.innerText = controlDef.name;
    
    const {
      defaultNumControlButtons,
      canEditNumControlButtons
    } = this.getControlButtonsDescOptions(controlDef);
    
    numControlButtons = typeof numControlButtons === 'number'? numControlButtons : defaultNumControlButtons;
    controlButtonsCountElem.innerText = numControlButtons;
    controlButtonsCountInputElem.value = numControlButtons;
    
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
    
    /** @type {ControlSetRowDef} */
    const controlSetRowDef = {
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
  
  /**
   * @param {string} controlId
   */
  removeControlSetRow(controlId) {
    const index = this.controlSetRowDefs.findIndex(x => x.controlId === controlId);
    if (index === -1) return;
    
    const controlSetRowDef = this.controlSetRowDefs[index];
    
    controlSetRowDef.rowElem.remove();
    
    this.controlSetRowDefs.splice(index, 1);
  }
  
  /**
   * @param {ControlDef} controlDef 
   * @returns {string}
   */
  getAutoControlName(controlDef) {
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
  
  /**
   * @param {ControlDef} controlDef 
   * @returns {{defaultNumControlButtons: number, canEditNumControlButtons: boolean}}
   */
  getControlButtonsDescOptions(controlDef) {
    switch (controlDef.type) {
      case 'joy-2way-vertical-trigger':
      case 'joy-4way-trigger':
      case 'joy-8way-trigger':
        return {
          defaultNumControlButtons: 1,
          canEditNumControlButtons: true
        };
      
      case 'joy-8way-topfire':
        return {
          defaultNumControlButtons: 1,
          canEditNumControlButtons: false
        };
      
      case 'joy-analog-flightstick':
        return {
          defaultNumControlButtons: 3,
          canEditNumControlButtons: true
        };
      
      case 'joy-analog-yoke':
      case 'throttle': 
        return {
          defaultNumControlButtons: 2,
          canEditNumControlButtons: true
        };
      
      case 'steeringwheel-360':
      case 'steeringwheel-270':
      case 'shifter-highlow': 
      case 'shifter-updown':
      case 'shifter-4gear':
        return {
          defaultNumControlButtons: 0,
          canEditNumControlButtons: true
        };
      
      case 'lightgun':
      case 'lightgun-analog':
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
  
  /**
   * @param {HTMLElement} controlButtonsDescElem 
   * @param {number} numControlButtons 
   */
  updateControlButtonsDescription(controlButtonsDescElem, numControlButtons) {
    const isSingular = numControlButtons === 1;
    
    controlButtonsDescElem.classList.toggle('control-panel-configurator__control-set__control-buttons-desc--singular', isSingular);
    controlButtonsDescElem.classList.toggle('control-panel-configurator__control-set__control-buttons-desc--plural', !isSingular);
  }
  
  updateAllButtonClusterSelectElems() {
    for (const controlSetRowDef of this.controlSetRowDefs) {
      this.updateButtonClusterSelectElem(controlSetRowDef.buttonClusterSelectElem);
    }
  }
  
  /**
   * @param {HTMLSelectElement} selectElem 
   */
  updateButtonClusterSelectElem(selectElem) {
    const prevValue = selectElem.value;
    let prevValueExists = false;
    
    replaceNodeChildren(selectElem);
    
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
  
  populateControlTypeSelect() {
    for (const [categoryTitle, controlTypes] of Object.entries(getCategoryControlTypeMap())) {
      const optgroupElem = document.createElement('optgroup');
      optgroupElem.label = categoryTitle;
      
      for (const controlType of controlTypes) {
        const controlDef = controlDefUtil.getByType(controlType);
        
        const optionElem = document.createElement('option');
        optionElem.value = controlDef.type;
        optionElem.innerText = controlDef.name;
        
        optgroupElem.appendChild(optionElem);
      }
      
      this.controlTypeSelectElem.appendChild(optgroupElem);
    }
  }
  
  /**
   * @param {ControlDef} controlDef 
   */
  setControlDescription(controlDef) {
    replaceNodeChildren(this.controlDescriptionElem);
    
    if (!controlDef) {
      return;
    }
    
    const desc = controlDef.description;
    
    const regexp = /https?:\/\/\S+/g;
    /** @type {RegExpExecArray} */
    let match = null;
    let index = 0;
    
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
  
  
  async init() {
    await controlDefUtil.init();
    
    const cpConfigState = this.loadState();
    
    if (cpConfigState) {
      for (const buttonCluster of cpConfigState.buttonClusters || []) {
        this.addButtonClusterRow({
          buttonClusterId: buttonCluster.id,
          name           : buttonCluster.name,
          numButtons     : buttonCluster.numButtons
        });
      }
      
      for (const controlSet of cpConfigState.controlSets || []) {
        this.addControlSetRow({
          controlId        : controlSet.controls[0].id,
          controlName      : controlSet.controls[0].name,
          controlDef       : controlSet.controls[0].controlDef,
          numControlButtons: controlSet.controls[0].numButtons,
          buttonClusterId  : controlSet.buttonCluster? controlSet.buttonCluster.id : null
        });
      }
    }
    
    if (this.buttonClusterRowDefs.length === 0) {
      this.addButtonClusterRow({numButtons: 3});
    }
    
    this.updateAllButtonClusterSelectElems();
    
    if (this.controlSetRowDefs.length === 0) {
      this.addControlSetRow({
        controlDef: controlDefUtil.getByType('joy-8way'),
        buttonClusterId: this.buttonClusterRowDefs[0].buttonClusterId
      });
    }
    
    this.populateControlTypeSelect();
  }
  
  /**
   * @returns {ControlPanelConfig}
   */
  getControlPanelConfig() {
    /** @type {ControlPanelButtonCluster[]} */
    const buttonClusters = this.buttonClusterRowDefs.map(buttonClusterRowDef => ({
      id  : buttonClusterRowDef.buttonClusterId,
      name: buttonClusterRowDef.nameInputElem.value.trim(),
      numButtons: parseInt(buttonClusterRowDef.countInputElem.value, 10) || 0,
      isOnOppositeScreenSide: false
    }));
    
    /** @type {ControlPanelControlSet[]} */
    const controlSets = this.controlSetRowDefs.map(controlSetRowDef => ({
      controls: [{
        id        : controlSetRowDef.controlSetId,
        name      : controlSetRowDef.controlNameInputElem.value.trim(),
        controlDef: controlSetRowDef.controlDef,
        numButtons: parseInt(controlSetRowDef.controlButtonsCountInputElem.value, 10) || 0,
        isOnOppositeScreenSide: false
      }],
      buttonCluster: buttonClusters.find(x => x.id === controlSetRowDef.buttonClusterSelectElem.value) || null
    }));
    
    // assume each control set row defines physical controls
    // 
    // this may seem backwards as you would assume you define the physical
    // controls first and then create control sets based on those. However,
    // we do it this way to keep the UI simple
    
    /** @type {ControlPanelControl[]} */
    const controls = (
      controlSets
      .map(x => x.controls)
      .reduce((p, c) => p.concat(c), [])
    );
    
    /** @type {ControlPanelConfig} */
    return {
      controls,
      buttonClusters,
      controlSets
    };
  }
  
  /**
   * @returns {string}
   */
  getStateKey() {
    return `controlPanelConfigurator-${this.id}`;
  }
  
  saveState() {
    const cpConfig = this.getControlPanelConfig();
    
    // serialize
    const sCPConfigState = {
      buttonClusters: cpConfig.buttonClusters,
      sControlSets: cpConfig.controlSets.map(controlSet => ({
        sControls: controlSet.controls.map(control => ({
          id                    : control.id,
          name                  : control.name,
          type                  : control.controlDef.type,
          numButtons            : control.numButtons,
          isOnOppositeScreenSide: control.isOnOppositeScreenSide
        })),
        buttonClusterId: controlSet.buttonCluster? controlSet.buttonCluster.id : null
      })),
    };
    
    state.set(this.getStateKey(), sCPConfigState);
  }
  
  loadState() {
    // de-serialize
    const sCPConfigState = state.get(this.getStateKey());
    if (!sCPConfigState) return null;
    
    /** @type {ControlPanelButtonCluster[]} */
    const buttonClusters = sCPConfigState.buttonClusters;
    
    /** @type {ControlPanelControlSet[]} */
    const controlSets = (
      sCPConfigState.sControlSets
      .map(sControlSet => ({
        controls: sControlSet.sControls.map(sControl => ({
          id                    : sControl.id,
          name                  : sControl.name,
          controlDef            : controlDefUtil.getByType(sControl.type),
          numButtons            : sControl.numButtons,
          isOnOppositeScreenSide: sControl.isOnOppositeScreenSide
        })),
        buttonCluster: buttonClusters.find(x => x.id === sControlSet.buttonClusterId)
      }))
      .filter(controlSet =>
        controlSet.controls[0] &&
        controlSet.controls[0].controlDef
      )
    );
    
    const cpConfigState = {
      buttonClusters,
      controlSets
    };
    return cpConfigState;
  }
  
  clearState() {
    state.remove(this.getStateKey());
  }
}

function getCategoryControlTypeMap() {
  return {
    'Popular': [
      'joy-4way',
      'joy-8way',
      'joy-analog',
      'trackball',
      'spinner',
      'lightgun',
    ],
    'Joysticks': [
      'joy-2way-horizontal',
      'joy-2way-vertical',
      //'joy-2way-vertical-trigger',
      'joy-4way',
      'joy-4way-diagonal',
      //'joy-4way-trigger',
      'joy-8way',
      'joy-8way-trigger',
      'joy-8way-topfire',
      //'joy-8way-rotary-optical',
      //'joy-8way-rotary-mechanical',
      'joy-49way',
      'joy-analog',
      'joy-analog-flightstick',
    ],
    'Trackball/Spinner': [
      'trackball',
      //'roller-horizontal',
      //'roller-vertical',
      'spinner',
      'spinner-pushpull',
      'paddle',
    ],
    'Shooting': [
      'lightgun',
      'lightgun-analog',
    ],
    'Driving': [
      'steeringwheel-360',
      'steeringwheel-270',
      'pedal-digital',
      'pedal-analog',
      'shifter-highlow',
      'shifter-updown',
      'shifter-4gear',
    ],
    'Flying': [
      'joy-analog-flightstick',
      //'joy-analog-yoke',
      //'throttle',
    ],
    'Other': [
      'directionalbuttons-2way-horizontal',
      'directionalbuttons-2way-vertical',
      'directionalbuttons-4way',
      //'handlebars',
      //'turntable',
      //'baseballpitcher',
      //'battercontrol',
      //'footballkicker',
      //'triviabuttons',
      //'mahjongcp',
      //'misc',
    ]
  };
}