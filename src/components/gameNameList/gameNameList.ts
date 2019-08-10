import './gameNameList.less';
import gameNameListTemplate  from './gameNameList.html';
import defaultGameNameInputs from './defaultGameNameInputs.json';
import * as stateUtil        from '../../stateUtil';
import {
  serializeState,
  deserializeState
} from './gameNameListSerializer';
import {
  htmlToBlock,
  selectR,
  firstChildR
} from '../../helpers/htmlUtil';

export interface IGameNameListState {
  readonly inputStr: string;
}


export default class GameNameList {
  public readonly elem: HTMLElement;
  
  private readonly inputElem       : HTMLTextAreaElement;
  private readonly demoListLinkElem: HTMLElement;
  
  
  public constructor() {
    this.elem = firstChildR(htmlToBlock(gameNameListTemplate));
    this.inputElem        = selectR(this.elem, '.game-name-list__input', 'textarea');
    this.demoListLinkElem = selectR(this.elem, '.game-name-list__demo-list-link');
    
    this.demoListLinkElem.addEventListener('click', e => {
      e.preventDefault();
      this.inputElem.value = this.getDefaultGameNameInputsStr();
    });
  }
  
  public async init():Promise<void> {
    const state = this.loadState();
    this.inputElem.value = state? state.inputStr : this.getDefaultGameNameInputsStr();
  }
  
  public getGameNameInputs(): string[] {
    // parse input into game names
    return this.parseInput(this.inputElem.value);
  }

  private parseInput(gameNameListInput: string): string[] {
    return (
      gameNameListInput
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
  
  private getDefaultGameNameInputsStr(): string {
    return defaultGameNameInputs.join('\n');
  }
  
  private getStateKey(): string {
    return 'gameNameList';
  }
  
  public saveState() {
    const state:IGameNameListState = {
      inputStr: this.inputElem.value
    };
    
    const sState = serializeState(state);
    stateUtil.set(this.getStateKey(), sState);
  }
  
  private loadState():IGameNameListState|undefined {
    const sState = stateUtil.depricate(
      this.getStateKey(),
      'gameNameList',
      'gameNameListInput' // depricated keys
    );
    if (!sState) return;
    
    try {
      return deserializeState(sState, 'sGameNameListState');
    }
    catch (err) {
      console.error(`Error deserializing Game Name List state:`);
      console.error(err);
    }
  }
}

