import './compatibilityTable.less';
import {EventEmitter}                               from 'events';
import compTableTemplate                            from './compatibilityTable.html';
import compTableRowTemplate                         from './compatibilityTableRow.html';
import compatibilityTableRowDetailsListItemTemplate from './compatibilityTableRowDetailsListItem.html';
import pluralize                                    from '../../helpers/pluralize';
import MultidimensionalScore                        from '../../multidimensionalScore';
import * as mameUtil                                from '../../dataAccess/mameUtil';
import jsonView from 'lib/jsonview/jsonview.js';
import {
  htmlToBlock,
  selectR,
  selectAll,
  firstChildR,
  cloneElem,
  replaceChildren
} from '../../helpers/htmlUtil';
import {
  emuToOverallCompatibilityStatus,
  controlsToOverallCompatibilityStatus,
  videoToOverallCompatibilityStatus,
} from '../../compatibilityUtil';
import {
  IMachineCompatibility,
  IEmulationCompatibility,
  IVideoCompatibility,
  IControlsCompatibility,
  OverallCompatibilityStatus,
  overallCompatibilityStatusEnum,
  emulationCompatibilityStatusEnum,
  videoCompatibilityStatusEnum,
  controlsCompatibilityStatusEnum
} from '../../types/compatibility';


export default class CompatibilityTable extends EventEmitter {
  public readonly elem: HTMLElement;
  
  private readonly videoStatusHeaderCellElem : HTMLTableHeaderCellElement;
  private readonly monitorConfigHeaderRowElem: HTMLElement;
  private readonly tableElem                 : HTMLTableElement;
  private readonly bodyElem                  : HTMLElement;
  private readonly refreshButtonElem         : HTMLButtonElement;
  
  
  public constructor() {
    super();
    
    this.elem = firstChildR(htmlToBlock(compTableTemplate));
    this.videoStatusHeaderCellElem  = selectR(this.elem, '.comp-table__header-row__video-status', 'th');
    this.monitorConfigHeaderRowElem = selectR(this.elem, '.comp-table__monitor-configs-header-row');
    this.tableElem                  = selectR(this.elem, '.comp-table__table', 'table');
    this.bodyElem                   = selectR(this.elem, '.comp-table__body');
    this.refreshButtonElem          = selectR(this.elem, '.comp-table__refresh-button', 'button');
    
    this.refreshButtonElem.addEventListener('click', () => this.refresh());
  }
  
  public async init():Promise<void> {
    // noop
  }
  
  public refresh():void {
    this.emit('refresh');
  }
  
  public update(machineComps:IMachineCompatibility[], monitorConfigTitles:string[]):void {
    // clear rows
    replaceChildren(this.bodyElem);
    
    // clear monitor config cells
    const oldMonitorConfigCellElems = selectAll(this.monitorConfigHeaderRowElem, '.comp-table__monitor-configs-header-row__title');
    for (let i = 1; i < oldMonitorConfigCellElems.length; ++i) {
      oldMonitorConfigCellElems[i].remove();
    }
    
    // create monitor config cells
    const newMonitorConfigCellElems = [
      oldMonitorConfigCellElems[0]
    ];
    while (newMonitorConfigCellElems.length < monitorConfigTitles.length) {
      newMonitorConfigCellElems.push(
        this.monitorConfigHeaderRowElem.appendChild(
          cloneElem(newMonitorConfigCellElems[0], true)
        )
      );
    }
    
    // set monitor config titles
    for (let i = 0; i < monitorConfigTitles.length; ++i) {
      newMonitorConfigCellElems[i].innerText = monitorConfigTitles[i];
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
  
  public enableRefresh():void {
    this.refreshButtonElem.disabled = false;
  }
  public disableRefresh():void {
    this.refreshButtonElem.disabled = true;
  }
  
  private createRowBlock(
    machineComp        : IMachineCompatibility,
    rowIndex           : number,
    monitorConfigTitles: string[]
  ): DocumentFragment {
    const {machine} = machineComp;
    const evenOddClass = `comp-table__row--${rowIndex % 2 === 0? 'odd' : 'even'}`;
    
    const rowBlock = htmlToBlock(compTableRowTemplate);
    
    // row
    const rowElem = selectR(rowBlock, '.comp-table__row');
    rowElem.classList.add(evenOddClass);
    
    const rowOverallStatus = (
      machineComp.knownOverallStatus.val <= overallCompatibilityStatusEnum.BAD.val
      ? machineComp.knownOverallStatus
      : machineComp.overallStatus
    );
    
    const rowOverallStatusTrans = this.translateOverallStatus(rowOverallStatus);
    rowElem.classList.add(rowOverallStatusTrans.cssClass);
    
    if (rowOverallStatus === overallCompatibilityStatusEnum.UNSUPPORTED) {
      rowElem.classList.add('comp-table__row--unsupported');
    }
    
    if (!machine) {
      rowElem.classList.add('comp-table__row--invalid-machine-name');
    }
    
    /*
    // machine name
    selectR(rowBlock, '.comp-table__row__machine-name'      ).classList.add(overallStatusTrans.cssClass);
    selectR(rowBlock, '.comp-table__row__machine-name__icon').classList.add(overallStatusTrans.iconCSSClass);
    selectR(rowBlock, '.comp-table__row__machine-name__text').innerText = (
      machine
      ? machine.name
      : machineComp.machineNameInput
    );
    */
   
    // machine desc
    selectR(rowBlock, '.comp-table__row__desc'      ).classList.add(rowOverallStatusTrans.cssClass);
    selectR(rowBlock, '.comp-table__row__desc__icon').classList.add(rowOverallStatusTrans.iconCSSClass);
    selectR(rowBlock, '.comp-table__row__desc__text').innerText = (
      machine
      ? this.shortenDescription(machine.description)
      : machineComp.machineNameInput
    );
    
    // emulation status
    const emuStatusTrans = this.translateOverallStatus(emuToOverallCompatibilityStatus(machineComp.emuComp.status));
    selectR(rowBlock, '.comp-table__row__emu-status'      ).classList.add(emuStatusTrans.cssClass);
    selectR(rowBlock, '.comp-table__row__emu-status__icon').classList.add(emuStatusTrans.iconCSSClass);
    selectR(rowBlock, '.comp-table__row__emu-status__text').innerText = emuStatusTrans.desc;
    
    // controls status
    const controlsStatusTrans = this.translateOverallStatus(controlsToOverallCompatibilityStatus(machineComp.controlsComp.status));
    selectR(rowBlock, '.comp-table__row__controls-status'      ).classList.add(controlsStatusTrans.cssClass);
    selectR(rowBlock, '.comp-table__row__controls-status__icon').classList.add(controlsStatusTrans.iconCSSClass);
    selectR(rowBlock, '.comp-table__row__controls-status__text').innerText = controlsStatusTrans.desc;
    
    // video status
    const videoStatusCellElems = [selectR(rowBlock, '.comp-table__row__video-status')];
    
    while (videoStatusCellElems.length < monitorConfigTitles.length) {
      const lastVideoStatusCellElem = videoStatusCellElems[videoStatusCellElems.length - 1];
      const newVideoStatusCellElem = cloneElem(lastVideoStatusCellElem, true);
      
      lastVideoStatusCellElem.insertAdjacentElement('afterend', newVideoStatusCellElem);
      videoStatusCellElems.push(newVideoStatusCellElem);
    }
    
    for (let i = 0; i < monitorConfigTitles.length; ++i) {
      const videoComp = machineComp.videoComps[i];
      const videoStatusElem = videoStatusCellElems[i];
      
      const videoStatusTrans = this.translateOverallStatus(videoToOverallCompatibilityStatus(videoComp.status));
      videoStatusElem.classList.add(videoStatusTrans.cssClass);
      selectR(videoStatusElem, '.comp-table__row__video-status__icon').classList.add(videoStatusTrans.iconCSSClass);
      selectR(videoStatusElem, '.comp-table__row__video-status__text').innerText = videoStatusTrans.desc;
    }
    
    // details
    const detailsRowElem = selectR(rowBlock, '.comp-table__details-row', 'tr');
    detailsRowElem.classList.add(evenOddClass);
    this.populateDetailsRow(detailsRowElem, machineComp, monitorConfigTitles);
    
    const spacerRows = Array.from(rowBlock.querySelectorAll('.comp-table__spacer-row'));
    
    // attach event listener to toggle details button
    const toggleDetailsButtonElem = selectR(rowBlock, '.comp-table__row__toggle-details-button');
    toggleDetailsButtonElem.addEventListener('click', () => {
      const isShown = detailsRowElem.classList.toggle('comp-table__row--details-shown');
      
      for (const elem of [rowElem, ...spacerRows]) {
        elem.classList.toggle('comp-table__row--details-shown', isShown);
      }
    });
    
    return rowBlock;
  }
  
  private populateDetailsRow(
    detailsRowElem     : HTMLTableRowElement,
    machineComp        : IMachineCompatibility,
    monitorConfigTitles: string[]
  ):void {
    // expand cell to fill row
    const cellElem = selectR(detailsRowElem, 'td');
    cellElem.colSpan = (
      Array.from(this.tableElem.rows[0].cells)
      .reduce((p, c) => p + c.colSpan, 0)
    );
    
    const machineListElem = selectR(detailsRowElem, '.comp-table__details-row__list--machine');
    const mainContentElem = selectR(detailsRowElem, '.comp-table__details-row__main-content' );
    
    if (machineComp.machine) {
      machineListElem.classList.add('hidden');
    }
    else {
      machineListElem.appendChild(this.createDetailsListItem(
        `ROM not found. Did you mean one of these?:`,
        overallCompatibilityStatusEnum.UNKNOWN
      ));
      
      const machineNameSuggestions = mameUtil.getMachineNameSuggestions(
        machineComp.machineNameInput.replace(/s+/g, ''),
        5
      );
      
      for (const machineNameSuggestion of machineNameSuggestions) {
        const itemElem = this.createDetailsListItem(machineNameSuggestion);
        itemElem.classList.add('comp-table__details-row__list__item--suggested-machine-names-list');
        machineListElem.appendChild(itemElem);
      }
      
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
    const jsonDataElem      = selectR(detailsRowElem, '.comp-table__details-row__data__json'      );
    const showDataLinkElem  = selectR(detailsRowElem, '.comp-table__details-row__toggle-data-link');
    
    let jsonViewInit = false;
    
    showDataLinkElem.addEventListener('click', e => {
      e.preventDefault();
      const isShown = detailsRowElem.classList.toggle('comp-table__row--data-shown');
      
      if (isShown) {
        if (!jsonViewInit) {
          jsonView.format(this.getDetailsData(machineComp), jsonDataElem);
          jsonViewInit = true;
        }
      }
      else {
        jsonDataElem.style.width = '';
        jsonDataElem.style.height = '';
      }
    });
  }
  
  private populateEmulationDetails(
    detailsRowElem: HTMLTableRowElement,
    emuComp       : IEmulationCompatibility
  ):void {
    const emuListElem = selectR(detailsRowElem, '.comp-table__details-row__list--emu');
    
    let text;
    if (emuComp.status === emulationCompatibilityStatusEnum.PRELIMINARY) {
      text = 'Preliminary - An early driver exists. This often represents skeleton drivers under which most software will not run, though some systems may work a limited basis.';
    }
    else if (emuComp.status === emulationCompatibilityStatusEnum.IMPERFECT) {
      text = 'Imperfect - Software may run under the driver, though some titles may run slowly or with problems. ';
    }
    else if (emuComp.status === emulationCompatibilityStatusEnum.GOOD) {
      text = 'Good - Should run with little or no problems.';
    }
    else {
      text = 'Unable to check emulation compatability.';
    }
    
    emuListElem.appendChild(this.createDetailsListItem(
      text,
      emuToOverallCompatibilityStatus(emuComp.status)
    ));
  }
  
  private populateVideoDetails(
    detailsRowElem     : HTMLTableRowElement,
    videoComps         : IVideoCompatibility[],
    monitorConfigTitles: string[]
  ):void {
    const controlsListElem = selectR(detailsRowElem, '.comp-table__details-row__list--video');
    
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
          videoComp.status === videoCompatibilityStatusEnum.VFREQ_SLIGHTLY_OFF
        ) {
          text = 'Vertical Frequency Slightly Off - This monitor is not able to match this ROM\'s refresh rate exactly, but it can get close. This may cause slight tearing, sound issues, and/or the game running faster or slower.';
        }
        else if (
          //modelineResult.xScale !== 1 ||
          //modelineResult.yScale !== 1 ||
          videoComp.status === videoCompatibilityStatusEnum.INT_SCALE
        ) {
          text = 'Integer Scaling - The image is scaled up evenly (2x, 3x, 4x, ...etc). The image is not distorted but multiple scanlines are present where only 1 was originally.';
        }
        else if (videoComp.status === videoCompatibilityStatusEnum.UNSUPPORTED) {
          text = 'Unsupported - This monitor is incapable of displaying this ROM in any way.';
        }
        else if (videoComp.status === videoCompatibilityStatusEnum.BAD) {
          text = 'Bad - This monitor has poor support for this ROM.';
        }
        else if (videoComp.status === videoCompatibilityStatusEnum.NATIVE) {
          text = 'Native - This monitor supports the native resolution and refresh rate of this ROM.';
        }
      }
      
      controlsListElem.appendChild(this.createDetailsListItem(
        text,
        videoToOverallCompatibilityStatus(videoComp.status)
      ));
      
      const videoModelinesTableElem = selectR(detailsRowElem, '.comp-table__details-row__data__modelines-table');
      
      if (modelineResult) {
        selectR(detailsRowElem, '.comp-table__details-row__data__modelines-table__value--desc').innerText = (
          (modelineResult.description || '').trim()
        );
        selectR(detailsRowElem, '.comp-table__details-row__data__modelines-table__value--result').innerText = (
          (modelineResult.details || '').trim()
        );
        selectR(detailsRowElem, '.comp-table__details-row__data__modelines-table__value--modeline').innerText = (
          (modelineResult.modelineStr || '').trim()
        );
      }
      else {
        videoModelinesTableElem.classList.add('hidden');
      }
    }
  }
  
  private populateControlsDetails(
    detailsRowElem: HTMLTableRowElement,
    controlsComp  : IControlsCompatibility
  ): void {
    const controlConfigComp = controlsComp.bestControlConfigComp;
    const controlsListElem = selectR(detailsRowElem, '.comp-table__details-row__list--controls');
    
    // check if control compatibility was able to be tested
    if (!controlConfigComp) {
      controlsListElem.appendChild(this.createDetailsListItem(
        'Unable to find control information for this ROM.',
        overallCompatibilityStatusEnum.UNKNOWN
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
        const overallStatus = controlsToOverallCompatibilityStatus(controlSetComp.status);
        
        const itemElem = this.createDetailsListItem(text, overallStatus);
        itemElem.classList.add(...itemClasses);
        itemElem.classList.add('comp-table__details-row__list__item--header');
        controlsListElem.appendChild(itemElem);
      }
      
      
      // add a list item for each control compatibility
      for (const controlComp of controlSetComp.controlComps) {
        const showControlButtonsDescs = controlComp.gameControl.buttons.length > 0;
        
        const gameControlDesc = controlComp.gameControl.controlDef.name;
        const gameControlButtonsDesc = `with ${pluralize(controlComp.gameControl.buttons.length, 'button', 'buttons', ' ')}`;
        
        const cpControlDesc = controlComp.cpControl? `${controlComp.cpControl.controlDef.name} (${controlComp.cpControl.name})` : '×';
        const cpControlButtonsDesc = controlComp.cpControl? `with ${pluralize(controlComp.cpControl.numButtons, 'button', 'buttons', ' ')}` : '';
        
        const text = [
          gameControlDesc,
          showControlButtonsDescs? gameControlButtonsDesc : '',
          '→',
          cpControlDesc,
          showControlButtonsDescs? cpControlButtonsDesc : ''
        ].join(' ');
        const overallStatus = controlsToOverallCompatibilityStatus(controlComp.status);
        
        const itemElem = this.createDetailsListItem(text, overallStatus);
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
        const overallStatus = controlsToOverallCompatibilityStatus(buttonsComp.status);
        
        const itemElem = this.createDetailsListItem(text, overallStatus);
        itemElem.classList.add(...itemClasses);
        controlsListElem.appendChild(itemElem);
      }
    }
  }
  
  private createDetailsListItem(
    text          : string,
    overallStatus?: OverallCompatibilityStatus
  ): HTMLElement {
    const itemElem = firstChildR(htmlToBlock(compatibilityTableRowDetailsListItemTemplate));
    const textElem = selectR(itemElem, '.comp-table__details-row__list__item__text');
    const iconElem = selectR(itemElem, '.comp-table__details-row__list__item__icon');
    
    textElem.innerText = text;
    
    if (typeof overallStatus === 'undefined') {
      iconElem.classList.add('hidden');
    }
    else {
      const {iconCSSClass} = this.translateOverallStatus(overallStatus);
      iconElem.classList.add(iconCSSClass);
    }
    
    return itemElem;
  }
  
  private getDetailsData(machineComp: IMachineCompatibility): any { // eslint-disable-line @typescript-eslint/no-explicit-any
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
      status: overallCompatibilityStatusEnum.getLabel(machineComp.overallStatus),
      
      emuComp: {
        status: emulationCompatibilityStatusEnum.getLabel(machineComp.emuComp.status)
      },
      
      videoComps: machineComp.videoComps.map((videoComp, i) => (
        !videoComp? null : {
          status: videoCompatibilityStatusEnum.getLabel(videoComp.status),
          modelineConfig: videoComp.modelineConfig,
          modelineResult: videoComp.modelineResult,
        }
      )),
      
      controlsComp: {
        status: controlsCompatibilityStatusEnum.getLabel(machineComp.controlsComp.status),
        score : !machineComp.controlsComp.bestControlConfigComp? null : formatDetailsScore(machineComp.controlsComp.bestControlConfigComp.score),
        controlSetComps: !machineComp.controlsComp.bestControlConfigComp? [] : machineComp.controlsComp.bestControlConfigComp.controlSetComps.map(controlSetComp => ({
          status: controlsCompatibilityStatusEnum.getLabel(controlSetComp.status),
          score: formatDetailsScore(controlSetComp.score),
          gameControlSet: {
            supportedPlayerNums: controlSetComp.gameControlSet.supportedPlayerNums.join(','),
            isOnOppositeScreenSide: controlSetComp.gameControlSet.isOnOppositeScreenSide,
            isRequired: controlSetComp.gameControlSet.isRequired
          },
          controlComps: controlSetComp.controlComps.map(controlComp => ({
            controlStatus: controlsCompatibilityStatusEnum.getLabel(controlComp.controlStatus),
            buttonsStatus: controlsCompatibilityStatusEnum.getLabel(controlComp.buttonsStatus),
            status: controlsCompatibilityStatusEnum.getLabel(controlComp.status),
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
            status: controlsCompatibilityStatusEnum.getLabel(controlSetComp.buttonsComp.status),
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
    
    function formatDetailsScore(
      score    : MultidimensionalScore,
      obj      : {[key:string]: number} = {},
      keyPrefix: string = ''
    ): {[key:string]: number} {
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
  
  private translateOverallStatus(overallStatus:OverallCompatibilityStatus) {
    const cssClassSuffix = {
      [overallCompatibilityStatusEnum.UNKNOWN    .val]: 'unknown',
      [overallCompatibilityStatusEnum.UNSUPPORTED.val]: 'error',
      [overallCompatibilityStatusEnum.BAD        .val]: 'error',
      [overallCompatibilityStatusEnum.OK         .val]: 'warn',
      [overallCompatibilityStatusEnum.GOOD       .val]: 'good',
      [overallCompatibilityStatusEnum.NATIVE     .val]: 'good',
    }[overallStatus.val] || 'unknown';
    
    const desc = {
      [overallCompatibilityStatusEnum.UNKNOWN    .val]: 'Unknown',
      [overallCompatibilityStatusEnum.UNSUPPORTED.val]: 'Unuspported',
      [overallCompatibilityStatusEnum.BAD        .val]: 'Bad',
      [overallCompatibilityStatusEnum.OK         .val]: 'OK',
      [overallCompatibilityStatusEnum.GOOD       .val]: 'Good',
      [overallCompatibilityStatusEnum.NATIVE     .val]: 'Native',
    }[overallStatus.val] || overallCompatibilityStatusEnum.getLabel(overallStatus);
    
    return {
      cssClass: `comp-table--${cssClassSuffix}`,
      iconCSSClass: `comp-table__icon--${cssClassSuffix}`,
      desc
    };
  }
  
  private shortenDescription(description: string): string {
    return description.replace(/\(.+\)/g, '').trim();
  }
}
