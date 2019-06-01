import './machineNameList.less';
import machineNameListTemplate from './machineNameList.html';
import htmlToBlock from '../../helpers/htmlToBlock';
import {EventEmitter} from 'events';


export default class MachineNameList extends EventEmitter {
  constructor() {
    super();
    /** @type {string[]} */
    this.machineNameInputs = [];
    
    this.block = htmlToBlock(machineNameListTemplate);
    this.inputElem         = this.block.getElementById('machine-name-list__input');
    this.refreshButtonElem = this.block.getElementById('machine-name-list__refresh');
    
    this.refreshButtonElem.addEventListener('click', () => this.refresh());
  }
  
  init() {
    this.inputElem.value = this.loadInput();
    this.refresh();
  }
  
  refresh() {
    this.machineNameInputs = this.getMachineNameInputs();
    this.saveInput();
    this.emit('refreshed');
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
      .replace(/,/g, '\n')           // replace commas with newlines
      .split('\n')                   // split by lines
      .map(str => str.trim())        // trim lines
      .filter(str => str.length > 0) // remove empty lines
      .filter((str, i, strs) =>      // remove duplicates
        strs.indexOf(str) === i
      )
    );
  }
  
  saveInput() {
    window.localStorage.setItem('machineNameListInput', this.inputElem.value);
  }
  
  /**
   * @returns {string}
   */
  loadInput() {
    return window.localStorage.getItem('machineNameListInput') || '';
  }
}
