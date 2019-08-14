import gameOverrideControlManagerTemplate from './gameOverrideControlManager.html';
import {EventEmitter}                     from 'events';
import createDefaultGameButtons           from './createDefaultGameButtons';
import ValidationError                    from './validationError';
import {
  htmlToBlock,
  selectR,
  firstChildR
} from '../../helpers/htmlUtil';
import {
  IGameControl,
  IGameInput
} from '../../types/game';
import {
  IControlDef,
  controlTypeEnum
} from '../../types/controlDef';


export default class GameOverrideControlManager extends EventEmitter {
  public readonly elem: HTMLElement;
  
  private readonly controlDef: IControlDef;
  
  private readonly controlDefNameElem          : HTMLElement;
  private readonly controlButtonsDescElem      : HTMLElement;
  private readonly controlButtonsCountElem     : HTMLElement;
  private readonly controlButtonsCountInputElem: HTMLInputElement;
  private readonly removeButtonElem            : HTMLElement;
  
  public constructor(options: {
    controlDef        : IControlDef;
    numControlButtons?: number;
  }) {
    super();
    this.elem = firstChildR(htmlToBlock(gameOverrideControlManagerTemplate));
    
    this.controlDef = options.controlDef;
    
    this.controlDefNameElem           = selectR(this.elem, '.game-override-control-manager__control-def-name');
    this.controlButtonsDescElem       = selectR(this.elem, '.game-override-control-manager__control-buttons-desc');
    this.controlButtonsCountElem      = selectR(this.elem, '.game-override-control-manager__control-buttons-desc__count');
    this.controlButtonsCountInputElem = selectR(this.elem, '.game-override-control-manager__control-buttons-desc__count-input', 'input');
    this.removeButtonElem             = selectR(this.elem, '.game-override-control-manager__remove-button');
    
    const {
      defaultNumControlButtons,
      canEditNumControlButtons
    } = this.getControlButtonsDescOptions(this.controlDef);
    
    const numControlButtons = options.numControlButtons !== undefined? options.numControlButtons : defaultNumControlButtons;
    
    this.controlDefNameElem.innerText = this.controlDef.name;
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
  
  public static createFromGameControl(gameControl: IGameControl): GameOverrideControlManager {
    return new GameOverrideControlManager({
      controlDef       : gameControl.controlDef,
      numControlButtons: gameControl.buttons.length
    });
  }
  
  public createGameControl(): IGameControl {
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
      buttons: createDefaultGameButtons(numButtons)
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