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

export interface IMachineNameListState {
  readonly inputStr: string;
}


export default class MachineNameList {
  public readonly elem: HTMLElement;
  
  private readonly inputElem       : HTMLTextAreaElement;
  private readonly demoListLinkElem: HTMLElement;
  
  
  public constructor() {
    this.elem = firstChildR(htmlToBlock(machineNameListTemplate));
    this.inputElem        = selectR(this.elem, '.machine-name-list__input', 'textarea');
    this.demoListLinkElem = selectR(this.elem, '.machine-name-list__demo-list-link');
    
    this.demoListLinkElem.addEventListener('click', e => {
      e.preventDefault();
      this.inputElem.value = this.getDefaultMachineNameInputsStr();
    });
  }
  
  public async init():Promise<void> {
    const state = this.loadState();
    this.inputElem.value = state? state.inputStr : this.getDefaultMachineNameInputsStr();
  }
  
  public getMachineNameInputs(): string[] {
    // parse input into machine names
    return this.parseInput(this.inputElem.value);
  }

  private parseInput(machineNameListInput: string): string[] {
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
  
  private getDefaultMachineNameInputsStr(): string {
    return defaultMachineNameInputs.join('\n');
  }
  
  private getStateKey(): string {
    return 'machineNameList';
  }
  
  public saveState() {
    const state:IMachineNameListState = {
      inputStr: this.inputElem.value
    };
    
    const sState = serializeState(state);
    stateUtil.set(this.getStateKey(), sState);
  }
  
  private loadState():IMachineNameListState|undefined {
    const sState = stateUtil.depricate(
      this.getStateKey(),
      'machineNameListInput' // depricated keys
    );
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

