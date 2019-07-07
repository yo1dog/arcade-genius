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
    this.presetInputElem             = this.elem.querySelector('.monitor-configurator__preset-input');
    this.orientationInputElem        = this.elem.querySelector('.monitor-configurator__orientation-input');
    this.rangesRowElem               = this.elem.querySelector('.monitor-configurator__ranges-row');
    this.rangesInputElem             = this.elem.querySelector('.monitor-configurator__ranges-input');
    this.allowInterlacedCheckboxElem = this.elem.querySelector('.monitor-configurator__allow-interlaced-checkbox');
    this.allowDoublescanCheckboxElem = this.elem.querySelector('.monitor-configurator__allow-doublescan-checkbox');
    
    this.presetInputElem.addEventListener('change', () => {
      this.updateRangesVisibility();
    });
  }
  
  init() {
    const modelineConfig = this.loadState();
    if (modelineConfig) {
      this.presetInputElem            .value   = modelineConfig.preset;
      this.orientationInputElem       .value   = modelineConfig.orientation;
      this.rangesInputElem            .value   = modelineConfig.ranges.join('\n');
      this.allowInterlacedCheckboxElem.checked = modelineConfig.allowInterlaced;
      this.allowDoublescanCheckboxElem.checked = modelineConfig.allowDoublescan;
    }
    this.updateRangesVisibility();
  }
  
  /**
   * @returns {ModelineConfig}
   */
  getModelineConfig() {
    const preset      = this.presetInputElem     .value;
    const orientation = this.orientationInputElem.value;
    const ranges = preset !== 'custom'? [] : (
      this.rangesInputElem.value
      .split('\n')
      .map(line => line.trim())
      .filter(line => line.length > 0)
    );
    const allowInterlaced = this.allowInterlacedCheckboxElem.checked;
    const allowDoublescan = this.allowDoublescanCheckboxElem.checked;
    
    return {
      preset,
      orientation,
      ranges,
      allowInterlaced,
      allowDoublescan
    };
  }
  
  updateRangesVisibility() {
    this.rangesRowElem.classList.toggle('hidden', this.presetInputElem.value !== 'custom');
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
