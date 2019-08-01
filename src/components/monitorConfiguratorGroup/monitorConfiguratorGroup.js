import './monitorConfiguratorGroup.less';
import {EventEmitter}                       from 'events';
import monitorConfiguratorGroupTemplate     from './monitorConfiguratorGroup.html';
import monitorConfiguratorGroupItemTemplate from './monitorConfiguratorGroupItem.html';
import MonitorConfigurator                  from '../monitorConfigurator/monitorConfigurator';
import createUUID                           from '../../helpers/createUUID';
import * as stateUtil                       from '../../dataAccess/stateUtil';
import {
  serializeState,
  deserializeState
} from './monitorConfiguratorGroupSerializer';
import {
  htmlToBlock,
  selectR,
  firstChildR
} from '../../helpers/htmlUtil';

/**
 * @typedef {{
 *   readonly configuratorIds: string[]
 * }} IMonitorConfiguratorGroupState
 */


export default class MonitorConfiguratorGroup {
  constructor() {
    /** @type {MonitorConfiguratorGroupItem[]} */
    this.items = [];
    
    this.elem = firstChildR(htmlToBlock(monitorConfiguratorGroupTemplate));
    this.itemContainerElem = selectR(this.elem, '.monitor-configurator-group__item-container');
    this.addItemButton     = selectR(this.elem, '.monitor-configurator-group__add-item-button');
    
    this.addItemButton.addEventListener('click', () => {
      this.addConfigurator();
    });
  }
  
  async init() {
    const state = this.loadState();
    if (state) {
      for (const configuratorId of state.configuratorIds) {
        this.addConfigurator(configuratorId);
      }
    }
    
    if (this.items.length === 0) {
      this.addConfigurator();
    }
    
    return Promise.resolve();
  }
  
  /**
   * @param {string} [configuratorId]
   */
  addConfigurator(configuratorId = createUUID()) {
    const itemIndex = this.items.length;
    const itemTitle = this.createTitleFromIndex(itemIndex);
    
    const configurator = new MonitorConfigurator(configuratorId);
    configurator.init();
    
    const item = new MonitorConfiguratorGroupItem(itemTitle, configurator);
    
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
  
  /**
   * @param {string} configuratorId 
   */
  removeConfigurator(configuratorId) {
    // find the item
    const itemIndex = this.items.findIndex(x => x.configurator.id === configuratorId);
    if (itemIndex === -1) {
      return null;
    }
    
    // remove the item
    const item = this.items[itemIndex];
    item.configurator.clearState();
    item.elem.remove();
    
    this.items.splice(itemIndex, 1);
    
    // reset titles
    for (let i = itemIndex; i < this.items.length; ++i) {
      this.items[i].setTitle(this.createTitleFromIndex(i));
    }
    
    this.updateGroup();
    
    return item;
  }
  
  updateGroup() {
    this.elem.classList.toggle(
      'monitor-configurator-group--single-item',
      this.items.length === 1
    );
  }
  
  /**
   * @param {number} index 
   */
  createTitleFromIndex(index) {
    // A,B,C...Z,A2,B2,C2...Z2,A3,B3,C3...
    
    const numLetters = 26;
    const quotient = Math.floor(index / numLetters);
    const remander = index - (quotient * numLetters);
    
    const letter = String.fromCharCode('A'.charCodeAt(0) + remander);
    const prefix = quotient === 0? '' : (quotient + 1).toString();
    
    return letter + prefix;
  }
  
  getStateKey() {
    return 'monitorConfiguratorGroupItemIds';
  }
  
  saveState() {
    /** @type {IMonitorConfiguratorGroupState} */
    const state = {
      configuratorIds: this.items.map(x => x.configurator.id)
    };
    
    const sState = serializeState(state);
    stateUtil.set(this.getStateKey(), sState);
    
    for (const item of this.items) {
      item.configurator.saveState();
    }
  }
  
  /**
   * @returns {IMonitorConfiguratorGroupState | undefined}
   */
  loadState() {
    const sState = stateUtil.get(this.getStateKey());
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
  /**
   * @param {string} title 
   * @param {MonitorConfigurator} configurator 
   */
  constructor(title, configurator) {
    super();
    
    this.configurator = configurator;
    
    this.elem = firstChildR(htmlToBlock(monitorConfiguratorGroupItemTemplate));
    this.titleElem                 = selectR(this.elem, '.monitor-configurator-group__item__title');
    this.configuratorContainerElem = selectR(this.elem, '.monitor-configurator-group__item__configurator-container');
    this.removeButtonElem          = selectR(this.elem, '.monitor-configurator-group__item__remove-button');
    
    this.title = '';
    this.setTitle(title);
    this.configuratorContainerElem.appendChild(configurator.elem);
    
    this.removeButtonElem.addEventListener('click', () => {
      this.remove();
    });
  }
  
  remove() {
    this.emit('remove');
  }
  
  /**
   * @param {string} title 
   */
  setTitle(title) {
    this.title = title;
    this.titleElem.innerText = title;
  }
  
  getTitle() {
    return this.title;
  }
  
  hideRemoveButton() {
    this.removeButtonElem.classList.add('hidden');
  }
}
