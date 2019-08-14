import gameOverrideGameManagerTemplate  from './gameOverrideGameManager.html';
import shortenDescription               from '../../helpers/shortenDescription';
import GameOverrideControlConfigManager from './gameOverrideControlConfigManager';
import ValidationError                  from './validationError';
import * as mameListUtil                from '../../data/mameListUtil';
import {EventEmitter}                   from 'events';
import {
  htmlToBlock,
  selectR,
  firstChildR
} from '../../helpers/htmlUtil';
import {
  IGame,
  IGameDisplay,
  IGameControlInfo
} from '../../types/game';
import {
  DisplayType,
  DisplayRotation,
  displayTypeEnum,
  displayRotationEnum
} from '../../types/common';


export default class GameOverrideGameManager extends EventEmitter {
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
  
  
  public constructor(options: {
    name?           : string;
    description?    : string;
    cloneOfGameName?: string;
    displayType?    : DisplayType;
    displayRotation?: DisplayRotation;
    displayFlipx?   : boolean;
    displayRefresh? : number;
    displayWidth?   : number;
    displayHeight?  : number;
    alternatesTurns?: boolean;
    numPlayers?     : number;
    gameOverrideControlConfigManagers?: GameOverrideControlConfigManager[];
  } = {}) {
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
    
    this.alternatesTurnsCheckboxElem.addEventListener('change', () => {
      this.updateNumPlayersRowElem();
    });
    
    this.addControlConfigButtonElem.addEventListener('click', () => {
      this.addGameOverrideControlConfigManager(new GameOverrideControlConfigManager());
    });
    
    this.removeButtonElem.addEventListener('click', () => {
      this.remove();
    });
    
    if (options.name            !== undefined) this.nameInputElem              .value   = options.name;
    if (options.description     !== undefined) this.descriptionInputElem       .value   = options.description;
  //if (options.cloneOfGameName !== undefined) this.cloneOfInputElem           .value   = options.cloneOfGameName;
    if (options.displayType     !== undefined) this.displayTypeSelectElem      .value   = options.displayType.val;
    if (options.displayRotation !== undefined) this.displayRotationSelectElem  .value   = options.displayRotation.val.toString();
    if (options.displayFlipx    !== undefined) this.displayFlipXCheckboxElem   .checked = options.displayFlipx;
    if (options.displayRefresh  !== undefined) this.displayRefreshInputElem    .value   = options.displayRefresh.toString();
    if (options.alternatesTurns !== undefined) this.alternatesTurnsCheckboxElem.checked = options.alternatesTurns;
    if (options.numPlayers      !== undefined) this.numPlayersInputElem        .value   = options.numPlayers.toString();
    if (
      options.displayWidth  !== undefined &&
      options.displayHeight !== undefined
    ) {
      this.displayResolutionInputElem.value = `${options.displayWidth}x${options.displayHeight}`;
    }
    if (options.gameOverrideControlConfigManagers) {
      for (const manager of options.gameOverrideControlConfigManagers) {
        this.addGameOverrideControlConfigManager(manager);
      }
    }
    else {
      this.addGameOverrideControlConfigManager(new GameOverrideControlConfigManager());
    }
    
    this.updateShortDescriptionElem();
    this.updateNumPlayersRowElem();
  }
  
  public static createFromGame(game: IGame): GameOverrideGameManager {
    const gameOverrideControlConfigManagers = (game.controlInfo? game.controlInfo.controlConfigs: []).map(gameControlConfig =>
      GameOverrideControlConfigManager.createFromGameControlConfig(gameControlConfig)
    );
    if (gameOverrideControlConfigManagers.length === 0) {
      gameOverrideControlConfigManagers.push(new GameOverrideControlConfigManager({
        gameOverrideControlSetManagers: []
      }));
    }
    
    return new GameOverrideGameManager({
      name           : game.name,
      description    : game.description,
      cloneOfGameName: game.cloneOfGame && game.cloneOfGame.name,
      displayType    : game.primaryDisplay && game.primaryDisplay.type,
      displayRotation: game.primaryDisplay && game.primaryDisplay.rotation,
      displayFlipx   : game.primaryDisplay && game.primaryDisplay.flipx,
      displayRefresh : game.primaryDisplay && game.primaryDisplay.refresh,
      displayWidth   : game.primaryDisplay && game.primaryDisplay.width,
      displayHeight  : game.primaryDisplay && game.primaryDisplay.height,
      alternatesTurns: game.controlInfo && game.controlInfo.alternatesTurns,
      numPlayers     : game.controlInfo && game.controlInfo.numPlayers,
      gameOverrideControlConfigManagers
    });
  }
  
  public addGameOverrideControlConfigManager(gameOverrideControlConfigManager: GameOverrideControlConfigManager): void {
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
  
  public createGame(): IGame {
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
    
    const refresh = parseFloat(this.displayRefreshInputElem.value);
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
        x.createGameControlConfig(alternatesTurns, numPlayers)
      )
    };
    
    const name = this.nameInputElem.value.trim().toLowerCase();
    const mameMachine = mameListUtil.get().machines.find(x => x.name === name);
    
    return {
      name,
      description     : this.descriptionInputElem.value,
      shortDescription: undefined,
      cloneOfGame     : undefined,
      primaryDisplay  : display,
      displays        : [display],
      controlInfo,
      mameMachine
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