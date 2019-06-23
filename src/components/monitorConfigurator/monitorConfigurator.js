import './monitorConfigurator.less';
import monitorConfiguratorTemplate from './monitorConfigurator.html';
import htmlToBlock from '../../helpers/htmlToBlock';

/** @typedef {import('../../dataAccess/modelineCalculator').ModelineConfig} ModelineConfig */


export default class MonitorConfigurator {
  constructor() {
    this.block = htmlToBlock(monitorConfiguratorTemplate);
    this.presetInputElem      = this.block.getElementById('monitor-configurator__preset-input');
    this.orientationInputElem = this.block.getElementById('monitor-configurator__orientation-input');
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
  
  saveState() {
    window.localStorage.setItem('monitorConfiguratorModelineConfig', JSON.stringify(this.getModelineConfig()));
  }
  
  /**
   * @returns {ModelineConfig}
   */
  loadState() {
    try {
      return JSON.parse(window.localStorage.getItem('monitorConfiguratorModelineConfig'));
    } catch(err) {/*noop*/}
    return null;
  }
}
