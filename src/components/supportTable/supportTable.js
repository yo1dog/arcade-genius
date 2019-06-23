import './supportTable.less';
import supportTableTemplate from './supportTable.html';
import supportTableRowTemplate from './supportTableRow.html';
import htmlToBlock from '../../helpers/htmlToBlock';
import clearNodeChildren from '../../helpers/clearNodeChildren';
import {EventEmitter} from 'events';

/**
 * @typedef {import('../../supportChecker').SupportResult} SupportResult
 * @typedef {import('../../supportChecker').EmulationStatus} EmulationStatus
 * @typedef {import('../../supportChecker').ControlsStatus} ControlsStatus
 */

export default class MachineNameList extends EventEmitter {
  constructor() {
    super();
    
    /** @type {SupportResult[]} */
    this.supportResults = [];
    
    this.block = htmlToBlock(supportTableTemplate);
    this.bodyElem = this.block.getElementById('support-table__body');
    this.refreshButtonElem = this.block.getElementById('support-table__refresh-button');
    
    this.refreshButtonElem.addEventListener('click', () => this.refresh());
  }
  
  refresh() {
    this.emit('refresh');
  }
  
  /**
   * @param {SupportResult[]} supportResults 
   */
  update(supportResults) {
    this.supportResults = supportResults;
    
    // clear rows
    clearNodeChildren(this.bodyElem);
    
    // create rows
    for (let i = 0; i < this.supportResults.length; ++i) {
      const rowBlock = MachineNameList.createRowBlock(this.supportResults[i], i);
      this.bodyElem.appendChild(rowBlock);
    }
  }
  
  enableRefresh() {
    this.refreshButtonElem.disabled = false;
  }
  disableRefresh() {
    this.refreshButtonElem.disabled = true;
  }
  
  /**
   * @param {SupportResult} supportResult 
   * @param {number} rowIndex 
   */
  static createRowBlock(supportResult, rowIndex) {
    const {machine} = supportResult;
    const evenOddClass = `support-table__row--${rowIndex % 2 === 0? 'odd' : 'even'}`;
    
    // translate statuses
    const {emuStatusDesc, emuStatusClass} = this.translateEmuStatus(supportResult.emuStatus);
    const {controlsStatusDesc, controlsStatusClass} = this.translateControlsStatus(supportResult.controlsStatus);
    const {videoStatusDesc, videoStatusClass} = this.translateVideoStatus(supportResult.videoStatus);
    
    const detailsStr = machine? JSON.stringify({
      modelineResult: supportResult.modelineResult,
      machine,
      controlsDatGame: supportResult.controlsDatGame
    }, null, 2) : '';
    
    // create short description
    const shortDesc = machine? this.shortenDescription(machine.description) : 'machine not found';
    
    // create block
    const rowBlock = htmlToBlock(supportTableRowTemplate);
    
    rowBlock.querySelector('.support-table__row')
    .classList.add(
      evenOddClass,
      emuStatusClass,
      controlsStatusClass,
      videoStatusClass,
      !machine? 'support-table__row--invalid-machine-name' : null
    );
    
    rowBlock.querySelector('.support-table__row__machine-name')
    .innerText = machine? machine.name : supportResult.machineNameInput;
    
    rowBlock.querySelector('.support-table__row__desc')
    .innerText = shortDesc;
    
    rowBlock.querySelector('.support-table__row__emu-status')
    .innerText = emuStatusDesc || '';
    
    rowBlock.querySelector('.support-table__row__controls-status')
    .innerText = controlsStatusDesc || '';
    
    rowBlock.querySelector('.support-table__row__video-status')
    .innerText = videoStatusDesc || '';
    
    const toggleDetailsButtonElem = rowBlock.querySelector('.support-table__row__toggle-details-button');
    if (!detailsStr) {
      toggleDetailsButtonElem.classList.add('hidden');
    }
    
    
    const detailsRowElem = rowBlock.querySelector('.support-table__details-row');
    detailsRowElem.classList.add(evenOddClass);
    
    rowBlock.querySelector('.support-table__details-row__text')
    .value = detailsStr || '';
    
    // attach event listener to toggle details button
    toggleDetailsButtonElem.addEventListener('click', () => {
      if (detailsRowElem.classList.contains('hidden')) {
        detailsRowElem.classList.remove('hidden');
        toggleDetailsButtonElem.classList.add('toggle-state-on');
        toggleDetailsButtonElem.classList.remove('toggle-state-off');
      }
      else {
        detailsRowElem.classList.add('hidden');
        toggleDetailsButtonElem.classList.remove('toggle-state-on');
        toggleDetailsButtonElem.classList.add('toggle-state-off');
      }
    });
    
    return rowBlock;
  }
  
  /**
   * @param {EmulationStatus} emuStatus 
   */
  static translateEmuStatus(emuStatus) {
    const emuStatusDesc = {
      good       : 'Good',
      imperfect  : 'Imperfect',
      preliminary: 'Preliminary',
      notfound   : 'Not Found'
    }[emuStatus] || emuStatus;
    const emuStatusClass = {
      good       : 'support-table__row--emu-status-good',
      imperfect  : 'support-table__row--emu-status-imperfect',
      preliminary: 'support-table__row--emu-status-preliminary',
      notfound   : 'support-table__row--emu-status-not-found'
    }[emuStatus] || 'support-table__row--emu-status-unknown';
    
    return {
      emuStatusDesc,
      emuStatusClass
    };
  }
  
  /**
   * @param {ControlsStatus} controlsStatus 
   */
  static translateControlsStatus(controlsStatus) {
    const controlsStatusDesc = {
      native : 'Native',
      good   : 'Good',
      ok     : 'OK',
      bad    : 'Bad',
      missing: 'Missing'
    }[controlsStatus] || controlsStatus || 'Unknown';
    
    const controlsStatusClass = {
      native : 'support-table__row--controls-status-native',
      good   : 'support-table__row--controls-status-good',
      ok     : 'support-table__row--controls-status-ok',
      bad    : 'support-table__row--controls-status-bad',
      missing: 'support-table__row--controls-status-missing'
    }[controlsStatus] || 'support-table__row--controls-status-unknown';
    
    return {
      controlsStatusDesc,
      controlsStatusClass
    };
  }
  
  /**
   * @param {VideoStatus} videoStatus 
   */
  static translateVideoStatus(videoStatus) {
    const videoStatusDesc = {
      native     : 'Native',
      good       : 'Good',
      ok         : 'OK',
      bad        : 'Bad',
      unsupported: 'Unsupported'
    }[videoStatus] || videoStatus || 'Unknown';
    
    const videoStatusClass = {
      native     : 'support-table__row--video-status-native',
      good       : 'support-table__row--video-status-good',
      ok         : 'support-table__row--video-status-ok',
      bad        : 'support-table__row--video-status-bad',
      unsupported: 'support-table__row--video-status-unsupported'
    }[videoStatus] || 'support-table__row--video-status-unknown';
    
    return {
      videoStatusDesc,
      videoStatusClass
    };
  }
  
  /**
   * @param {string} description 
   */
  static shortenDescription(description) {
    return description.replace(/\(.+\)/g, '').trim();
  }
}
