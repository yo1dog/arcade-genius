import './machineNameList.less';
import machineNameListTemplate from './machineNameList.html';
import htmlToBlock from '../../helpers/htmlToBlock';
import defaultMachineNameInputs from './defaultMachineNameInputs.json';


export default class MachineNameList {
  constructor() {
    this.elem = htmlToBlock(machineNameListTemplate).firstElementChild;
    this.inputElem = this.elem.querySelector('.machine-name-list__input');
    this.demoListLinkElem = this.elem.querySelector('.machine-name-list__demo-list-link');
    
    this.demoListLinkElem.addEventListener('click', e => {
      e.preventDefault();
      this.inputElem.value = getDefaultMachineNameInputsStr();
    });
  }
  
  init() {
    this.inputElem.value = this.loadState() || getDefaultMachineNameInputsStr();
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
  
  saveState() {
    window.localStorage.setItem('machineNameListInput', this.inputElem.value);
  }
  
  /**
   * @returns {string}
   */
  loadState() {
    return window.localStorage.getItem('machineNameListInput') || '';
  }
}

function getDefaultMachineNameInputsStr() {
  return defaultMachineNameInputs.join('\n');
}