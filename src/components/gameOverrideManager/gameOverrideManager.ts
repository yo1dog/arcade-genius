import './gameOverrideManager.less';
import gameOverrideManagerTemplate              from './gameOverrideManager.html';
import gameOverrideGameManagerTemplate          from './gameOverrideGameManager.html';
import gameOverrideControlConfigManagerTemplate from './gameOverrideControlConfigManager.html';
import gameOverrideControlSetManagerTemplate    from './gameOverrideControlSetManager.html';
import gameOverrideControlManagerTemplate       from './gameOverrideControlManager.html';
import ControlTypeSelector                      from '../controlTypeSelector/controlTypeSelector';
import * as controlDefUtil                      from '../../controlDefUtil';
import * as stateUtil                           from '../../stateUtil';
import shortenDescription                       from '../../helpers/shortenDescription';
import {EventEmitter}                           from 'events';
import {
  serializeState,
  deserializeState
} from './gameOverrideManagerSerializer';
import {
  htmlToBlock,
  selectR,
  firstChildR
} from '../../helpers/htmlUtil';
import {
  IGame,
  IGameDisplay,
  IGameControlInfo,
  IGameControlConfiguration,
  IGameControlSet,
  IGameControl,
  IGameButton,
  IGameInput
} from '../../types/game';
import {
  IControlDef, controlTypeEnum
} from '../../types/controlDef';
import {
  cabinetTypeEnum,
  displayTypeEnum,
  displayRotationEnum
} from '../../types/common';

export interface IGameOverrideManagerState {
}


export default class GameOverrideManager {
  public readonly elem: HTMLElement;
  
  private readonly gameOverrideGameManagers: GameOverrideGameManager[];
  
  private readonly formElem                 : HTMLFormElement;
  private readonly gameContainerElem        : HTMLElement;
  private readonly newButtonElem            : HTMLElement;
  //private readonly overrideGameNameInputElem: HTMLInputElement;
  //private readonly overrideButtonElem       : HTMLElement;
  //private readonly overrideErrorMessageElem : HTMLElement;
  
  
  public constructor() {
    this.elem = firstChildR(htmlToBlock(gameOverrideManagerTemplate));
    
    this.gameOverrideGameManagers = [];
    
    this.formElem                  = selectR(this.elem, '.game-override-manager__form', 'form');
    this.gameContainerElem         = selectR(this.elem, '.game-override-manager__game-container');
    this.newButtonElem             = selectR(this.elem, '.game-override-manager__new-button');
    //this.overrideGameNameInputElem = selectR(this.elem, '.game-override-manager__override-game-name-input', 'input');
    //this.overrideButtonElem        = selectR(this.elem, '.game-override-manager__override-button');
    //this.overrideErrorMessageElem  = selectR(this.elem, '.game-override-manager__override-error-message');
    
    this.newButtonElem.addEventListener('click', () => {
      this.addGameOverrideGameManager();
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
  
  public addGameOverrideGameManager(): void {
    const gameOverrideGameManager = new GameOverrideGameManager();
    
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
      return this.gameOverrideGameManagers.map(x => x.getGame());
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

class GameOverrideGameManager extends EventEmitter {
  public readonly elem: HTMLElement;
  
  private readonly gameOverrideControlConfigManagers: GameOverrideControlConfigManager[];
  
  private readonly removeButtonElem           : HTMLElement;
  private readonly nameInputElem              : HTMLInputElement;
  private readonly descriptionInputElem       : HTMLInputElement;
  private readonly shortDescriptionInputElem  : HTMLInputElement;
  //private readonly cloneOfInputElem           : HTMLInputElement;
  private readonly displayTypeSelectElem      : HTMLSelectElement;
  private readonly displayRotationSelectElem  : HTMLSelectElement;
  private readonly displayFlipXCheckboxElem   : HTMLInputElement;
  private readonly displayRefreshInputElem    : HTMLInputElement;
  private readonly displayResolutionInputElem : HTMLInputElement;
  private readonly alternatesTurnsCheckboxElem: HTMLInputElement;
  private readonly numPlayersRowElem          : HTMLElement;
  private readonly numPlayersInputElem        : HTMLInputElement;
  private readonly controlConfigContainerElem : HTMLElement;
  private readonly addControlConfigButtonElem : HTMLElement;
  
  private readonly resolutionRegexStr = '^\\s*(([1-9]\\d*)\\s*[xX,]\\s*([1-9]\\d*)\\s*)?$';
  
  
  public constructor() {
    super();
    this.elem = firstChildR(htmlToBlock(gameOverrideGameManagerTemplate));
    
    this.gameOverrideControlConfigManagers = [];
    
    this.removeButtonElem            = selectR(this.elem, '.game-override-game-manager__remove-button');
    this.nameInputElem               = selectR(this.elem, '.game-override-game-manager__name-input', 'input');
    this.descriptionInputElem        = selectR(this.elem, '.game-override-game-manager__description-input', 'input');
    this.shortDescriptionInputElem   = selectR(this.elem, '.game-override-game-manager__short-description-input', 'input');
    //this.cloneOfInputElem            = selectR(this.elem, '.game-override-game-manager__clone-of-input', 'input');
    this.displayTypeSelectElem       = selectR(this.elem, '.game-override-game-manager__display-type-select', 'select');
    this.displayRotationSelectElem   = selectR(this.elem, '.game-override-game-manager__display-rotation-select', 'select');
    this.displayFlipXCheckboxElem    = selectR(this.elem, '.game-override-game-manager__display-flipx-checkbox', 'input');
    this.displayRefreshInputElem     = selectR(this.elem, '.game-override-game-manager__display-refresh-input', 'input');
    this.displayResolutionInputElem  = selectR(this.elem, '.game-override-game-manager__display-resolution-input', 'input');
    this.alternatesTurnsCheckboxElem = selectR(this.elem, '.game-override-game-manager__alternates-turns-checkbox', 'input');
    this.numPlayersRowElem           = selectR(this.elem, '.game-override-game-manager__num-players-row');
    this.numPlayersInputElem         = selectR(this.elem, '.game-override-game-manager__num-players-input', 'input');
    this.controlConfigContainerElem  = selectR(this.elem, '.game-override-game-manager__control-config-container');
    this.addControlConfigButtonElem  = selectR(this.elem, '.game-override-game-manager__add-control-config-button');
    
    this.displayResolutionInputElem.pattern = this.resolutionRegexStr;
    
    this.descriptionInputElem.addEventListener('change', () => {
      this.updateShortDescriptionElem();
    });
    this.updateShortDescriptionElem();
    
    this.alternatesTurnsCheckboxElem.addEventListener('change', () => {
      this.updateNumPlayersRowElem();
    });
    this.updateNumPlayersRowElem();
    
    this.addControlConfigButtonElem.addEventListener('click', () => {
      this.addGameOverrideControlConfigManager();
    });
    
    this.removeButtonElem.addEventListener('click', () => {
      this.remove();
    });
    
    this.addGameOverrideControlConfigManager();
  }
  
  public addGameOverrideControlConfigManager(): void {
    const gameOverrideControlConfigManager = new GameOverrideControlConfigManager();
    
    gameOverrideControlConfigManager.addListener('remove', () => {
      this.removeGameOverrideControlConfigManager(gameOverrideControlConfigManager);
    });
    
    this.controlConfigContainerElem.appendChild(gameOverrideControlConfigManager.elem);
    this.gameOverrideControlConfigManagers.push(gameOverrideControlConfigManager);
  }
  
  public removeGameOverrideControlConfigManager(gameOverrideControlConfigManager: GameOverrideControlConfigManager): void {
    const index = this.gameOverrideControlConfigManagers.indexOf(gameOverrideControlConfigManager);
    if (index === -1) return;
    
    gameOverrideControlConfigManager.elem.remove();
    this.gameOverrideControlConfigManagers.splice(index, 1);
  }
  
  public getGame(): IGame {
    const displayType = displayTypeEnum.get(this.displayTypeSelectElem.value);
    if (!displayType) {
      this.displayTypeSelectElem.setCustomValidity('Invalid value.');
      throw new ValidationError(`Invalid displayTypeSelectElem.`);
    }
    
    const displayRotation = displayRotationEnum.get(parseInt(this.displayRotationSelectElem.value, 10));
    if (!displayRotation) {
      this.displayRotationSelectElem.setCustomValidity('Invalid value.');
      throw new ValidationError(`Invalid displayRotationSelectElem.`);
    }
    
    const refresh = parseInt(this.displayRefreshInputElem.value, 10);
    if (isNaN(refresh)) {
      throw new ValidationError(`Invalid displayRefreshInputElem.`);
    }
    
    const match = new RegExp(this.resolutionRegexStr).exec(this.displayResolutionInputElem.value);
    
    const display: IGameDisplay = {
      type    : displayType,
      rotation: displayRotation,
      flipx   : this.displayFlipXCheckboxElem.checked,
      refresh,
      width : (match && parseInt(match[2], 10)) || undefined,
      height: (match && parseInt(match[3], 10)) || undefined
    };
    
    const alternatesTurns = this.alternatesTurnsCheckboxElem.checked;
    const numPlayers = (
      alternatesTurns
      ? parseInt(this.numPlayersInputElem.value, 10)
      : this.gameOverrideControlConfigManagers.length
    );
    
    const controlInfo: IGameControlInfo = {
      numPlayers,
      alternatesTurns,
      controlConfigs: this.gameOverrideControlConfigManagers.map(x =>
        x.getGameControlConfig(alternatesTurns, numPlayers)
      )
    };
    
    return {
      name            : this.nameInputElem.value,
      description     : this.descriptionInputElem.value,
      shortDescription: undefined,
      cloneOfGame     : undefined,
      primaryDisplay  : display,
      displays        : [display],
      controlInfo
    };
  }
  
  private updateShortDescriptionElem(): void {
    this.shortDescriptionInputElem.value = shortenDescription(this.descriptionInputElem.value);
  }
  
  private updateNumPlayersRowElem(): void {
    this.numPlayersRowElem.classList.toggle('hidden', !this.alternatesTurnsCheckboxElem.checked);
  }
  
  private remove(): void {
    this.emit('remove');
  }
}

class GameOverrideControlConfigManager extends EventEmitter {
  public readonly elem: HTMLElement;
  
  private readonly gameOverrideControlSetManagers: GameOverrideControlSetManager[];
  
  private readonly removeButtonElem           : HTMLElement;
  private readonly targetCabinetTypeSelectElem: HTMLSelectElement;
  private readonly menuButtonCountInputElem   : HTMLInputElement;
  private readonly controlSetContainerElem    : HTMLElement;
  private readonly addControlSetButtonElem    : HTMLElement;
  
  
  public constructor() {
    super();
    this.elem = firstChildR(htmlToBlock(gameOverrideControlConfigManagerTemplate));
    
    this.gameOverrideControlSetManagers = [];
    
    this.removeButtonElem            = selectR(this.elem, '.game-override-control-config-manager__remove-button');
    this.targetCabinetTypeSelectElem = selectR(this.elem, '.game-override-control-config-manager__target-cabinet-type-select', 'select');
    this.menuButtonCountInputElem    = selectR(this.elem, '.game-override-control-config-manager__menu-button-count-input', 'input');
    this.controlSetContainerElem     = selectR(this.elem, '.game-override-control-config-manager__control-set-container');
    this.addControlSetButtonElem     = selectR(this.elem, '.game-override-control-config-manager__add-control-set-button');
    
    this.addControlSetButtonElem.addEventListener('click', () => {
      this.addGameOverrideControlSetManager();
    });
    
    this.removeButtonElem.addEventListener('click', () => {
      this.remove();
    });
    
    this.addGameOverrideControlSetManager();
  }
  
  public addGameOverrideControlSetManager(): void {
    const gameOverrideControlSetManager = new GameOverrideControlSetManager();
    
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
  
  public getGameControlConfig(alternatesTurns: boolean, numPlayers: number): IGameControlConfiguration {
    const targetCabinetType = cabinetTypeEnum.get(this.targetCabinetTypeSelectElem.value);
    if (!targetCabinetType) {
      this.targetCabinetTypeSelectElem.setCustomValidity('Invalid value.');
      throw new ValidationError(`Invalid targetCabinetTypeSelectElem.`);
    }
    
    const numMenuButtons = parseInt(this.menuButtonCountInputElem.value, 10);
    if (isNaN(numMenuButtons)) {
      throw new ValidationError(`Invalid menuButtonCountInputElem.`);
    }
    
    return {
      targetCabinetType,
      controlSets: this.gameOverrideControlSetManagers.map((x, i) => x.getGameControlSet(
        alternatesTurns
        ? Array.from({length: numPlayers}).map((x, i) => i + 1) // creates [1, 2, ...]
        : [i + 1] 
      )),
      menuButtons: createGameButtons(numMenuButtons),
    };
  }
  
  private remove(): void {
    this.emit('remove');
  }
}

class GameOverrideControlSetManager extends EventEmitter {
  public readonly elem: HTMLElement;
  
  private readonly gameOverrideControlManagers: GameOverrideControlManager[];
  
  private readonly removeButtonElem                : HTMLElement;
  private readonly supportedPlayerNumsInputElem    : HTMLInputElement;
  private readonly isRequiredCheckboxElem          : HTMLInputElement;
  private readonly controlPanelButtonCountInputElem: HTMLInputElement;
  private readonly controlContainerElem            : HTMLElement;
  private readonly addControlButtonElem            : HTMLElement;
  
  private readonly controlTypeSelector: ControlTypeSelector;
  
  
  public constructor() {
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
      
      this.addGameOverrideControlManager(controlDef);
    });
    
    this.addGameOverrideControlManager(controlDefUtil.getByType(controlTypeEnum.JOY_8WAY));
  }
  
  public updateSupportedPlayerNums(playerNums: number[]): void {
    this.supportedPlayerNumsInputElem.value = playerNums.join(', ');
  }
  
  public addGameOverrideControlManager(controlDef: IControlDef): void {
    const gameOverrideControlManager = new GameOverrideControlManager(controlDef);
    
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
  
  public getGameControlSet(supportedPlayerNums: number[]): IGameControlSet {
    const numCPButtons = parseInt(this.controlPanelButtonCountInputElem.value, 10);
    if (isNaN(numCPButtons)) {
      throw new ValidationError(`Invalid controlPanelButtonCountInputElem.`);
    }
    
    return {
      supportedPlayerNums,
      isRequired            : this.isRequiredCheckboxElem.checked,
      isOnOppositeScreenSide: false,
      controls              : this.gameOverrideControlManagers.map(x => x.getGameControl()),
      controlPanelButtons   : createGameButtons(numCPButtons)
    };
  }
  
  private remove(): void {
    this.emit('remove');
  }
}

class GameOverrideControlManager extends EventEmitter {
  public readonly elem: HTMLElement;
  
  private readonly controlDef: IControlDef;
  
  private readonly controlDefNameElem          : HTMLElement;
  private readonly controlButtonsDescElem      : HTMLElement;
  private readonly controlButtonsCountElem     : HTMLElement;
  private readonly controlButtonsCountInputElem: HTMLInputElement;
  private readonly removeButtonElem            : HTMLElement;
  
  public constructor(controlDef: IControlDef) {
    super();
    this.elem = firstChildR(htmlToBlock(gameOverrideControlManagerTemplate));
    
    this.controlDef = controlDef;
    
    this.controlDefNameElem           = selectR(this.elem, '.game-override-control-manager__control-def-name');
    this.controlButtonsDescElem       = selectR(this.elem, '.game-override-control-manager__control-buttons-desc');
    this.controlButtonsCountElem      = selectR(this.elem, '.game-override-control-manager__control-buttons-desc__count');
    this.controlButtonsCountInputElem = selectR(this.elem, '.game-override-control-manager__control-buttons-desc__count-input', 'input');
    this.removeButtonElem             = selectR(this.elem, '.game-override-control-manager__remove-button');
    
    const {
      defaultNumControlButtons,
      canEditNumControlButtons
    } = this.getControlButtonsDescOptions(controlDef);
    
    const numControlButtons = defaultNumControlButtons;
    
    this.controlDefNameElem.innerText = controlDef.name;
    this.controlButtonsCountElem.innerText = numControlButtons.toString();
    this.controlButtonsCountInputElem.value = numControlButtons.toString();
    
    if (numControlButtons > 0 || canEditNumControlButtons) {
      this.controlButtonsDescElem.classList.remove('hidden');
      
      if (canEditNumControlButtons) {
        this.controlButtonsCountInputElem.classList.remove('hidden');
        this.controlButtonsCountInputElem.addEventListener('change', () => {
          this.updateControlButtonsDescription(
            this.controlButtonsDescElem,
            parseInt(this.controlButtonsCountInputElem.value, 10) || 0
          );
        });
      }
      else {
        this.controlButtonsCountElem.classList.remove('hidden');
      }
    }
    
    this.updateControlButtonsDescription(this.controlButtonsDescElem, numControlButtons);
    
    this.removeButtonElem.addEventListener('click', () => {
      this.remove();
    });
  }
  
  public getGameControl(): IGameControl {
    const outputToInputMap = new Map<string, IGameInput | undefined>();
    
    for (const [key, output] of this.controlDef.outputMap) {
      const input: IGameInput = {
        isAnalog: output.isAnalog,
        label   : undefined,
        negLabel: undefined,
        posLabel: undefined
      };
      outputToInputMap.set(key, input);
    }
    
    const numButtons = parseInt(this.controlButtonsCountInputElem.value, 10);
    if (isNaN(numButtons)) {
      throw new ValidationError(`Invalid controlButtonsCountInputElem.`);
    }
    
    return {
      controlDef: this.controlDef,
      descriptor: undefined,
      outputToInputMap,
      buttons: createGameButtons(numButtons)
    };
  }
  
  private getControlButtonsDescOptions(controlDef: IControlDef): {
    defaultNumControlButtons: number;
    canEditNumControlButtons: boolean;
  } {
    switch (controlDef.type) {
      case controlTypeEnum.JOY_2WAY_VERTICAL_TRIGGER:
      case controlTypeEnum.JOY_4WAY_TRIGGER:
      case controlTypeEnum.JOY_8WAY_TRIGGER:
        return {
          defaultNumControlButtons: 1,
          canEditNumControlButtons: true
        };
      
      case controlTypeEnum.JOY_8WAY_TOPFIRE:
        return {
          defaultNumControlButtons: 1,
          canEditNumControlButtons: false
        };
      
      case controlTypeEnum.JOY_ANALOG_FLIGHTSTICK:
        return {
          defaultNumControlButtons: 3,
          canEditNumControlButtons: true
        };
      
      case controlTypeEnum.JOY_ANALOG_YOKE:
      case controlTypeEnum.THROTTLE:
        return {
          defaultNumControlButtons: 2,
          canEditNumControlButtons: true
        };
      
      case controlTypeEnum.STEERINGWHEEL_360:
      case controlTypeEnum.STEERINGWHEEL_270:
      case controlTypeEnum.SHIFTER_HIGHLOW:
      case controlTypeEnum.SHIFTER_UPDOWN:
      case controlTypeEnum.SHIFTER_4GEAR:
        return {
          defaultNumControlButtons: 0,
          canEditNumControlButtons: true
        };
      
      case controlTypeEnum.LIGHTGUN:
      case controlTypeEnum.LIGHTGUN_ANALOG:
        return {
          defaultNumControlButtons: 1,
          canEditNumControlButtons: true
        };
      
      default:
        return {
          defaultNumControlButtons: 0,
          canEditNumControlButtons: false
        };
    }
  }
  
  private updateControlButtonsDescription(
    controlButtonsDescElem: HTMLElement,
    numControlButtons     : number
  ): void {
    const isSingular = numControlButtons === 1;
    
    controlButtonsDescElem.classList.toggle('game-override-control-manager__control-buttons-desc--singular', isSingular);
    controlButtonsDescElem.classList.toggle('game-override-control-manager__control-buttons-desc--plural', !isSingular);
  }
  
  private remove(): void {
    this.emit('remove');
  }
}

function createGameButtons(numButtons: number): IGameButton[] {
  return Array(numButtons).fill({
    descriptor: undefined,
    input: {
      isAnalog: false,
      label   : undefined
    }
  });
}

class ValidationError extends Error {}