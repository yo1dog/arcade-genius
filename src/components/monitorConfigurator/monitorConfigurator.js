import './monitorConfigurator.less';
import monitorConfiguratorTemplate from './monitorConfigurator.html';
import htmlToBlock from '../../helpers/htmlToBlock';

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
  getLocalStorageKey() {
    return `monitorConfiguratorModelineConfig-${this.id}`;
  }
  
  saveState() {
    window.localStorage.setItem(this.getLocalStorageKey(), JSON.stringify(this.getModelineConfig()));
  }
  
  /**
   * @returns {ModelineConfig}
   */
  loadState() {
    try {
      return JSON.parse(window.localStorage.getItem(this.getLocalStorageKey()));
    } catch(err) {/*noop*/}
    return null;
  }
  
  clearState() {
    window.localStorage.removeItem(this.getLocalStorageKey());
  }
}
