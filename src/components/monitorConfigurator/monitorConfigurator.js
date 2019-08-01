import './monitorConfigurator.less';
import monitorConfiguratorTemplate from './monitorConfigurator.html';
import * as stateUtil              from '../../dataAccess/stateUtil';
import {
  serializeState,
  deserializeState
} from './monitorConfiguratorSerializer';
import {
  htmlToBlock,
  selectR,
  firstChildR
} from '../../helpers/htmlUtil';
import {
  IModelineConfig
} from '../../types/modeline';
import {
  orientationEnum
} from '../../types/commonEnums';

/**
 * @typedef {{
 *   readonly modelineConfig: IModelineConfig;
 * }} IMonitorConfiguratorState
 */


export default class MonitorConfigurator {
  /** @param {string} id */
  constructor(id) {
    this.id = id;
    this.elem = firstChildR(htmlToBlock(monitorConfiguratorTemplate));
    this.presetInputElem             = selectR(this.elem, '.monitor-configurator__preset-input', 'select');
    this.orientationInputElem        = selectR(this.elem, '.monitor-configurator__orientation-input', 'select');
    this.rangesRowElem               = selectR(this.elem, '.monitor-configurator__ranges-row');
    this.rangesInputElem             = selectR(this.elem, '.monitor-configurator__ranges-input', 'textarea');
    this.allowInterlacedCheckboxElem = selectR(this.elem, '.monitor-configurator__allow-interlaced-checkbox', 'input');
    this.allowDoublescanCheckboxElem = selectR(this.elem, '.monitor-configurator__allow-doublescan-checkbox', 'input');
    
    this.presetInputElem.addEventListener('change', () => {
      this.updateRangesVisibility();
    });
  }
  
  async init() {
    const state = this.loadState();
    if (state) {
      const {modelineConfig} = state;
      
      this.presetInputElem            .value   = modelineConfig.preset;
      this.orientationInputElem       .value   = modelineConfig.orientation.val;
      this.rangesInputElem            .value   = modelineConfig.ranges.join('\n');
      this.allowInterlacedCheckboxElem.checked = modelineConfig.allowInterlaced;
      this.allowDoublescanCheckboxElem.checked = modelineConfig.allowDoublescan;
    }
    this.updateRangesVisibility();
    return Promise.resolve();
  }
  
  /** @returns {IModelineConfig} */
  getModelineConfig() {
    const presetInput = this.presetInputElem.value;
    const preset = presetInput;
    
    const orientationInput = this.orientationInputElem.value;
    const orientation = orientationEnum.get(orientationInput);
    if (!orientation) throw new Error(`Invalid orientation: '${orientationInput}'`);
    
    const ranges = presetInput !== 'custom'? [] : (
      this.rangesInputElem.value
      .split('\n')
      .map(line => line.trim())
      .filter(line => line.length > 0)
    );
    const allowInterlaced = this.allowInterlacedCheckboxElem.checked;
    const allowDoublescan = this.allowDoublescanCheckboxElem.checked;
    
    /** @type {IModelineConfig} */
    const modelineConfig = {
      preset,
      orientation,
      ranges,
      allowInterlaced,
      allowDoublescan
    };
    return modelineConfig;
  }
  
  updateRangesVisibility() {
    this.rangesRowElem.classList.toggle('hidden', this.presetInputElem.value !== 'custom');
  }
  
  getStateKey() {
    return `monitorConfiguratorModelineConfig-${this.id}`;
  }
  
  saveState() {
    /** @type {IMonitorConfiguratorState} */
    const state = {
      modelineConfig: this.getModelineConfig()
    };
    
    const sState = serializeState(state);
    stateUtil.set(this.getStateKey(), sState);
  }
  
  /**
   * @returns {IMonitorConfiguratorState | undefined}
   */
  loadState() {
    const sState = stateUtil.get(this.getStateKey());
    if (!sState) return;
    
    try {
      return deserializeState(sState, 'sMonitorConfiguratorState');
    }
    catch (err) {
      console.error(`Error deserializing Monitor Configurator '${this.id}' state:`);
      console.error(err);
    }
  }
  
  clearState() {
    stateUtil.remove(this.getStateKey());
  }
}
