import './compatibilityTable.less';
import compTableTemplate from './compatibilityTable.html';
import compTableRowTemplate from './compatibilityTableRow.html';
import htmlToBlock from '../../helpers/htmlToBlock';
import clearNodeChildren from '../../helpers/clearNodeChildren';
import {EventEmitter} from 'events';

/**
 * @typedef {import('../../dataAccess/mameList').Machine} Machine
 * @typedef {import('../../compatibilityChecker').MachineCompatibility} MachineCompatibility
 * @typedef {import('../../compatibilityChecker').EmulationCompatibilityStatus} EmulationCompatibilityStatus
 * @typedef {import('../../compatibilityChecker').ControlsCompatibilityStatus} ControlsCompatibilityStatus
 * @typedef {import('../../compatibilityChecker').VideoCompatibilityStatus} VideoCompatibilityStatus
 */

export default class CompatibilityTable extends EventEmitter {
  constructor() {
    super();
    
    /** @type {MachineCompatibility[]} */
    this.machineComs = [];
    
    this.elem = htmlToBlock(compTableTemplate).firstElementChild;
    this.videoStatusHeaderCellElem  = this.elem.querySelector('.comp-table__header-row__video-status');
    this.monitorConfigHeaderRowElem = this.elem.querySelector('.comp-table__monitor-configs-header-row');
    this.tableElem                  = this.elem.querySelector('.comp-table__table');
    this.bodyElem                   = this.elem.querySelector('.comp-table__body');
    this.refreshButtonElem          = this.elem.querySelector('.comp-table__refresh-button');
    
    this.refreshButtonElem.addEventListener('click', () => this.refresh());
  }
  
  refresh() {
    this.emit('refresh');
  }
  
  /**
   * @param {MachineCompatibility[]} machineComps 
   * @param {string[]} monitorConfigTitles
   */
  update(machineComps, monitorConfigTitles) {
    this.machineComs = machineComps;
    
    // clear rows
    clearNodeChildren(this.bodyElem);
    
    // clear monitor config cells
    const monitorConfigCellElems = Array.from(this.monitorConfigHeaderRowElem.querySelectorAll('.comp-table__monitor-configs-header-row__title'));
    while (monitorConfigCellElems.length > 1) {
      monitorConfigCellElems.pop().remove();
    }
    
    // create monitor config cells
    while (monitorConfigCellElems.length < monitorConfigTitles.length) {
      monitorConfigCellElems.push(
        this.monitorConfigHeaderRowElem.appendChild(
          monitorConfigCellElems[0].cloneNode(true)
        )
      );
    }
    
    // update header cells
    this.videoStatusHeaderCellElem.colSpan = 2 * monitorConfigCellElems.length;
    
    // set monitor config titles
    for (let i = 0; i < monitorConfigTitles.length; ++i) {
      monitorConfigCellElems[i].innerText = monitorConfigTitles[i];
    }
    
    this.tableElem.classList.toggle(
      'comp-table__table--single-monitor-configuration',
      monitorConfigTitles.length <= 1
    );
    
    // create rows
    for (let i = 0; i < machineComps.length; ++i) {
      const rowBlock = CompatibilityTable.createRowBlock(machineComps[i], i, monitorConfigTitles);
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
   * @param {MachineCompatibility} machineComp 
   * @param {number} rowIndex 
   * @param {string[]} monitorConfigTitles 
   */
  static createRowBlock(machineComp, rowIndex, monitorConfigTitles) {
    const {machine} = machineComp;
    const evenOddClass = `comp-table__row--${rowIndex % 2 === 0? 'odd' : 'even'}`;
    
    // translate statuses
    const {emuStatusDesc, emuStatusClass} = this.translateEmulationStatus(machineComp.emuComp.status);
    const {controlsStatusDesc, controlsStatusClass} = this.translateControlsStatus(machineComp.controlsComp.status);
    
    const detailsStr = CompatibilityTable.getDetailsStr(machineComp, monitorConfigTitles);
    
    // create short description
    const shortDesc = machine? this.shortenDescription(machine.description) : 'machine not found';
    
    // create block
    const rowBlock = htmlToBlock(compTableRowTemplate);
    
    rowBlock.querySelector('.comp-table__row')
    .classList.add(
      evenOddClass,
      emuStatusClass,
      controlsStatusClass,
      !machine? 'comp-table__row--invalid-machine-name' : null
    );
    
    rowBlock.querySelector('.comp-table__row__machine-name')
    .innerText = machine? machine.name : machineComp.machineNameInput;
    
    rowBlock.querySelector('.comp-table__row__desc')
    .innerText = shortDesc;
    
    rowBlock.querySelector('.comp-table__row__emu-status')
    .innerText = emuStatusDesc || '';
    
    rowBlock.querySelector('.comp-table__row__controls-status')
    .innerText = controlsStatusDesc || '';
    
    const videoStatusIconCellElems = [rowBlock.querySelector('.comp-table__row__video-status-icon')];
    const videoStatusCellElems     = [rowBlock.querySelector('.comp-table__row__video-status')];
    
    for (let i = 1; i < monitorConfigTitles.length; ++i) {
      const videoStatusIconCellElem = videoStatusIconCellElems[0].cloneNode(true);
      const videoStatusCellElem     = videoStatusCellElems    [0].cloneNode(true);
      
      videoStatusCellElems[i - 1].insertAdjacentElement(
        'afterend',
        videoStatusIconCellElem
      );
      videoStatusIconCellElem.insertAdjacentElement(
        'afterend',
        videoStatusCellElem
      );
      
      videoStatusIconCellElems.push(videoStatusIconCellElem);
      videoStatusCellElems    .push(videoStatusCellElem    );
    }
    
    for (let i = 0; i < monitorConfigTitles.length; ++i) {
      const videoComp = machineComp.videoComps[i];
      const {videoStatusDesc, videoStatusClass} = this.translateVideoStatus(videoComp.status);
      
      videoStatusIconCellElems[i].classList.add(videoStatusClass);
      videoStatusCellElems    [i].classList.add(videoStatusClass);
      videoStatusCellElems    [i].innerText = videoStatusDesc || '';
    }
    
    const toggleDetailsButtonElem = rowBlock.querySelector('.comp-table__row__toggle-details-button');
    if (!detailsStr) {
      toggleDetailsButtonElem.classList.add('hidden');
    }
    
    
    const detailsRowElem = rowBlock.querySelector('.comp-table__details-row');
    detailsRowElem.classList.add(evenOddClass);
    
    rowBlock.querySelector('.comp-table__details-row__text')
    .value = detailsStr || '';
    
    // attach event listener to toggle details button
    toggleDetailsButtonElem.addEventListener('click', () => {
      const isHidden = detailsRowElem.classList.toggle('hidden');
      toggleDetailsButtonElem.classList.toggle('toggle-state-on', !isHidden);
      toggleDetailsButtonElem.classList.toggle('toggle-state-off', isHidden);
    });
    
    return rowBlock;
  }
  
  /**
   * @param {MachineCompatibility} machineComp 
   * @param {string[]} monitorConfigTitles
   * @returns {string}
   */
  static getDetailsStr(machineComp, monitorConfigTitles) {
    if (!machineComp.machine) {
      return `Machine not found: ${machineComp.machineNameInput}`;
    }
    
    let detailsStr = '';
    for (let i = 0; i < monitorConfigTitles.length; ++i) {
      const monitorConfigTitle = monitorConfigTitles[i];
      const videoComp = machineComp.videoComps[i];
      
      if (monitorConfigTitles.length > 1) {
        detailsStr += `${monitorConfigTitle}:\n`;
      }
      
      if (!videoComp || !videoComp.modelineResult) {
        detailsStr += '--\n';
      }
      else if (videoComp.modelineResult.err) {
        detailsStr += `${videoComp.modelineResult.err}\n`;
      }
      else {
        detailsStr += `${videoComp.modelineResult.description}\n`;
        detailsStr += `${videoComp.modelineResult.details}\n`;
      }
    }
    
    const detailsObj = {};
    if (monitorConfigTitles.length > 1) {
      detailsObj.modelineResultMap = {};
      
      for (let i = 0; i < monitorConfigTitles.length; ++i) {
        const monitorConfigTitle = monitorConfigTitles[i];
        const videoComp = machineComp.videoComps[i];
        
        detailsObj.modelineResultMap[monitorConfigTitle] = (videoComp && videoComp.modelineResult) || null;
      }
    }
    else {
      const videoComp = machineComp.videoComps[0];
      detailsObj.modelineResult = (videoComp && videoComp.modelineResult) || null;
    }
    
    detailsObj.machine = machineComp.machine || null;
    detailsObj.controlsDatGame = machineComp.controlsComp.controlsDatGame || null;
    
    detailsStr += `\n${JSON.stringify(detailsObj, null, 2)}`;
    return detailsStr;
  }
  
  /**
   * @param {EmulationCompatibilityStatus} emuStatus 
   */
  static translateEmulationStatus(emuStatus) {
    const emuStatusDesc = {
      'good'       : 'Good',
      'imperfect'  : 'Imperfect',
      'preliminary': 'Preliminary',
    }[emuStatus] || emuStatus || 'Unknown';
    const emuStatusClass = {
      'good'       : 'comp-table__row--emu-status-good',
      'imperfect'  : 'comp-table__row--emu-status-imperfect',
      'preliminary': 'comp-table__row--emu-status-preliminary',
    }[emuStatus]  || 'comp-table__row--emu-status-unknown';
    
    return {
      emuStatusDesc,
      emuStatusClass
    };
  }
  
  /**
   * @param {ControlsCompatibilityStatus} controlsStatus 
   */
  static translateControlsStatus(controlsStatus) {
    const controlsStatusDesc = {
      'native'     : 'Native',
      'good'       : 'Good',
      'ok'         : 'OK',
      'bad'        : 'Bad',
      'unsupported': 'Unsupported'
    }[controlsStatus] || controlsStatus || 'Unknown';
    
    const controlsStatusClass = {
      'native'         : 'comp-table__row--controls-status-native',
      'good'           : 'comp-table__row--controls-status-good',
      'ok'             : 'comp-table__row--controls-status-ok',
      'bad'            : 'comp-table__row--controls-status-bad',
      'unsupported'    : 'comp-table__row--controls-status-unsupported'
    }[controlsStatus] || 'comp-table__row--controls-status-unknown';
    
    return {
      controlsStatusDesc,
      controlsStatusClass
    };
  }
  
  /**
   * @param {VideoCompatibilityStatus} videoStatus 
   */
  static translateVideoStatus(videoStatus) {
    const videoStatusDesc = {
      'native'            : 'Native',
      'int-scale'         : 'Scaled',
      'vfreq-slightly-off': 'VFreq',
      'bad'               : 'Bad',
      'unsupported'       : 'Unsupported'
    }[videoStatus] || videoStatus || 'Unknown';
    
    const videoStatusClass = {
      'native'            : 'comp-table__row--video-status-native',
      'int-scale'         : 'comp-table__row--video-status-int-scale',
      'vfreq-slightly-off': 'comp-table__row--video-status-vfreq-slightly-off',
      'bad'               : 'comp-table__row--video-status-bad',
      'unsupported'       : 'comp-table__row--video-status-unsupported'
    }[videoStatus] || 'comp-table__row--video-status-unknown';
    
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
