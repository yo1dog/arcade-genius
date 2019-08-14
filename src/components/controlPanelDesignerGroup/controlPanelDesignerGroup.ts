import './controlPanelDesignerGroup.less';
import {EventEmitter}              from 'events';
import cpDesignerGroupTemplate     from './controlPanelDesignerGroup.html';
import cpDesignerGroupItemTemplate from './controlPanelDesignerGroupItem.html';
import CPDesigner                  from '../controlPanelDesigner/controlPanelDesigner';
import * as stateUtil              from '../../stateUtil';
import {ICPConfiguration}          from '../../types/controlPanel';
import createUUID                  from 'lib/get_uuid.js';
import {
  serializeState,
  deserializeState
} from './controlPanelDesignerGroupSerializer';
import {
  htmlToBlock,
  selectR,
  firstChildR
} from '../../helpers/htmlUtil';

export interface ICPDesignerGroupState {
  readonly designerIds: string[];
}


export default class CPDesignerGroup {
  public readonly items: CPDesignerGroupItem[];
  public readonly elem : HTMLElement;
  
  private readonly itemContainerElem: HTMLElement;
  private readonly addItemButton    : HTMLElement;
  
  
  public constructor() {
    this.items = [];
    
    this.elem = firstChildR(htmlToBlock(cpDesignerGroupTemplate));
    this.itemContainerElem = selectR(this.elem, '.control-panel-designer-group__item-container');
    this.addItemButton     = selectR(this.elem, '.control-panel-designer-group__add-item-button');
    
    this.addItemButton.addEventListener('click', () => {
      this.addDesigner(); // eslint-disable-line @typescript-eslint/no-floating-promises
    });
  }
  
  public async init(): Promise<void> {
    const state = this.loadState();
    if (state) {
      for (const designerId of state.designerIds) {
        await this.addDesigner(designerId);
      }
    }
    else {
      // legacy single designer state
      await this.addDesigner('__single');
    }
    
    if (this.items.length === 0) {
      await this.addDesigner();
    }
  }
  
  public getControlPanelConfigs(): ICPConfiguration[] {
    return this.items.map(item => item.designer.getControlPanelConfig());
  }
  
  public async addDesigner(
    designerId: string = createUUID()
  ): Promise<CPDesignerGroupItem> {
    const itemIndex = this.items.length;
    
    const designer = new CPDesigner(designerId);
    await designer.init();
    
    const item = new CPDesignerGroupItem(designer);
    item.setName(this.createNameFromIndex(itemIndex));
    
    if (itemIndex === 0) {
      item.hideRemoveButton();
    }
    else {
      item.on('remove', () => {
        this.removeDesigner(designer.id);
      });
    }
    
    this.itemContainerElem.appendChild(item.elem);
    this.items.push(item);
    
    this.updateGroup();
    
    return item;
  }
  
  public removeDesigner(designerId:string): CPDesignerGroupItem | undefined {
    // find the item
    const itemIndex = this.items.findIndex(x => x.designer.id === designerId);
    if (itemIndex === -1) {
      return;
    }
    
    // remove the item
    const item = this.items[itemIndex];
    item.designer.clearState();
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
      'control-panel-designer-group--single-item',
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
    return 'controlPanelDesignerGroup';
  }
  
  public saveState(): void {
    const state: ICPDesignerGroupState = {
      designerIds: this.items.map(x => x.designer.id)
    };
    
    const sState = serializeState(state);
    stateUtil.set(this.getStateKey(), sState);
    
    for (const item of this.items) {
      item.designer.saveState();
    }
  }
  
  private loadState(): ICPDesignerGroupState | undefined {
    const sState = stateUtil.depricate(
      this.getStateKey(),
      'controlPanelConfiguratorGroup'
    );
    if (!sState) return;
    
    try {
      return deserializeState(sState, 'sCPDesignerGroupState');
    }
    catch (err) {
      console.error(`Error deserializing Control Panel Designer Group state:`);
      console.error(err);
    }
  }
}


class CPDesignerGroupItem extends EventEmitter {
  public readonly designer: CPDesigner;
  public readonly elem    : HTMLElement;
  
  private readonly nameElem             : HTMLElement;
  private readonly designerContainerElem: HTMLElement;
  private readonly removeButtonElem     : HTMLElement;
  
  
  public constructor(designer: CPDesigner) {
    super();
    
    this.designer = designer;
    
    this.elem = firstChildR(htmlToBlock(cpDesignerGroupItemTemplate));
    this.nameElem              = selectR(this.elem, '.control-panel-designer-group__item__name');
    this.designerContainerElem = selectR(this.elem, '.control-panel-designer-group__item__designer-container');
    this.removeButtonElem      = selectR(this.elem, '.control-panel-designer-group__item__remove-button');
    
    this.designerContainerElem.appendChild(designer.elem);
    
    this.removeButtonElem.addEventListener('click', () => {
      this.remove();
    });
  }
  
  public remove(): void {
    this.emit('remove');
  }
  
  public setName(name: string): void {
    this.designer.name = name;
    this.nameElem.innerText = name;
  }
  
  public hideRemoveButton(): void {
    this.removeButtonElem.classList.add('hidden');
  }
}
