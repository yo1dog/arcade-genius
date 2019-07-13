import './controlPanelConfigurator.less';
import cpConfiguratorTemplate from './controlPanelConfigurator.html';
import cpConfiguratorButtonClusterTemplate from './controlPanelConfiguratorButtonCluster.html';
import cpConfiguratorControlSetTemplate from './controlPanelConfiguratorControlSet.html';
import htmlToBlock from '../../helpers/htmlToBlock';
import * as state from '../../dataAccess/state';
import controlDefMap from '../../dataAccess/controlDefMap';
import clearNodeChildren from '../../helpers/clearNodeChildren';
import createUUID from '../../helpers/createUUID';

/** @typedef {import('../../dataAccess/controlDefMap').ControlDef} ControlDef */

/**
 * @typedef ControlPanelConfig
 * @property {ControlPanelButtonCluster[]} buttonClusters
 * @property {ControlPanelControlSet[]} controlSets
 * 
 * @typedef ControlPanelButtonCluster
 * @property {string} id
 * @property {string} name
 * @property {number} numButtons
 * 
 * @typedef ControlPanelControlSet
 * @property {string} id
 * @property {string} name
 * @property {ControlDef} controlDef
 * @property {ControlPanelButtonCluster} buttonCluster
 * 
 * @typedef ButtonClusterRowDef
 * @property {string} buttonClusterId
 * @property {HTMLTableRowElement} rowElem
 * @property {HTMLInputElement} nameInputElem
 * @property {HTMLInputElement} countInputElem
 * 
 * @typedef ControlSetRowDef
 * @property {string} controlSetId
 * @property {ControlDef} controlDef
 * @property {HTMLTableRowElement} rowElem
 * @property {HTMLInputElement} nameInputElem
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
    
    this.populateControlTypeSelect();
    
    this.controlTypeSelectElem.addEventListener('change', () => {
      const controlType = this.controlTypeSelectElem.value;
      const controlDef = controlDefMap[controlType];
      
      this.setControlDescription(controlDef);
    });
    
    this.addControlSetButtonElem.addEventListener('click', () => {
      const controlType = this.controlTypeSelectElem.value;
      if (!controlType) {
        return;
      }
      
      const controlDef = controlDefMap[controlType];
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
   * @param {string} [options.controlSetId] 
   * @param {string} [options.name] 
   * @param {string} [options.buttonClusterId] 
   * @returns {ButtonClusterRowDef}
   */
  addControlSetRow({controlDef, controlSetId = null, name = null, buttonClusterId = null}) {
    controlSetId = controlSetId || createUUID();
    
    const rowElem = htmlToBlock(cpConfiguratorControlSetTemplate).firstElementChild;
    const nameInputElem           = rowElem.querySelector('.control-panel-configurator__control-set__name-input');
    const controlNameElem         = rowElem.querySelector('.control-panel-configurator__control-set__control-name');
    const buttonClusterSelectElem = rowElem.querySelector('.control-panel-configurator__control-set__button-cluster-select');
    const removeButtonElem        = rowElem.querySelector('.control-panel-configurator__control-set__remove-button');
    
    rowElem.setAttribute('data-control-set-id', controlSetId);
    nameInputElem.value = name || this.getAutoControlSetName(controlDef);
    controlNameElem.innerText = controlDef.name;
    this.updateButtonClusterSelectElem(buttonClusterSelectElem);
    
    if (buttonClusterId) {
      // ensure button cluster ID exists
      if (this.buttonClusterRowDefs.findIndex(x => x.buttonClusterId === buttonClusterId) !== -1) {
        buttonClusterSelectElem.value = buttonClusterId;
      }
    }
    
    removeButtonElem.addEventListener('click', () => {
      this.removeControlSetRow(controlSetId);
    });
    
    this.controlSetTableBodyElem.appendChild(rowElem);
    
    /** @type {ControlSetRowDef} */
    const controlSetRowDef = {
      controlSetId,
      controlDef,
      rowElem,
      nameInputElem,
      buttonClusterSelectElem
    };
    this.controlSetRowDefs.push(controlSetRowDef);
    
    return controlSetRowDef;
  }
  
  /**
   * @param {string} controlSetId
   */
  removeControlSetRow(controlSetId) {
    const index = this.controlSetRowDefs.findIndex(x => x.controlSetId === controlSetId);
    if (index === -1) return;
    
    const controlSetRowDef = this.controlSetRowDefs[index];
    
    controlSetRowDef.rowElem.remove();
    
    this.controlSetRowDefs.splice(index, 1);
  }
  
  /**
   * @param {ControlDef} controlDef 
   * @returns {string}
   */
  getAutoControlSetName(controlDef) {
    const autoNameBase = controlDef.name;
    const regexp = new RegExp(`^\\s*${autoNameBase}(\\s+(\\d+))?\\s*$`);
    let maxAutoNameNumSuffix = 0;
    
    for (const controlSetRowRef of this.controlSetRowDefs) {
      const result = regexp.exec(controlSetRowRef.nameInputElem.value);
      if (!result) continue;
      
      const autoNameNumSuffix = result[2]? parseInt(result[2], 10) : 1;
      if (autoNameNumSuffix > maxAutoNameNumSuffix) {
        maxAutoNameNumSuffix = autoNameNumSuffix;
      }
    }
    
    return `${autoNameBase} ${maxAutoNameNumSuffix + 1}`;
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
    
    clearNodeChildren(selectElem);
    
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
        const controlDef = controlDefMap[controlType];
        
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
    clearNodeChildren(this.controlDescriptionElem);
    
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
  
  
  init() {
    const cpConfig = this.loadState();
    
    if (cpConfig) {
      for (const buttonCluster of cpConfig.buttonClusters || []) {
        this.addButtonClusterRow({
          buttonClusterId: buttonCluster.id,
          name           : buttonCluster.name,
          numButtons     : buttonCluster.numButtons
        });
      }
      
      for (const controlSet of cpConfig.controlSets || []) {
        this.addControlSetRow({
          controlSetId   : controlSet.id,
          controlDef     : controlSet.controlDef,
          name           : controlSet.name,
          buttonClusterId: controlSet.buttonCluster? controlSet.buttonCluster.id : null
        });
      }
    }
    
    if (this.buttonClusterRowDefs.length === 0) {
      this.addButtonClusterRow({numButtons: 3});
    }
    
    this.updateAllButtonClusterSelectElems();
    
    if (this.controlSetRowDefs.length === 0) {
      this.addControlSetRow({
        controlDef: controlDefMap['joy-8way'],
        buttonClusterId: this.buttonClusterRowDefs[0].buttonClusterId
      });
    }
  }
  
  /**
   * @returns {ControlPanelConfig}
   */
  getControlPanelConfig() {
    /** @type {ControlPanelButtonCluster[]} */
    const buttonClusters = this.buttonClusterRowDefs.map(buttonClusterRowDef => ({
      id  : buttonClusterRowDef.buttonClusterId,
      name: buttonClusterRowDef.nameInputElem.value.trim(),
      numButtons: parseInt(buttonClusterRowDef.countInputElem.value, 10) || 0
    }));
    
    const controlSets = this.controlSetRowDefs.map(controlSetRowDef => ({
      id        : controlSetRowDef.controlSetId,
      name      : controlSetRowDef.nameInputElem.value.trim(),
      controlDef: controlSetRowDef.controlDef,
      buttonCluster: buttonClusters.find(x => x.id === controlSetRowDef.buttonClusterSelectElem.value) || null
    }));
    
    /** @type {ControlPanelConfig} */
    return {
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
    
    // serialize config
    const sCPConfig = {
      sButtonClusters: cpConfig.buttonClusters.map(buttonCluster => ({
        id        : buttonCluster.id,
        name      : buttonCluster.name,
        numButtons: buttonCluster.numButtons
      })),
      sControlSets: cpConfig.controlSets.map(controlSet => ({
        id             : controlSet.id,
        controlType    : controlSet.controlDef.type,
        name           : controlSet.name,
        buttonClusterId: controlSet.buttonCluster? controlSet.buttonCluster.id : null
      }))
    };
    
    state.set(this.getStateKey(), sCPConfig);
  }
  
  /**
   * @returns {ControlPanelConfig}
   */
  loadState() {
    // de-serialize config
    const sCPConfig = state.get(this.getStateKey());
    if (!sCPConfig) return null;
    
    /** @type {ControlPanelButtonCluster[]} */
    const buttonClusters = sCPConfig.sButtonClusters.map(sButtonCluster => ({
      id        : sButtonCluster.id,
      name      : sButtonCluster.name,
      numButtons: sButtonCluster.numButtons
    }));
    
    /** @type {ControlPanelControlSet[]} */
    const controlSets = (
      sCPConfig.sControlSets
      .map(sControlSet => ({
        id           : sControlSet.id,
        controlDef   : controlDefMap[sControlSet.controlType],
        name         : sControlSet.name,
        buttonCluster: buttonClusters.find(x => x.id === sControlSet.buttonClusterId)
      }))
      .filter(x => x.controlDef)
    );
    
    /** @type {ControlPanelConfig} */
    return {
      buttonClusters,
      controlSets
    };
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