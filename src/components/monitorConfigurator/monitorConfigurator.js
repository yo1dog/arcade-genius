import './monitorConfigurator.less';
import monitorConfiguratorTemplate from './monitorConfigurator.html';
import htmlToBlock from '../../helpers/htmlToBlock';
import * as state from '../../dataAccess/state';

/** @typedef {import('../../dataAccess/modelineCalculator').ModelineConfig} ModelineConfig */


export default class MonitorConfigurator {
  /**
   * @param {string} id 
   */
  constructor(id) {
    this.id = id;
    
    this.elem = htmlToBlock(monitorConfiguratorTemplate).firstElementChild;
    this.presetInputElem      = this.elem.querySelector('.monitor-configurator__preset-input');
    this.orientationInputElem = this.elem.querySelector('.monitor-configurator__orientation-input');
  }
  
  init() {
    const modelineConfig = this.loadState();
    if (modelineConfig) {
      this.presetInputElem     .value = modelineConfig.preset;
      this.orientationInputElem.value = modelineConfig.orientation;
    }
  }
  
  /**
   * @returns {ModelineConfig}
   */
  getModelineConfig() {
    return {
      preset     : this.presetInputElem     .value,
      orientation: this.orientationInputElem.value,
      ranges: [],
      allowDoublescan: true,
      allowInterlaced: true
    };
  }
  
  /**
   * @returns {string}
   */
  getStateKey() {
    return `monitorConfiguratorModelineConfig-${this.id}`;
  }
  
  saveState() {
    state.set(this.getStateKey(), this.getModelineConfig());
  }
  
  /**
   * @returns {ModelineConfig}
   */
  loadState() {
    return state.get(this.getStateKey());
  }
  
  clearState() {
    state.remove(this.getStateKey());
  }
}
