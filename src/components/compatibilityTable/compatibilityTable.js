import './compatibilityTable.less';
import compTableTemplate from './compatibilityTable.html';
import compTableRowTemplate from './compatibilityTableRow.html';
import compatibilityTableRowDetailsListItemTemplate from './compatibilityTableRowDetailsListItem.html';
import htmlToBlock from '../../helpers/htmlToBlock';
import clearNodeChildren from '../../helpers/clearNodeChildren';
import pluralize from '../../helpers/pluralize';
import {EventEmitter} from 'events';
import {
  EmulationCompatibilityStatusEnum,
  VideoCompatibilityStatusEnum,
  ControlsCompatibilityStatusEnum,
  MachineCompatibilityStatusEnum,
  emuToMachineCompatibilityStatus,
  controlsToMachineCompatibilityStatus,
  videoToMachineCompatibilityStatus
} from '../../compatibilityChecker';
import controlDefMap from '../../dataAccess/controlDefMap';

/**
 * @typedef {import('../../compatibilityChecker').MachineCompatibility} MachineCompatibility
 * @typedef {import('../../compatibilityChecker').ControlsCompatibility} ControlsCompatibility
 * @typedef {import('../../compatibilityChecker').MultidimensionalScore} MultidimensionalScore
 * @typedef {import('../../dataAccess/mameList').Machine} Machine
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
    
    // set monitor config titles
    for (let i = 0; i < monitorConfigTitles.length; ++i) {
      monitorConfigCellElems[i].innerText = monitorConfigTitles[i];
    }
    
    this.tableElem.classList.toggle(
      'comp-table__table--single-monitor-configuration',
      monitorConfigTitles.length <= 1
    );
    
    // update header cells
    this.videoStatusHeaderCellElem.colSpan = monitorConfigTitles.length;
    
    // create rows
    for (let i = 0; i < machineComps.length; ++i) {
      const rowBlock = this.createRowBlock(machineComps[i], i, monitorConfigTitles);
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
  createRowBlock(machineComp, rowIndex, monitorConfigTitles) {
    const {machine} = machineComp;
    const evenOddClass = `comp-table__row--${rowIndex % 2 === 0? 'odd' : 'even'}`;
    
    const rowBlock = htmlToBlock(compTableRowTemplate);
    
    // row
    const rowElem = rowBlock.querySelector('.comp-table__row');
    rowElem.classList.add(evenOddClass);
    
    const machineStatusTrans = this.translateMachineStatus(machineComp.knownStatus);
    rowElem.classList.add(machineStatusTrans.cssClass);
    
    // machine name
    rowBlock.querySelector('.comp-table__row__machine-name'      ).classList.add(machineStatusTrans.cssClass);
    rowBlock.querySelector('.comp-table__row__machine-name__icon').classList.add(machineStatusTrans.iconCSSClass);
    rowBlock.querySelector('.comp-table__row__machine-name__text').innerText = (
      machine
      ? machine.name
      : machineComp.machineNameInput
    );
    
    // machine desc
    rowBlock.querySelector('.comp-table__row__desc__text').innerText = (
      machine
      ? this.shortenDescription(machine.description)
      : '-- not found --'
    );
    
    // emulation status
    const emuStatusTrans = this.translateMachineStatus(emuToMachineCompatibilityStatus(machineComp.emuComp.status));
    rowBlock.querySelector('.comp-table__row__emu-status'      ).classList.add(emuStatusTrans.cssClass);
    rowBlock.querySelector('.comp-table__row__emu-status__icon').classList.add(emuStatusTrans.iconCSSClass);
    rowBlock.querySelector('.comp-table__row__emu-status__text').innerText = emuStatusTrans.desc;
    
    // controls status
    const controlsStatusTrans = this.translateMachineStatus(controlsToMachineCompatibilityStatus(machineComp.controlsComp.status));
    rowBlock.querySelector('.comp-table__row__controls-status'      ).classList.add(controlsStatusTrans.cssClass);
    rowBlock.querySelector('.comp-table__row__controls-status__icon').classList.add(controlsStatusTrans.iconCSSClass);
    rowBlock.querySelector('.comp-table__row__controls-status__text').innerText = controlsStatusTrans.desc;
    
    // video status
    const videoStatusCellElems = [rowBlock.querySelector('.comp-table__row__video-status')];
    
    while (videoStatusCellElems.length < monitorConfigTitles.length) {
      const lastVideoStatusCellElem = videoStatusCellElems[videoStatusCellElems.length - 1];
      const newVideoStatusCellElem = lastVideoStatusCellElem.cloneNode(true);
      
      lastVideoStatusCellElem.insertAdjacentElement('afterend', newVideoStatusCellElem);
      videoStatusCellElems.push(newVideoStatusCellElem);
    }
    
    for (let i = 0; i < monitorConfigTitles.length; ++i) {
      const videoComp = machineComp.videoComps[i];
      const videoStatusElem = videoStatusCellElems[i];
      
      const videoStatusTrans = this.translateMachineStatus(videoToMachineCompatibilityStatus(videoComp.status));
      videoStatusElem.classList.add(videoStatusTrans.cssClass);
      videoStatusElem.querySelector('.comp-table__row__video-status__icon').classList.add(videoStatusTrans.iconCSSClass);
      videoStatusElem.querySelector('.comp-table__row__video-status__text').innerText = videoStatusTrans.desc;
    }
    
    // details
    const detailsRowElem = rowBlock.querySelector('.comp-table__details-row');
    detailsRowElem.classList.add(evenOddClass);
    this.populateDetailsRow(detailsRowElem, machineComp, monitorConfigTitles);
    
    // attach event listener to toggle details button
    const toggleDetailsButtonElem = rowBlock.querySelector('.comp-table__row__toggle-details-button');
    toggleDetailsButtonElem.addEventListener('click', () => {
      const isHidden = detailsRowElem.classList.toggle('hidden');
      toggleDetailsButtonElem.classList.toggle('toggle-state-on', !isHidden);
      toggleDetailsButtonElem.classList.toggle('toggle-state-off', isHidden);
    });
    
    return rowBlock;
  }
  
  /**
   * @param {HTMLTableRowElement} detailsRowElem 
   * @param {MachineCompatibility} machineComp 
   * @param {string[]} monitorConfigTitles 
   */
  populateDetailsRow(detailsRowElem, machineComp, monitorConfigTitles) {
    // expand cell to fill row
    const cellElem = detailsRowElem.querySelector('td');
    cellElem.colSpan = 5 + monitorConfigTitles.length;
    
    // populate controls details
    this.populateControlsDetails(detailsRowElem, machineComp.controlsComp);
    
    // details JSON
    detailsRowElem.querySelector('.comp-table__details-row__json').value = (
      this.getDetailsJSON(machineComp, monitorConfigTitles)
    );
  }
  
  /**
   * @param {HTMLTableRowElement} detailsRowElem 
   * @param {ControlsCompatibility} controlsComp
   */
  populateControlsDetails(detailsRowElem, controlsComp) {
    const {controlConfigComp} = controlsComp;
    const controlsListElem = detailsRowElem.querySelector('.comp-table__details-row__list--controls');
    
    // check if control compatibility was able to be tested
    if (!controlConfigComp) {
      controlsListElem.appendChild(this.createDetailsListItem(
        MachineCompatibilityStatusEnum.UNKNOWN,
        'Unable to find control information for this ROM.'
      ));
      return;
    }
    
    // for each control set...
    for (const controlSetComp of controlConfigComp.controlSetComps) {
      const controlSetIsRequired = controlSetComp.gameControlSet.isRequired;
      const itemClasses = controlSetIsRequired? ['comp-table__details-row__list__item--optional']: [];
      
      // create a header item if there are multiple control sets
      if (controlConfigComp.controlSetComps.length > 1) {
        const controlSetTitle = `Player ${controlSetComp.gameControlSet.supportedPlayerNums.join('/')}:`;
        const controlSetRequiredDesc = controlSetIsRequired? '' : '(not required)';
        
        const text = `${controlSetTitle} ${controlSetRequiredDesc}`;
        const machineStatus = controlsToMachineCompatibilityStatus(controlSetComp.status);
        
        const itemElem = this.createDetailsListItem(text, machineStatus);
        itemElem.classList.add(...itemClasses);
        itemElem.classList.add('comp-table__details-row__list__item--header');
        controlsListElem.appendChild(itemElem);
      }
      
      
      // add a list item for each control compatibility
      for (const controlComp of controlSetComp.controlComps) {
        const showControlButtonsDescs = controlComp.gameControl.buttons.length > 0;
        
        const gameControlDesc = controlDefMap[controlComp.gameControl.type].name;
        const gameControlButtonsDesc = `with ${pluralize(controlComp.gameControl.buttons.length, 'button', 'buttons', ' ')}`;
        
        const cpControlDesc = controlComp.cpControl? `${controlComp.cpControl.controlDef.name} (${controlComp.cpControl.name})` : '×';
        const cpControlButtonsDesc = controlComp.cpControl? `with ${pluralize(controlComp.gameControl.buttons.length, 'button', 'buttons', ' ')}` : '';
        
        const text = [
          gameControlDesc,
          showControlButtonsDescs? gameControlButtonsDesc : '',
          '→',
          cpControlDesc,
          showControlButtonsDescs? cpControlButtonsDesc : ''
        ].join(' ');
        const machineStatus = controlsToMachineCompatibilityStatus(controlComp.status);
        
        const itemElem = this.createDetailsListItem(text, machineStatus);
        itemElem.classList.add(...itemClasses);
        controlsListElem.appendChild(itemElem);
      }
      
      // add a list item for the button compatibility
      const {buttonsComp} = controlSetComp;
      if (buttonsComp.gameButtons.length > 0) {
        const gameButtonsDesc = pluralize(buttonsComp.gameButtons.length, 'button', 'buttons', ' ');
        const cpButtonsDesc = (
          buttonsComp.cpButtonCluster
          ? `${pluralize(buttonsComp.cpButtonCluster.numButtons, 'button', 'buttons', ' ')} (${buttonsComp.cpButtonCluster.name})`
          : '×'
        );
        
        const text = `${gameButtonsDesc} → ${cpButtonsDesc}`;
        const machineStatus = controlsToMachineCompatibilityStatus(buttonsComp.status);
        
        const itemElem = this.createDetailsListItem(text, machineStatus);
        itemElem.classList.add(...itemClasses);
        controlsListElem.appendChild(itemElem);
      }
    }
  }
  
  /**
   * @param {string} text
   * @param {number} [machineStatus] 
   * @returns {HTMLElement} 
   */
  createDetailsListItem(text, machineStatus = null) {
    const itemElem = htmlToBlock(compatibilityTableRowDetailsListItemTemplate).firstElementChild;
    const textElem = itemElem.querySelector('.comp-table__details-row__list__item__text');
    const iconElem = itemElem.querySelector('.comp-table__details-row__list__item__icon');
    
    textElem.innerText = text;
    
    if (machineStatus === null) {
      iconElem.classList.add('hidden');
    }
    else {
      const {iconCSSClass} = this.translateMachineStatus(machineStatus);
      iconElem.classList.add(iconCSSClass);
    }
    
    return itemElem;
  }
  
  /**
   * @param {MachineCompatibility} machineComp 
   * @param {string[]} monitorConfigTitles
   * @returns {string}
   */
  getDetailsJSON(machineComp, monitorConfigTitles) {
    /*
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
    */
    
    return JSON.stringify({
      status: MachineCompatibilityStatusEnum.translate(machineComp.status),
      
      emuComp: {
        status: EmulationCompatibilityStatusEnum.translate(machineComp.emuComp.status)
      },
      
      videoComps: machineComp.videoComps.map((videoComp, i) => (
        !videoComp? null : {
          status: VideoCompatibilityStatusEnum.translate(videoComp.status),
          modelineConfig: videoComp.modelineConfig,
          modelineResult: videoComp.modelineResult,
        }
      )),
      
      controlsComp: {
        status: ControlsCompatibilityStatusEnum.translate(machineComp.controlsComp.status),
        score : !machineComp.controlsComp.controlConfigComp? null : formatDetailsScore(machineComp.controlsComp.controlConfigComp.score),
        controlSetComps: !machineComp.controlsComp.controlConfigComp? [] : machineComp.controlsComp.controlConfigComp.controlSetComps.map(controlSetComp => ({
          status: ControlsCompatibilityStatusEnum.translate(controlSetComp.status),
          score: formatDetailsScore(controlSetComp.score),
          gameControlSet: {
            supportedPlayerNums: controlSetComp.gameControlSet.supportedPlayerNums.join(','),
            isOnOppositeScreenSide: controlSetComp.gameControlSet.isOnOppositeScreenSide,
            isRequired: controlSetComp.gameControlSet.isRequired
          },
          controlComps: controlSetComp.controlComps.map(controlComp => ({
            controlStatus: ControlsCompatibilityStatusEnum.translate(controlComp.controlStatus),
            buttonsStatus: ControlsCompatibilityStatusEnum.translate(controlComp.buttonsStatus),
            status: ControlsCompatibilityStatusEnum.translate(controlComp.status),
            score: formatDetailsScore(controlComp.score),
            gameControl: {
              type: controlComp.gameControl.type,
              buttons: controlComp.gameControl.buttons.map(gameButton => 
                gameButton.input.label || gameButton.input.posLabel || gameButton.input.negLabel || gameButton.input.mameInputPort
              )
            },
            cpControl: !controlComp.cpControl? null : {
              type: controlComp.cpControl.controlDef.type,
              numButtons: controlComp.cpControl.numButtons
            }
          })),
          buttonsComp: {
            status: ControlsCompatibilityStatusEnum.translate(controlSetComp.buttonsComp.status),
            score: formatDetailsScore(controlSetComp.buttonsComp.score),
            gameButtons: controlSetComp.buttonsComp.gameButtons.map(gameButton => 
              gameButton.input.label || gameButton.input.posLabel || gameButton.input.negLabel || gameButton.input.mameInputPort
            ),
            cpButtonCluster: !controlSetComp.buttonsComp.cpButtonCluster? null : {
              name: controlSetComp.buttonsComp.cpButtonCluster.name,
              numButtons: controlSetComp.buttonsComp.cpButtonCluster.numButtons
            }
          }
        }))
      },
      
      machineNameInput: machineComp.machineNameInput,
      machine: machineComp.machine || null,
      controlsDatGame: machineComp.controlsComp.controlsDatGame || null,
    }, null, 2);
    
    /**
     * @param {MultidimensionalScore} score 
     * @param {object} [obj] 
     * @param {string} [keyPrefix] 
     */
    function formatDetailsScore(score, obj = {}, keyPrefix = '') {
      for (const dim of score.dims) {
        if (typeof dim.val === 'number') {
          obj[keyPrefix + dim.key] = dim.val;
        }
        else {
          formatDetailsScore(dim.val, obj, keyPrefix + dim.key + '.');
        }
      }
      
      return obj;
    }
  }
  
  /**
   * @param {number} machineStatus 
   */
  translateMachineStatus(machineStatus) {
    const cssClassSuffix = {
      [MachineCompatibilityStatusEnum.UNSUPPORTED]: 'error',
      [MachineCompatibilityStatusEnum.BAD        ]: 'error',
      [MachineCompatibilityStatusEnum.OK         ]: 'warn',
      [MachineCompatibilityStatusEnum.GOOD       ]: 'good',
      [MachineCompatibilityStatusEnum.NATIVE     ]: 'good'
    }[machineStatus] || 'unknown';
    
    const desc = {
      [MachineCompatibilityStatusEnum.UNKNOWN    ]: 'Unknown',
      [MachineCompatibilityStatusEnum.UNSUPPORTED]: 'Unuspported',
      [MachineCompatibilityStatusEnum.BAD        ]: 'Bad',
      [MachineCompatibilityStatusEnum.OK         ]: 'OK',
      [MachineCompatibilityStatusEnum.GOOD       ]: 'Good',
      [MachineCompatibilityStatusEnum.NATIVE     ]: 'Native'
    }[machineStatus] || MachineCompatibilityStatusEnum.translate(machineStatus);
    
    return {
      cssClass: `comp-table--${cssClassSuffix}`,
      iconCSSClass: `comp-table__icon--${cssClassSuffix}`,
      desc
    };
  }
  
  /**
   * @param {string} description 
   */
  shortenDescription(description) {
    return description.replace(/\(.+\)/g, '').trim();
  }
}
