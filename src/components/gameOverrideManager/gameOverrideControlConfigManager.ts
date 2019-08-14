import gameOverrideControlConfigManagerTemplate from './gameOverrideControlConfigManager.html';
import {IGameControlConfiguration}              from '../../types/game';
import GameOverrideControlSetManager            from './gameOverrideControlSetManager';
import GameOverrideControlManager               from './gameOverrideControlManager';
import createDefaultGameButtons                 from './createDefaultGameButtons';
import ValidationError                          from './validationError';
import {EventEmitter}                           from 'events';
import {
  htmlToBlock,
  selectR,
  firstChildR
} from '../../helpers/htmlUtil';
import {
  CabinetType,
  cabinetTypeEnum
} from '../../types/common';


export default class GameOverrideControlConfigManager extends EventEmitter {
  public readonly elem: HTMLElement;
  
  private readonly gameOverrideControlSetManagers: GameOverrideControlSetManager[];
  
  private readonly removeButtonElem           : HTMLElement;
  private readonly targetCabinetTypeSelectElem: HTMLSelectElement;
  //private readonly menuButtonCountInputElem   : HTMLInputElement;
  private readonly controlSetContainerElem    : HTMLElement;
  private readonly addControlSetButtonElem    : HTMLElement;
  
  
  public constructor(options: {
    targetCabinetType?: CabinetType;
    numMenuButtons?   : number;
    gameOverrideControlSetManagers?: GameOverrideControlSetManager[];
  } = {}) {
    super();
    this.elem = firstChildR(htmlToBlock(gameOverrideControlConfigManagerTemplate));
    
    this.gameOverrideControlSetManagers = [];
    
    this.removeButtonElem            = selectR(this.elem, '.game-override-control-config-manager__remove-button');
    this.targetCabinetTypeSelectElem = selectR(this.elem, '.game-override-control-config-manager__target-cabinet-type-select', 'select');
    //this.menuButtonCountInputElem    = selectR(this.elem, '.game-override-control-config-manager__menu-button-count-input', 'input');
    this.controlSetContainerElem     = selectR(this.elem, '.game-override-control-config-manager__control-set-container');
    this.addControlSetButtonElem     = selectR(this.elem, '.game-override-control-config-manager__add-control-set-button');
    
    this.addControlSetButtonElem.addEventListener('click', () => {
      let newManager: GameOverrideControlSetManager;
      if (this.gameOverrideControlSetManagers.length > 0) {
        const lastManager = this.gameOverrideControlSetManagers[this.gameOverrideControlSetManagers.length - 1];
        const lastGameControlSet = lastManager.createGameControlSet([]);
        
        newManager = new GameOverrideControlSetManager({
          supportedPlayerNums: undefined,
          isRequired         : false,
          numCPButtons       : lastGameControlSet.controlPanelButtons.length,
          gameOverrideControlManagers: lastGameControlSet.controls.map(control =>
            GameOverrideControlManager.createFromGameControl(control)
          )
        });
      }
      else {
        newManager = new GameOverrideControlSetManager();
      }
      
      this.addGameOverrideControlSetManager(newManager);
    });
    
    this.removeButtonElem.addEventListener('click', () => {
      this.remove();
    });
    
    if (options.targetCabinetType !== undefined) this.targetCabinetTypeSelectElem.value = options.targetCabinetType.val;
  //if (options.numMenuButtons    !== undefined) this.menuButtonCountInputElem   .value = options.numMenuButtons.toString();
    if (options.gameOverrideControlSetManagers) {
      for (const manager of options.gameOverrideControlSetManagers) {
        this.addGameOverrideControlSetManager(manager);
      }
    }
    else {
      this.addGameOverrideControlSetManager(new GameOverrideControlSetManager());
    }
  }
  
  public static createFromGameControlConfig(gameControlConfig: IGameControlConfiguration): GameOverrideControlConfigManager {
    return new GameOverrideControlConfigManager({
      targetCabinetType: gameControlConfig.targetCabinetType,
      numMenuButtons   : gameControlConfig.menuButtons.length,
      gameOverrideControlSetManagers: gameControlConfig.controlSets.map(controlSet =>
        GameOverrideControlSetManager.createFromGameControlSet(controlSet)
      )
    });
  }
  
  public addGameOverrideControlSetManager(gameOverrideControlSetManager: GameOverrideControlSetManager): void {
    gameOverrideControlSetManager.addListener('remove', () => {
      this.removeGameOverrideControlSetManager(gameOverrideControlSetManager);
    });
    
    this.controlSetContainerElem.appendChild(gameOverrideControlSetManager.elem);
    this.gameOverrideControlSetManagers.push(gameOverrideControlSetManager);
  }
  
  public removeGameOverrideControlSetManager(gameOverrideControlSetManager: GameOverrideControlSetManager): void {
    const index = this.gameOverrideControlSetManagers.indexOf(gameOverrideControlSetManager);
    if (index === -1) return;
    
    gameOverrideControlSetManager.elem.remove();
    this.gameOverrideControlSetManagers.splice(index, 1);
  }
  
  public createGameControlConfig(alternatesTurns: boolean, numPlayers: number): IGameControlConfiguration {
    const targetCabinetType = cabinetTypeEnum.get(this.targetCabinetTypeSelectElem.value);
    if (!targetCabinetType) {
      this.targetCabinetTypeSelectElem.setCustomValidity('Invalid value.');
      throw new ValidationError(`Invalid targetCabinetTypeSelectElem.`);
    }
    
    /*
    const numMenuButtons = parseInt(this.menuButtonCountInputElem.value, 10);
    if (isNaN(numMenuButtons)) {
      throw new ValidationError(`Invalid menuButtonCountInputElem.`);
    }
    */
   const numMenuButtons = 0;
    
    return {
      targetCabinetType,
      controlSets: this.gameOverrideControlSetManagers.map((x, i) => x.createGameControlSet(
        alternatesTurns
        ? Array.from({length: numPlayers}).map((x, i) => i + 1) // creates [1, 2, ...]
        : [i + 1] 
      )),
      menuButtons: createDefaultGameButtons(numMenuButtons)
    };
  }
  
  private remove(): void {
    this.emit('remove');
  }
}