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
import jsonView from '../../../lib/jsonview/jsonview';

/**
 * @typedef {import('../../compatibilityChecker').MachineCompatibility} MachineCompatibility
 * @typedef {import('../../compatibilityChecker').EmulationCompatibility} EmulationCompatibility
 * @typedef {import('../../compatibilityChecker').VideoCompatibility} VideoCompatibility
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
    /** @type {HTMLTableElement} */
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
    
    if (!machine) {
      rowElem.classList.add('comp-table__row--invalid-machine-name');
    }
    
    /*
    // machine name
    rowBlock.querySelector('.comp-table__row__machine-name'      ).classList.add(machineStatusTrans.cssClass);
    rowBlock.querySelector('.comp-table__row__machine-name__icon').classList.add(machineStatusTrans.iconCSSClass);
    rowBlock.querySelector('.comp-table__row__machine-name__text').innerText = (
      machine
      ? machine.name
      : machineComp.machineNameInput
    );
    */
   
    // machine desc
    rowBlock.querySelector('.comp-table__row__desc'      ).classList.add(machineStatusTrans.cssClass);
    rowBlock.querySelector('.comp-table__row__desc__icon').classList.add(machineStatusTrans.iconCSSClass);
    rowBlock.querySelector('.comp-table__row__desc__text').innerText = (
      machine
      ? this.shortenDescription(machine.description)
      : machineComp.machineNameInput
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
    
    const spacerRows = Array.from(rowBlock.querySelectorAll('.comp-table__spacer-row'));
    
    // attach event listener to toggle details button
    const toggleDetailsButtonElem = rowBlock.querySelector('.comp-table__row__toggle-details-button');
    toggleDetailsButtonElem.addEventListener('click', () => {
      const isShown = detailsRowElem.classList.toggle('comp-table__row--details-shown');
      
      for (const elem of [rowElem, ...spacerRows]) {
        elem.classList.toggle('comp-table__row--details-shown', isShown);
      }
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
    cellElem.colSpan = (
      Array.from(this.tableElem.rows.item(0).cells)
      .reduce((p, c) => p + c.colSpan, 0)
    );
    
    const machineListElem = detailsRowElem.querySelector('.comp-table__details-row__list--machine');
    const mainContentElem = detailsRowElem.querySelector('.comp-table__details-row__main-content');
    
    if (machineComp.machine) {
      machineListElem.classList.add('hidden');
    }
    else {
      machineListElem.appendChild(this.createDetailsListItem(
        'ROM not found.',
        MachineCompatibilityStatusEnum.UNKNOWN
      ));
      mainContentElem.classList.add('hidden');
    }
    
    // populate emulation details
    this.populateEmulationDetails(detailsRowElem, machineComp.emuComp);
    
    // populate video details
    this.populateVideoDetails(detailsRowElem, machineComp.videoComps, monitorConfigTitles);
    
    // populate controls details
    this.populateControlsDetails(detailsRowElem, machineComp.controlsComp);
    
    // data
    // attach event listener to show data link
    const modelinesDataElem = detailsRowElem.querySelector('.comp-table__details-row__data__modelines');
    const jsonDataElem      = detailsRowElem.querySelector('.comp-table__details-row__data__json');
    const showDataLinkElem  = detailsRowElem.querySelector('.comp-table__details-row__toggle-data-link');
    
    let jsonViewInit = false;
    
    showDataLinkElem.addEventListener('click', e => {
      e.preventDefault();
      const isShown = detailsRowElem.classList.toggle('comp-table__row--data-shown');
      
      if (isShown) {
        if (!jsonViewInit) {
          jsonView.format(this.getDetailsData(machineComp, monitorConfigTitles), jsonDataElem);
          jsonViewInit = true;
        }
      }
      else {
        modelinesDataElem.style.width = '';
        modelinesDataElem.style.height = '';
        jsonDataElem.style.width = '';
        jsonDataElem.style.height = '';
      }
    });
  }
  
  /**
   * 
   * @param {HTMLTableRowElement} detailsRowElem 
   * @param {EmulationCompatibility} emuComp 
   */
  populateEmulationDetails(detailsRowElem, emuComp) {
    const emuListElem = detailsRowElem.querySelector('.comp-table__details-row__list--emu');
    
    let text;
    if (emuComp.status === EmulationCompatibilityStatusEnum.PRELIMINARY) {
      text = 'Preliminary - An early driver exists. This often represents skeleton drivers under which most software will not run, though some systems may work a limited basis.';
    }
    else if (emuComp.status === EmulationCompatibilityStatusEnum.IMPERFECT) {
      text = 'Imperfect - Software may run under the driver, though some titles may run slowly or with problems. ';
    }
    else if (emuComp.status === EmulationCompatibilityStatusEnum.GOOD) {
      text = 'Good - Should run with little or no problems.';
    }
    else {
      text = 'Unable to check emulation compatability.';
    }
    
    emuListElem.appendChild(this.createDetailsListItem(
      text,
      emuToMachineCompatibilityStatus(emuComp.status)
    ));
  }
  
  /**
   * @param {HTMLTableRowElement} detailsRowElem 
   * @param {VideoCompatibility[]} videoComps
   * @param {string[]} monitorConfigTitles
   */
  populateVideoDetails(detailsRowElem, videoComps, monitorConfigTitles) {
    const controlsListElem = detailsRowElem.querySelector('.comp-table__details-row__list--video');
    
    for (let i = 0; i < monitorConfigTitles.length; ++i) {
      const monitorConfigTitle = monitorConfigTitles[i];
      const videoComp          = videoComps         [i];
      
      // create a header item if there are multiple monitor configurations
      if (videoComps.length > 1) {
        const text = `${monitorConfigTitle} (${videoComp.modelineConfig.preset} ${videoComp.modelineConfig.orientation}):`;
        
        const itemElem = this.createDetailsListItem(text);
        itemElem.classList.add('comp-table__details-row__list__item--header');
        controlsListElem.appendChild(itemElem);
      }
      
      
      let text = 'Unable to check video compatability.';
      
      const {modelineResult} = videoComp;
      if (modelineResult) {
        if (modelineResult.err) {
           text = 'Error checking video compatability.';
        }
        else if (!modelineResult.inRange) {
          text = 'Out of Range - This monitor is incapable of displaying this ROM in any way.';
        }
        else if (modelineResult.modeline.interlace) {
          text = 'Interlaced - Interlaced video modes flicker and cause other visual issues.';
        }
        else if (modelineResult.resStretch) {
          text = 'Fractional Scaling - The image is stretched unevenly and becomes distorted.';
        }
        else if (modelineResult.vfreqOff) {
          text = 'Vertical Frequency Off - This monitor is not able to match this ROM\'s refresh rate. This may cause significant tearing, sound issues, and/or the game running faster or slower.';
        }
        else if (
          //modelineResult.vDiff !== 0 ||
          videoComp.status === VideoCompatibilityStatusEnum.VFREQ_SLIGHTLY_OFF
        ) {
          text = 'Vertical Frequency Slightly Off - This monitor is not able to match this ROM\'s refresh rate exactly, but it can get close. This may cause slight tearing, sound issues, and/or the game running faster or slower.';
        }
        else if (
          //modelineResult.xScale !== 1 ||
          //modelineResult.yScale !== 1 ||
          videoComp.status === VideoCompatibilityStatusEnum.INT_SCALE
        ) {
          text = 'Integer Scaling - The image is scaled up evenly (2x, 3x, 4x, ...etc). The image is not distorted but multiple scanlines are present where only 1 was originally.';
        }
        else if (videoComp.status === VideoCompatibilityStatusEnum.UNSUPPORTED) {
          text = 'Unsupported - This monitor is incapable of displaying this ROM in any way.';
        }
        else if (videoComp.status === VideoCompatibilityStatusEnum.BAD) {
          text = 'Bad - This monitor has poor support for this ROM.';
        }
        else if (videoComp.status === VideoCompatibilityStatusEnum.NATIVE) {
          text = 'Native - This monitor supports the native resolution and refresh rate of this ROM.';
        }
      }
      
      controlsListElem.appendChild(this.createDetailsListItem(
        text,
        videoToMachineCompatibilityStatus(videoComp.status)
      ));
      
      const videoModelinesElem = detailsRowElem.querySelector('.comp-table__details-row__data__modelines');
      if (modelineResult) {
        videoModelinesElem.value = `${modelineResult.description}\n\n${(modelineResult.details || '').trim()}`;
      }
      else {
        videoModelinesElem.classList.add('hidden');
      }
    }
  }
  
  /**
   * @param {HTMLTableRowElement} detailsRowElem 
   * @param {ControlsCompatibility} controlsComp
   */
  populateControlsDetails(detailsRowElem, controlsComp) {
    const controlConfigComp = controlsComp.bestControlConfigComp;
    const controlsListElem = detailsRowElem.querySelector('.comp-table__details-row__list--controls');
    
    // check if control compatibility was able to be tested
    if (!controlConfigComp) {
      controlsListElem.appendChild(this.createDetailsListItem(
        'Unable to find control information for this ROM.',
        MachineCompatibilityStatusEnum.UNKNOWN
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
   * @returns {Object}
   */
  getDetailsData(machineComp, monitorConfigTitles) {
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
    
    return {
      machineNameInput: machineComp.machineNameInput,
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
        score : !machineComp.controlsComp.bestControlConfigComp? null : formatDetailsScore(machineComp.controlsComp.bestControlConfigComp.score),
        controlSetComps: !machineComp.controlsComp.bestControlConfigComp? [] : machineComp.controlsComp.bestControlConfigComp.controlSetComps.map(controlSetComp => ({
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
      controlsDatGame: machineComp.controlsComp.controlsDatGame || null,
      
      machine: machineComp.machine || null,
    };
    
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
