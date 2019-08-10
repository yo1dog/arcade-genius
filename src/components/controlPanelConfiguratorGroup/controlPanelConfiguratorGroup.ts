import './controlPanelConfiguratorGroup.less';
import {EventEmitter}                  from 'events';
import cpConfiguratorGroupTemplate     from './controlPanelConfiguratorGroup.html';
import cpConfiguratorGroupItemTemplate from './controlPanelConfiguratorGroupItem.html';
import CPConfigurator                  from '../controlPanelConfigurator/controlPanelConfigurator';
import * as stateUtil                  from '../../stateUtil';
import {ICPConfiguration}              from '../../types/controlPanel';
import createUUID                      from 'lib/get_uuid.js';
import {
  serializeState,
  deserializeState
} from './controlPanelConfiguratorGroupSerializer';
import {
  htmlToBlock,
  selectR,
  firstChildR
} from '../../helpers/htmlUtil';

export interface ICPConfiguratorGroupState {
  readonly configuratorIds: string[];
}


export default class CPConfiguratorGroup {
  public readonly items: CPConfiguratorGroupItem[];
  public readonly elem : HTMLElement;
  
  private readonly itemContainerElem: HTMLElement;
  private readonly addItemButton    : HTMLElement;
  
  
  public constructor() {
    this.items = [];
    
    this.elem = firstChildR(htmlToBlock(cpConfiguratorGroupTemplate));
    this.itemContainerElem = selectR(this.elem, '.control-panel-configurator-group__item-container');
    this.addItemButton     = selectR(this.elem, '.control-panel-configurator-group__add-item-button');
    
    this.addItemButton.addEventListener('click', () => {
      this.addConfigurator(); // eslint-disable-line @typescript-eslint/no-floating-promises
    });
  }
  
  public async init(): Promise<void> {
    const state = this.loadState();
    if (state) {
      for (const configuratorId of state.configuratorIds) {
        await this.addConfigurator(configuratorId);
      }
    }
    else {
      // legacy single configurator state
      await this.addConfigurator('__single');
    }
    
    if (this.items.length === 0) {
      await this.addConfigurator();
    }
  }
  
  public getControlPanelConfigs(): ICPConfiguration[] {
    return this.items.map(item => item.configurator.getControlPanelConfig());
  }
  
  public async addConfigurator(
    configuratorId: string = createUUID()
  ): Promise<CPConfiguratorGroupItem> {
    const itemIndex = this.items.length;
    
    const configurator = new CPConfigurator(configuratorId);
    await configurator.init();
    
    const item = new CPConfiguratorGroupItem(configurator);
    item.setName(this.createNameFromIndex(itemIndex));
    
    if (itemIndex === 0) {
      item.hideRemoveButton();
    }
    else {
      item.on('remove', () => {
        this.removeConfigurator(configurator.id);
      });
    }
    
    this.itemContainerElem.appendChild(item.elem);
    this.items.push(item);
    
    this.updateGroup();
    
    return item;
  }
  
  public removeConfigurator(configuratorId:string): CPConfiguratorGroupItem | undefined {
    // find the item
    const itemIndex = this.items.findIndex(x => x.configurator.id === configuratorId);
    if (itemIndex === -1) {
      return;
    }
    
    // remove the item
    const item = this.items[itemIndex];
    item.configurator.clearState();
    item.elem.remove();
    
    this.items.splice(itemIndex, 1);
    
    // reset names
    for (let i = itemIndex; i < this.items.length; ++i) {
      this.items[i].setName(this.createNameFromIndex(i));
    }
    
    this.updateGroup();
    
    return item;
  }
  
  private updateGroup(): void {
    this.elem.classList.toggle(
      'control-panel-configurator-group--single-item',
      this.items.length === 1
    );
  }
  
  private createNameFromIndex(index: number): string {
    // A,B,C...Z,A2,B2,C2...Z2,A3,B3,C3...
    
    const numLetters = 26;
    const quotient = Math.floor(index / numLetters);
    const remander = index - (quotient * numLetters);
    
    const letter = String.fromCharCode('A'.charCodeAt(0) + remander);
    const prefix = quotient === 0? '' : (quotient + 1).toString();
    
    return letter + prefix;
  }
  
  private getStateKey(): string {
    return 'controlPanelConfiguratorGroup';
  }
  
  public saveState(): void {
    const state: ICPConfiguratorGroupState = {
      configuratorIds: this.items.map(x => x.configurator.id)
    };
    
    const sState = serializeState(state);
    stateUtil.set(this.getStateKey(), sState);
    
    for (const item of this.items) {
      item.configurator.saveState();
    }
  }
  
  private loadState(): ICPConfiguratorGroupState | undefined {
    const sState = stateUtil.get(this.getStateKey());
    if (!sState) return;
    
    try {
      return deserializeState(sState, 'sCPConfiguratorGroupState');
    }
    catch (err) {
      console.error(`Error deserializing Control Panel Configurator Group state:`);
      console.error(err);
    }
  }
}


class CPConfiguratorGroupItem extends EventEmitter {
  public readonly configurator: CPConfigurator;
  public readonly elem        : HTMLElement;
  
  private readonly nameElem                 : HTMLElement;
  private readonly configuratorContainerElem: HTMLElement;
  private readonly removeButtonElem         : HTMLElement;
  
  
  public constructor(configurator: CPConfigurator) {
    super();
    
    this.configurator = configurator;
    
    this.elem = firstChildR(htmlToBlock(cpConfiguratorGroupItemTemplate));
    this.nameElem                  = selectR(this.elem, '.control-panel-configurator-group__item__name');
    this.configuratorContainerElem = selectR(this.elem, '.control-panel-configurator-group__item__configurator-container');
    this.removeButtonElem          = selectR(this.elem, '.control-panel-configurator-group__item__remove-button');
    
    this.configuratorContainerElem.appendChild(configurator.elem);
    
    this.removeButtonElem.addEventListener('click', () => {
      this.remove();
    });
  }
  
  public remove(): void {
    this.emit('remove');
  }
  
  public setName(name: string): void {
    this.configurator.name = name;
    this.nameElem.innerText = name;
  }
  
  public hideRemoveButton(): void {
    this.removeButtonElem.classList.add('hidden');
  }
}
