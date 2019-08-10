import './monitorConfiguratorGroup.less';
import {EventEmitter}                       from 'events';
import monitorConfiguratorGroupTemplate     from './monitorConfiguratorGroup.html';
import monitorConfiguratorGroupItemTemplate from './monitorConfiguratorGroupItem.html';
import MonitorConfigurator                  from '../monitorConfigurator/monitorConfigurator';
import * as stateUtil                       from '../../stateUtil';
import {IMonitorConfiguration}              from '../../types/monitor';
import createUUID                           from 'lib/get_uuid.js';
import {
  serializeState,
  deserializeState
} from './monitorConfiguratorGroupSerializer';
import {
  htmlToBlock,
  selectR,
  firstChildR
} from '../../helpers/htmlUtil';

export interface IMonitorConfiguratorGroupState {
  readonly configuratorIds: string[];
}


export default class MonitorConfiguratorGroup {
  public readonly items: MonitorConfiguratorGroupItem[];
  public readonly elem : HTMLElement;
  
  private readonly itemContainerElem: HTMLElement;
  private readonly addItemButton    : HTMLElement;
  
  
  public constructor() {
    this.items = [];
    
    this.elem = firstChildR(htmlToBlock(monitorConfiguratorGroupTemplate));
    this.itemContainerElem = selectR(this.elem, '.monitor-configurator-group__item-container');
    this.addItemButton     = selectR(this.elem, '.monitor-configurator-group__add-item-button');
    
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
    
    if (this.items.length === 0) {
      await this.addConfigurator();
    }
  }
  
  public getMonitorConfigs(): IMonitorConfiguration[] {
    return this.items.map(item => item.configurator.getMonitorConfig());
  }
  
  public async addConfigurator(
    configuratorId: string = createUUID()
  ): Promise<MonitorConfiguratorGroupItem> {
    const itemIndex = this.items.length;
    
    const configurator = new MonitorConfigurator(configuratorId);
    await configurator.init();
    
    const item = new MonitorConfiguratorGroupItem(configurator);
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
  
  public removeConfigurator(configuratorId:string): MonitorConfiguratorGroupItem | undefined {
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
      'monitor-configurator-group--single-item',
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
    return 'monitorConfiguratorGroup';
  }
  
  public saveState(): void {
    const state: IMonitorConfiguratorGroupState = {
      configuratorIds: this.items.map(x => x.configurator.id)
    };
    
    const sState = serializeState(state);
    stateUtil.set(this.getStateKey(), sState);
    
    for (const item of this.items) {
      item.configurator.saveState();
    }
  }
  
  private loadState(): IMonitorConfiguratorGroupState | undefined {
    const sState = stateUtil.depricate(
      this.getStateKey(),
      'monitorConfiguratorGroupItemIds' // depricated keys
    );
    if (!sState) return;
    
    try {
      return deserializeState(sState, 'sMonitorConfiguratorGroupState');
    }
    catch (err) {
      console.error(`Error deserializing Monitor Configurator Group state:`);
      console.error(err);
    }
  }
}


class MonitorConfiguratorGroupItem extends EventEmitter {
  public readonly configurator: MonitorConfigurator;
  public readonly elem        : HTMLElement;
  
  private readonly nameElem                 : HTMLElement;
  private readonly configuratorContainerElem: HTMLElement;
  private readonly removeButtonElem         : HTMLElement;
  
  
  public constructor(configurator: MonitorConfigurator) {
    super();
    
    this.configurator = configurator;
    
    this.elem = firstChildR(htmlToBlock(monitorConfiguratorGroupItemTemplate));
    this.nameElem                 = selectR(this.elem, '.monitor-configurator-group__item__name');
    this.configuratorContainerElem = selectR(this.elem, '.monitor-configurator-group__item__configurator-container');
    this.removeButtonElem          = selectR(this.elem, '.monitor-configurator-group__item__remove-button');
    
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
