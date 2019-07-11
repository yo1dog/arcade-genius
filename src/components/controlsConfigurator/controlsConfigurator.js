import './controlsConfigurator.less';
import controlsConfiguratorTemplate from './controlsConfigurator.html';
import controlsConfiguratorControlRowTemplate from './controlsConfiguratorControlRow.html';
import htmlToBlock from '../../helpers/htmlToBlock';
import * as state from '../../dataAccess/state';
import controlDefMap from '../../dataAccess/controlsDefMap';
import clearNodeChildren from '../../helpers/clearNodeChildren';

/** @typedef {import('../../dataAccess/controlsDefMap').ControlDef} ControlDef */

/**
 * @typedef ControlsConfig
 * @property {number} p1NumButtons
 * @property {number} p2NumButtons
 * @property {number} p3NumButtons
 * @property {number} p4NumButtons
 * @property {Object<string, number>} controlTypeCountMap
 * 
 * @typedef ControlRowDef
 * @property {HTMLTableRowElement} rowElem
 * @property {HTMLInputElement} countInputElem
 */


export default class ControlsConfigurator {
  /**
   * @param {string} id 
   */
  constructor(id) {
    this.id = id;
    
    this.elem = htmlToBlock(controlsConfiguratorTemplate).firstElementChild;
    this.p1NumButtonsInputElem     = this.elem.querySelector('.controls-configurator__num-buttons-input--p1');
    this.p2NumButtonsInputElem     = this.elem.querySelector('.controls-configurator__num-buttons-input--p2');
    this.p3NumButtonsInputElem     = this.elem.querySelector('.controls-configurator__num-buttons-input--p3');
    this.p4NumButtonsInputElem     = this.elem.querySelector('.controls-configurator__num-buttons-input--p4');
    this.controlTableElem          = this.elem.querySelector('.controls-configurator__control-table');
    this.addControlTypeSelectElem  = this.elem.querySelector('.controls-configurator__add-control-type-select');
    this.addControlButtonElem      = this.elem.querySelector('.controls-configurator__add-control-button');
    this.addControlDescriptionElem = this.elem.querySelector('.controls-configurator__add-control-description');
    
    /** @type {Object<string, ControlRowDef>} */
    this.controlTypeRowDefMap = {};
    
    this.populateControlTypeSelect();
    
    this.addControlTypeSelectElem.addEventListener('change', () => {
      const controlType = this.addControlTypeSelectElem.value;
      const controlDef = controlDefMap[controlType];
      
      this.setControlDescription(controlDef);
    });
    
    this.addControlButtonElem.addEventListener('click', () => {
      const controlType = this.addControlTypeSelectElem.value;
      const controlDef = controlDefMap[controlType];
      
      if (!controlDef) {
        return;
      }
      
      this.addControl(controlDef);
    });
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
      
      this.addControlTypeSelectElem.appendChild(optgroupElem);
    }
  }
  
  /**
   * @param {ControlDef} controlDef 
   */
  setControlDescription(controlDef) {
    clearNodeChildren(this.addControlDescriptionElem);
    
    if (!controlDef) {
      return;
    }
    
    const desc = controlDef.description;
    
    const regexp = /https?:\/\/\S+/g;
    /** @type {RegExpExecArray} */
    let match = null;
    let index = 0;
    
    while ((match = regexp.exec(desc))) {
      this.addControlDescriptionElem.appendChild(document.createTextNode(
        desc.substring(index, match.index)
      ));
      
      const aElem = document.createElement('a');
      aElem.href = match[0];
      aElem.innerText = match[0];
      
      this.addControlDescriptionElem.appendChild(aElem);
      
      index = match.index + match[0].length;
    }
    
    this.addControlDescriptionElem.appendChild(document.createTextNode(
      desc.substring(index)
    ));
  }
  
  /**
   * @param {ControlDef} controlDef
   * @returns {ControlRowDef}
   */
  upsertControlRowElem(controlDef) {
    if (this.controlTypeRowDefMap[controlDef.type]) {
      return this.controlTypeRowDefMap[controlDef.type];
    }
    
    const rowElem = htmlToBlock(controlsConfiguratorControlRowTemplate).firstElementChild;
    const nameElem         = rowElem.querySelector('.controls-configurator__control-name');
    const countInputElem   = rowElem.querySelector('.controls-configurator__control-count-input');
    const removeButtonElem = rowElem.querySelector('.controls-configurator__control-remove-button');
    
    nameElem.innerText = controlDef.name;
    removeButtonElem.addEventListener('click', () => {
      this.removeControlRowElem(controlDef);
    });
    
    this.controlTableElem.appendChild(rowElem);
    
    /** @type {ControlRowDef} */
    const controlRowDef = {
      rowElem,
      countInputElem
    };
    this.controlTypeRowDefMap[controlDef.type] = controlRowDef;
    
    return controlRowDef;
  }
  
  /**
   * @param {ControlDef} controlDef
   */
  removeControlRowElem(controlDef) {
    const controlRowDef = this.controlTypeRowDefMap[controlDef.type];
    if (!controlRowDef) return;
    
    controlRowDef.rowElem.remove();
    delete this.controlTypeRowDefMap[controlDef.type];
  }
  
  /**
   * @param {ControlDef} controlDef 
   * @param {number} count 
   * @returns {number}
   */
  setControlCount(controlDef, count) {
    const controlRowDef = this.upsertControlRowElem(controlDef);
    controlRowDef.countInputElem.value = count;
    return count;
  }
  
  /**
   * @param {ControlDef} controlDef 
   * @returns {number}
   */
  getControlCount(controlDef) {
    const controlRowDef = this.controlTypeRowDefMap[controlDef.type];
    if (!controlRowDef) {
      return 0;
    }
    
    return parseInt(controlRowDef.countInputElem.value, 10) || 0;
  }
  
  /**
   * @param {ControlDef} controlDef 
   * @returns {number}
   */
  addControl(controlDef) {
    const count = this.getControlCount(controlDef);
    return this.setControlCount(controlDef, count + 1);
  }
  
  init() {
    const controlsConfig = this.loadState();
    if (controlsConfig) {
      this.p1NumButtonsInputElem.value = controlsConfig.p1NumButtons || 0;
      this.p2NumButtonsInputElem.value = controlsConfig.p2NumButtons || 0;
      this.p3NumButtonsInputElem.value = controlsConfig.p3NumButtons || 0;
      this.p4NumButtonsInputElem.value = controlsConfig.p4NumButtons || 0;
      
      for (const [controlType, count] of Object.entries(controlsConfig.controlTypeCountMap)) {
        const controlDef = controlDefMap[controlType];
        if (!controlDef) continue;
        
        this.setControlCount(controlDef, count);
      }
    }
  }
  
  /**
   * @returns {ControlsConfig}
   */
  getControlsConfig() {
    /** @type {ControlsConfig} */
    const controlsConfig = {
      p1NumButtons: parseInt(this.p1NumButtonsInputElem.value, 10) || 0,
      p2NumButtons: parseInt(this.p2NumButtonsInputElem.value, 10) || 0,
      p3NumButtons: parseInt(this.p3NumButtonsInputElem.value, 10) || 0,
      p4NumButtons: parseInt(this.p4NumButtonsInputElem.value, 10) || 0,
      controlTypeCountMap: {}
    };
    
    for (const controlType in this.controlTypeRowDefMap) {
      const controlDef = controlDefMap[controlType];
      if (!controlDef) continue;
      
      controlsConfig.controlTypeCountMap[controlType] = this.getControlCount(controlDef);
    }
    
    return controlsConfig;
  }
  
  /**
   * @returns {string}
   */
  getStateKey() {
    return `controlsConfiguratorModelineConfig-${this.id}`;
  }
  
  saveState() {
    state.set(this.getStateKey(), this.getControlsConfig());
  }
  
  /**
   * @returns {ControlsConfig}
   */
  loadState() {
    return state.get(this.getStateKey());
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