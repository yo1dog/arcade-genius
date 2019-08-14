import gameOverrideControlSetManagerTemplate from './gameOverrideControlSetManager.html';
import * as controlDefUtil                   from '../../controlDefUtil';
import ControlTypeSelector                   from '../controlTypeSelector/controlTypeSelector';
import GameOverrideControlManager            from './gameOverrideControlManager';
import ValidationError                       from './validationError';
import createDefaultGameButtons              from './createDefaultGameButtons';
import {EventEmitter}                        from 'events';
import {
  htmlToBlock,
  selectR,
  firstChildR
} from '../../helpers/htmlUtil';
import {
  IGameControlSet,
} from '../../types/game';
import { controlTypeEnum } from '../../types/controlDef';


export default class GameOverrideControlSetManager extends EventEmitter {
  public readonly elem: HTMLElement;
  
  private readonly gameOverrideControlManagers: GameOverrideControlManager[];
  
  private readonly removeButtonElem                : HTMLElement;
  private readonly supportedPlayerNumsInputElem    : HTMLInputElement;
  private readonly isRequiredCheckboxElem          : HTMLInputElement;
  private readonly controlPanelButtonCountInputElem: HTMLInputElement;
  private readonly controlContainerElem            : HTMLElement;
  private readonly addControlButtonElem            : HTMLElement;
  
  private readonly controlTypeSelector: ControlTypeSelector;
  
  
  public constructor(options: {
    supportedPlayerNums?: number[];
    isRequired?         : boolean;
    numCPButtons?       : number;
    gameOverrideControlManagers?: GameOverrideControlManager[];
  } = {}) {
    super();
    this.elem = firstChildR(htmlToBlock(gameOverrideControlSetManagerTemplate));
    
    this.gameOverrideControlManagers = [];
    
    this.removeButtonElem                 = selectR(this.elem, '.game-override-control-set-manager__remove-button');
    this.supportedPlayerNumsInputElem     = selectR(this.elem, '.game-override-control-set-manager__supported-player-nums-input', 'input');
    this.isRequiredCheckboxElem           = selectR(this.elem, '.game-override-control-set-manager__is-required-checkbox', 'input');
    this.controlPanelButtonCountInputElem = selectR(this.elem, '.game-override-control-set-manager__control-panel-button-count-input', 'input');
    this.controlContainerElem             = selectR(this.elem, '.game-override-control-set-manager__control-container');
    this.addControlButtonElem             = selectR(this.elem, '.game-override-control-set-manager__add-control-button');
    
    this.controlTypeSelector = new ControlTypeSelector(
      selectR(this.elem, '.game-override-control-set-manager__control-type-select', 'select'),
      selectR(this.elem, '.game-override-control-set-manager__control-type-description')
    );
    this.controlTypeSelector.populateSelect();
    
    this.removeButtonElem.addEventListener('click', () => {
      this.remove();
    });
    
    this.addControlButtonElem.addEventListener('click', () => {
      const controlDef = this.controlTypeSelector.getControlDef();
      if (!controlDef) return;
      
      this.addGameOverrideControlManager(new GameOverrideControlManager({controlDef}));
    });
    
  //if (options.supportedPlayerNums !== undefined) this.updateSupportedPlayerNums(options.supportedPlayerNums);
    if (options.isRequired          !== undefined) this.isRequiredCheckboxElem          .checked = options.isRequired;
    if (options.numCPButtons        !== undefined) this.controlPanelButtonCountInputElem.value   = options.numCPButtons.toString();
    if (options.gameOverrideControlManagers) {
      for (const manager of options.gameOverrideControlManagers) {
        this.addGameOverrideControlManager(manager);
      }
    }
    else {
      this.addGameOverrideControlManager(new GameOverrideControlManager({
        controlDef: controlDefUtil.getByType(controlTypeEnum.JOY_8WAY)
      }));
    }
  }
  
  public static createFromGameControlSet(gameControlSet: IGameControlSet): GameOverrideControlSetManager {
    return new GameOverrideControlSetManager({
      supportedPlayerNums: gameControlSet.supportedPlayerNums,
      isRequired         : gameControlSet.isRequired,
      numCPButtons       : gameControlSet.controlPanelButtons.length,
      gameOverrideControlManagers: gameControlSet.controls.map(gameControl =>
        GameOverrideControlManager.createFromGameControl(gameControl)
      )
    });
  }
  
  public updateSupportedPlayerNums(playerNums: number[]): void {
    this.supportedPlayerNumsInputElem.value = playerNums.join(', ');
  }
  
  public addGameOverrideControlManager(gameOverrideControlManager: GameOverrideControlManager): void {
    gameOverrideControlManager.addListener('remove', () => {
      this.removeGameOverrideControlManager(gameOverrideControlManager);
    });
    
    this.controlContainerElem.appendChild(gameOverrideControlManager.elem);
    this.gameOverrideControlManagers.push(gameOverrideControlManager);
  }
  
  public removeGameOverrideControlManager(gameOverrideControlManager: GameOverrideControlManager): void {
    const index = this.gameOverrideControlManagers.indexOf(gameOverrideControlManager);
    if (index === -1) return;
    
    gameOverrideControlManager.elem.remove();
    this.gameOverrideControlManagers.splice(index, 1);
  }
  
  public createGameControlSet(supportedPlayerNums: number[]): IGameControlSet {
    const numCPButtons = parseInt(this.controlPanelButtonCountInputElem.value, 10);
    if (isNaN(numCPButtons)) {
      throw new ValidationError(`Invalid controlPanelButtonCountInputElem.`);
    }
    
    return {
      supportedPlayerNums,
      isRequired            : this.isRequiredCheckboxElem.checked,
      isOnOppositeScreenSide: false,
      controls              : this.gameOverrideControlManagers.map(x => x.createGameControl()),
      controlPanelButtons   : createDefaultGameButtons(numCPButtons)
    };
  }
  
  private remove(): void {
    this.emit('remove');
  }
}