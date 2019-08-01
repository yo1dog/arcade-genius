import './machineNameList.less';
import machineNameListTemplate  from './machineNameList.html';
import defaultMachineNameInputs from './defaultMachineNameInputs.json';
import * as stateUtil           from '../../dataAccess/stateUtil';
import {
  serializeState,
  deserializeState
} from './machineNameListSerializer';
import {
  htmlToBlock,
  selectR,
  firstChildR
} from '../../helpers/htmlUtil';

/**
 * @typedef {{
 *   readonly inputStr: string
 * }} IMachineNameListState
 */



export default class MachineNameList {
  constructor() {
    this.elem = firstChildR(htmlToBlock(machineNameListTemplate));
    this.inputElem        = selectR(this.elem, '.machine-name-list__input', 'textarea');
    this.demoListLinkElem = selectR(this.elem, '.machine-name-list__demo-list-link');
    
    this.demoListLinkElem.addEventListener('click', e => {
      e.preventDefault();
      this.inputElem.value = this.getDefaultMachineNameInputsStr();
    });
  }
  
  async init() {
    const state = this.loadState();
    
    this.inputElem.value = state? state.inputStr : this.getDefaultMachineNameInputsStr();
    return Promise.resolve();
  }
  
  /**
   * @returns {string[]}
   */
  getMachineNameInputs() {
    // parse input into machine names
    return this.parseInput(this.inputElem.value);
  }

  /**
   * @param {string} machineNameListInput 
   * @returns {string[]}
   */
  parseInput(machineNameListInput) {
    return (
      machineNameListInput
      .replace(/(\/\/|#).*$/gm, '')          // remove comments (//... or #...)
      .replace(/\/\*+[\s\S]*?(\*\/|$)/g, '') // remove block comments (/*...*/)
      .replace(/,/g, '\n')                   // replace commas with newlines
      .split('\n')                           // split by lines
      .map(str => str.trim())                // trim lines
      .filter(str => str.length > 0)         // remove empty lines
      .filter((str, i, strs) =>              // remove duplicates
        strs.indexOf(str) === i
      )
    );
  }
  
  getDefaultMachineNameInputsStr() {
    return defaultMachineNameInputs.join('\n');
  }
  
  getStateKey() {
    return 'machineNameListInput';
  }
  
  saveState() {
    /** @type {IMachineNameListState} */
    const state = {
      inputStr: this.inputElem.value
    };
    
    const sState = serializeState(state);
    stateUtil.set(this.getStateKey(), sState);
  }
  
  /**
   * @returns {IMachineNameListState | undefined}
   */
  loadState() {
    const sState = stateUtil.get(this.getStateKey());
    if (!sState) return;
    
    try {
      return deserializeState(sState, 'sMachineNameListState');
    }
    catch (err) {
      console.error(`Error deserializing Machine Name List state:`);
      console.error(err);
    }
  }
}

