import './gameOverrideManager.less';
import gameOverrideManagerTemplate from './gameOverrideManager.html';
import * as controlDefUtil         from '../../controlDefUtil';
import * as stateUtil              from '../../stateUtil';
import * as gameUtil               from '../../gameUtil';
import {IGame}                     from '../../types/game';
import GameOverrideGameManager     from './gameOverrideGameManager';
import ValidationError             from './validationError';
import {
  serializeState,
  deserializeState
} from './gameOverrideManagerSerializer';
import {
  htmlToBlock,
  selectR,
  firstChildR
} from '../../helpers/htmlUtil';

export interface IGameOverrideManagerState {
}


export default class GameOverrideManager {
  public readonly elem: HTMLElement;
  
  private readonly gameOverrideGameManagers: GameOverrideGameManager[];
  
  private readonly formElem                 : HTMLFormElement;
  private readonly gameContainerElem        : HTMLElement;
  private readonly newButtonElem            : HTMLElement;
  private readonly overrideGameNameInputElem: HTMLInputElement;
  private readonly overrideButtonElem       : HTMLElement;
  private readonly overrideErrorMessageElem : HTMLElement;
  
  
  public constructor() {
    this.elem = firstChildR(htmlToBlock(gameOverrideManagerTemplate));
    
    this.gameOverrideGameManagers = [];
    
    this.formElem                  = selectR(this.elem, '.game-override-manager__form', 'form');
    this.gameContainerElem         = selectR(this.elem, '.game-override-manager__game-container');
    this.newButtonElem             = selectR(this.elem, '.game-override-manager__new-button');
    this.overrideGameNameInputElem = selectR(this.elem, '.game-override-manager__override-game-name-input', 'input');
    this.overrideButtonElem        = selectR(this.elem, '.game-override-manager__override-button');
    this.overrideErrorMessageElem  = selectR(this.elem, '.game-override-manager__override-error-message');
    
    this.newButtonElem.addEventListener('click', () => {
      this.addGameOverrideGameManager(new GameOverrideGameManager());
    });
    
    this.overrideButtonElem.addEventListener('click', () => {
      this.processNewGameOverride();
    });
  }
  
  public async init(): Promise<void> {
    await controlDefUtil.init();
    
    /*
    const state = this.loadState();
    if (state) {
    }
    */
  }
  
  public addGameOverrideGameManager(gameOverrideGameManager: GameOverrideGameManager): void {
    gameOverrideGameManager.addListener('remove', () => {
      this.removeGameOverrideGameManager(gameOverrideGameManager);
    });
    
    this.gameContainerElem.appendChild(gameOverrideGameManager.elem);
    this.gameOverrideGameManagers.push(gameOverrideGameManager);
  }
  
  public removeGameOverrideGameManager(gameOverrideGameManager: GameOverrideGameManager): void {
    const index = this.gameOverrideGameManagers.indexOf(gameOverrideGameManager);
    if (index === -1) return;
    
    gameOverrideGameManager.elem.remove();
    this.gameOverrideGameManagers.splice(index, 1);
  }
  
  public getGameOverrides(): IGame[] | undefined {
    try {
      return this.gameOverrideGameManagers.map(x => x.createGame());
    } catch(err) {
      if (err instanceof ValidationError) {
        console.error(`Game Override Manager validation error:`);
        console.error(err);
        this.formElem.reportValidity();
      }
      else {
        throw err;
      }
    }
  }
  
  private processNewGameOverride() {
    const gameNameInput = this.overrideGameNameInputElem.value;
    const game = gameUtil.getGameByName(gameNameInput.trim().toLowerCase());
    
    if (game) {
      this.overrideErrorMessageElem.classList.add('hidden');
      this.addGameOverrideGameManager(GameOverrideGameManager.createFromGame(game));
      return;
    }
    
    const gameSuggestions = gameUtil.getGameSuggestions(gameNameInput, 10);
    
    this.overrideErrorMessageElem.classList.remove('hidden');
    this.overrideErrorMessageElem.innerText = `ROM "${gameNameInput}" not found. Did you mean one of these?`;
    
    const listElem = document.createElement('ul');
    this.overrideErrorMessageElem.appendChild(listElem);
    
    for (const gameSuggestion of gameSuggestions) {
      const listItemElem = document.createElement('li');
      listItemElem.innerText = gameSuggestion.game.name;
      listElem.appendChild(listItemElem);
    }
  }
  
  private getStateKey(): string {
    return 'gameOverrideManager';
  }
  
  public saveState(): void {
    const state: IGameOverrideManagerState = {
    };
    
    const sState = serializeState(state);
    stateUtil.set(this.getStateKey(), sState);
  }
  
  private loadState(): IGameOverrideManagerState | undefined {
    const sState = stateUtil.get(this.getStateKey());
    if (!sState) return;
    
    try {
      return deserializeState(sState, 'sGameOverrideManager');
    }
    catch (err) {
      console.error(`Error deserializing Game Override Manager state:`);
      console.error(err);
    }
  }
}
