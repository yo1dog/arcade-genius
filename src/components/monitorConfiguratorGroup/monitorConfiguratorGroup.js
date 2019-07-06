import './monitorConfiguratorGroup.less';
import monitorConfiguratorGroupTemplate from './monitorConfiguratorGroup.html';
import monitorConfiguratorGroupItemTemplate from './monitorConfiguratorGroupItem.html';
import htmlToBlock from '../../helpers/htmlToBlock';
import MonitorConfigurator from '../monitorConfigurator/monitorConfigurator';
import {EventEmitter} from 'events';

/**
 * @typedef {import('../../dataAccess/modelineCalculator').ModelineConfig} ModelineConfig
 */


export default class MonitorConfiguratorGroup {
  constructor() {
    /** @type {MonitorConfiguratorGroupItem[]} */
    this.items = [];
    
    this.curIdIndex = 0;
    
    this.elem = htmlToBlock(monitorConfiguratorGroupTemplate).firstElementChild;
    this.itemContainerElem = this.elem.querySelector('.monitor-configurator-group__item-container');
    this.addItemButton = this.elem.querySelector('.monitor-configurator-group__add-item-button');
    
    this.addItemButton.addEventListener('click', () => {
      this.addConfigurator();
    });
  }
  
  init() {
    const configuratorIds = this.loadState();
    for (const configuratorId of configuratorIds) {
      this.addConfigurator(configuratorId);
    }
    
    if (this.items.length === 0) {
      this.addConfigurator();
    }
  }
  
  /**
   * @param {string} [configuratorId]
   * @returns {MonitorConfiguratorGroupItem}
   */
  addConfigurator(configuratorId) {
    const itemIndex = this.items.length;
    const itemTitle = this.createTitleFromIndex(itemIndex);
    
    const configurator = new MonitorConfigurator(configuratorId || createConfiguratorId());
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
   * @param {string} id 
   * @returns {MonitorConfiguratorGroupItem}
   */
  removeConfigurator(id) {
    // find the item
    const itemIndex = this.items.findIndex(x => x.configurator.id === id);
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
   * @returns {string}
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
  
  /**
   * @returns {string}
   */
  getLocalStorageKey() {
    return 'monitorConfiguratorGroupItemIds';
  }
  
  saveState() {
    const configuratorIds = this.items.map(x => x.configurator.id);
    window.localStorage.setItem(this.getLocalStorageKey(), JSON.stringify(configuratorIds));
    
    for (const item of this.items) {
      item.configurator.saveState();
    }
  }
  
  /**
   * @returns {string[]}
   */
  loadState() {
    let configuratorIds = null;
    try {
      configuratorIds = JSON.parse(window.localStorage.getItem(this.getLocalStorageKey()));
    } catch(err) {/*noop*/}
    
    return configuratorIds || [];
  }
}

let __configuratorIdInc = 0;
function createConfiguratorId() {
  return `${Date.now()}-${__configuratorIdInc++}`;
}

class MonitorConfiguratorGroupItem extends EventEmitter {
  /**
   * @param {String} title 
   * @param {MonitorConfigurator} configurator 
   */
  constructor(title, configurator) {
    super();
    
    this.title = '';
    this.configurator = configurator;
    
    this.elem = htmlToBlock(monitorConfiguratorGroupItemTemplate).firstElementChild;
    this.titleElem                 = this.elem.querySelector('.monitor-configurator-group__item__title');
    this.configuratorContainerElem = this.elem.querySelector('.monitor-configurator-group__item__configurator-container');
    this.removeButtonElem          = this.elem.querySelector('.monitor-configurator-group__item__remove-button');
    
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
  
  hideRemoveButton() {
    this.removeButtonElem.classList.add('hidden');
  }
}