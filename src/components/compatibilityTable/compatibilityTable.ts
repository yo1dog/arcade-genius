import './compatibilityTable.less';
import {EventEmitter}                               from 'events';
import compTableTemplate                            from './compatibilityTable.html';
import compTableRowTemplate                         from './compatibilityTableRow.html';
import compatibilityTableRowDetailsListItemTemplate from './compatibilityTableRowDetailsListItem.html';
import pluralize                                    from '../../helpers/pluralize';
import stringifyEnums                               from '../../helpers/stringifyEnums';
import MultidimensionalScore                        from '../../multidimensionalScore';
import * as gameUtil                                from '../../gameUtil';
import {ICPConfiguration}                           from '../../types/controlPanel';
import {IMonitorConfiguration}                      from '../../types/monitor';
import jsonView                                     from 'lib/jsonview/jsonview.js';
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
  IGameCompatibility,
  OverallCompatibilityStatus,
  overallCompatibilityStatusEnum,
  emulationCompatibilityStatusEnum,
  videoCompatibilityStatusEnum
} from '../../types/compatibility';
import { IGameButton, IGameInput } from '../../types/game';


export default class CompatibilityTable extends EventEmitter {
  public readonly elem: HTMLElement;
  
  private readonly controlsStatusHeaderCellElem: HTMLTableHeaderCellElement;
  private readonly videoStatusHeaderCellElem   : HTMLTableHeaderCellElement;
  private readonly subHeaderRowElem            : HTMLElement;
  private readonly tableElem                   : HTMLTableElement;
  private readonly bodyElem                    : HTMLElement;
  private readonly refreshButtonElem           : HTMLButtonElement;
  
  
  public constructor() {
    super();
    
    this.elem = firstChildR(htmlToBlock(compTableTemplate));
    this.controlsStatusHeaderCellElem = selectR(this.elem, '.comp-table__header-row__controls-status', 'th');
    this.videoStatusHeaderCellElem    = selectR(this.elem, '.comp-table__header-row__video-status', 'th');
    this.subHeaderRowElem             = selectR(this.elem, '.comp-table__sub-header-row');
    this.tableElem                    = selectR(this.elem, '.comp-table__table', 'table');
    this.bodyElem                     = selectR(this.elem, '.comp-table__body');
    this.refreshButtonElem            = selectR(this.elem, '.comp-table__refresh-button', 'button');
    
    this.refreshButtonElem.addEventListener('click', () => this.refresh());
  }
  
  public async init():Promise<void> {
    // noop
  }
  
  public refresh():void {
    this.emit('refresh');
  }
  
  public update(
    gameComps     : IGameCompatibility[],
    cpConfigs     : ICPConfiguration[],
    monitorConfigs: IMonitorConfiguration[]
  ): void {
    // clear rows
    replaceChildren(this.bodyElem);
    
    // clear control panel config cells
    const oldCPConfigCellElems = selectAll(this.subHeaderRowElem, '.comp-table__sub-header-row__title--control-panel-configuration');
    for (let i = 1; i < oldCPConfigCellElems.length; ++i) {
      oldCPConfigCellElems[i].remove();
    }
    
    // create control panel config cells
    const newCPConfigCellElems = [
      oldCPConfigCellElems[0]
    ];
    while (newCPConfigCellElems.length < cpConfigs.length) {
      const lastCellElem = newCPConfigCellElems[newCPConfigCellElems.length - 1];
      const newCellElem = cloneElem(lastCellElem, true);
      lastCellElem.insertAdjacentElement('afterend', newCellElem);
      newCPConfigCellElems.push(newCellElem);
    }
    
    // set control panel config titles
    for (let i = 0; i < cpConfigs.length; ++i) {
      newCPConfigCellElems[i].innerText = cpConfigs[i].name || '<Unknown>';
    }
    
    this.tableElem.classList.toggle(
      'comp-table__table--single-control-panel-configuration',
      cpConfigs.length === 1
    );
    
    this.controlsStatusHeaderCellElem.colSpan = cpConfigs.length;
    this.controlsStatusHeaderCellElem.rowSpan = cpConfigs.length === 1? 2: 1;
    
    // clear monitor config cells
    const oldMonitorConfigCellElems = selectAll(this.subHeaderRowElem, '.comp-table__sub-header-row__title--monitor-configuration');
    for (let i = 1; i < oldMonitorConfigCellElems.length; ++i) {
      oldMonitorConfigCellElems[i].remove();
    }
    
    // create monitor config cells
    const newMonitorConfigCellElems = [
      oldMonitorConfigCellElems[0]
    ];
    while (newMonitorConfigCellElems.length < monitorConfigs.length) {
      const lastCellElem = newMonitorConfigCellElems[newMonitorConfigCellElems.length - 1];
      const newCellElem = cloneElem(lastCellElem, true);
      lastCellElem.insertAdjacentElement('afterend', newCellElem);
      newMonitorConfigCellElems.push(newCellElem);
    }
    
    // set monitor config titles
    for (let i = 0; i < monitorConfigs.length; ++i) {
      newMonitorConfigCellElems[i].innerText = monitorConfigs[i].name || '<Unknown>';
    }
    
    this.tableElem.classList.toggle(
      'comp-table__table--single-monitor-configuration',
      monitorConfigs.length === 1
    );
    
    this.videoStatusHeaderCellElem.colSpan = monitorConfigs.length;
    this.videoStatusHeaderCellElem.rowSpan = monitorConfigs.length === 1? 2: 1;
    
    // create rows
    for (let i = 0; i < gameComps.length; ++i) {
      const rowBlock = this.createRowBlock(gameComps[i], i, cpConfigs, monitorConfigs);
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
    gameComp      : IGameCompatibility,
    rowIndex      : number,
    cpConfigs     : ICPConfiguration[],
    monitorConfigs: IMonitorConfiguration[]
  ): DocumentFragment {
    const {game} = gameComp;
    const evenOddClass = `comp-table__row--${rowIndex % 2 === 0? 'odd' : 'even'}`;
    
    const rowBlock = htmlToBlock(compTableRowTemplate);
    
    // row
    const rowElem = selectR(rowBlock, '.comp-table__row');
    rowElem.classList.add(evenOddClass);
    
    const rowOverallStatus = (
      gameComp.knownOverallStatus.val <= overallCompatibilityStatusEnum.BAD.val
      ? gameComp.knownOverallStatus
      : gameComp.overallStatus
    );
    
    const rowOverallStatusTrans = this.translateOverallStatus(rowOverallStatus);
    rowElem.classList.add(rowOverallStatusTrans.cssClass);
    
    if (rowOverallStatus === overallCompatibilityStatusEnum.UNSUPPORTED) {
      rowElem.classList.add('comp-table__row--unsupported');
    }
    
    if (!game) {
      rowElem.classList.add('comp-table__row--invalid-game-name');
    }
    
    /*
    // game name
    selectR(rowBlock, '.comp-table__row__game-name'      ).classList.add(overallStatusTrans.cssClass);
    selectR(rowBlock, '.comp-table__row__game-name__icon').classList.add(overallStatusTrans.iconCSSClass);
    selectR(rowBlock, '.comp-table__row__game-name__text').innerText = (
      game
      ? game.name
      : gameComp.gameNameInput
    );
    */
   
    // game desc
    selectR(rowBlock, '.comp-table__row__desc'      ).classList.add(rowOverallStatusTrans.cssClass);
    selectR(rowBlock, '.comp-table__row__desc__icon').classList.add(rowOverallStatusTrans.iconCSSClass);
    selectR(rowBlock, '.comp-table__row__desc__text').innerText = (
      game
      ? game.shortDescription || game.description || game.name
      : gameComp.gameNameInput
    );
    
    // emulation status
    const emuStatusTrans = this.translateOverallStatus(emuToOverallCompatibilityStatus(gameComp.emuComp.status));
    selectR(rowBlock, '.comp-table__row__emu-status'      ).classList.add(emuStatusTrans.cssClass);
    selectR(rowBlock, '.comp-table__row__emu-status__icon').classList.add(emuStatusTrans.iconCSSClass);
    selectR(rowBlock, '.comp-table__row__emu-status__text').innerText = emuStatusTrans.desc;
    
    // controls status
    const controlsStatusCellElems = [selectR(rowBlock, '.comp-table__row__controls-status')];
    
    while (controlsStatusCellElems.length < cpConfigs.length) {
      const lastControlsStatusCellElem = controlsStatusCellElems[controlsStatusCellElems.length - 1];
      const newControlsStatusCellElem = cloneElem(lastControlsStatusCellElem, true);
      
      lastControlsStatusCellElem.insertAdjacentElement('afterend', newControlsStatusCellElem);
      controlsStatusCellElems.push(newControlsStatusCellElem);
    }
    
    for (let i = 0; i < cpConfigs.length; ++i) {
      const controlsComp = gameComp.controlsComps[i];
      const controlsStatusElem = controlsStatusCellElems[i];
      
      const controlsStatusTrans = this.translateOverallStatus(controlsToOverallCompatibilityStatus(controlsComp.status));
      controlsStatusElem.classList.add(controlsStatusTrans.cssClass);
      selectR(controlsStatusElem, '.comp-table__row__controls-status__icon').classList.add(controlsStatusTrans.iconCSSClass);
      selectR(controlsStatusElem, '.comp-table__row__controls-status__text').innerText = controlsStatusTrans.desc;
    }
    
    // video status
    const videoStatusCellElems = [selectR(rowBlock, '.comp-table__row__video-status')];
    
    while (videoStatusCellElems.length < monitorConfigs.length) {
      const lastVideoStatusCellElem = videoStatusCellElems[videoStatusCellElems.length - 1];
      const newVideoStatusCellElem = cloneElem(lastVideoStatusCellElem, true);
      
      lastVideoStatusCellElem.insertAdjacentElement('afterend', newVideoStatusCellElem);
      videoStatusCellElems.push(newVideoStatusCellElem);
    }
    
    for (let i = 0; i < monitorConfigs.length; ++i) {
      const videoComp = gameComp.videoComps[i];
      const videoStatusElem = videoStatusCellElems[i];
      
      const videoStatusTrans = this.translateOverallStatus(videoToOverallCompatibilityStatus(videoComp.status));
      videoStatusElem.classList.add(videoStatusTrans.cssClass);
      selectR(videoStatusElem, '.comp-table__row__video-status__icon').classList.add(videoStatusTrans.iconCSSClass);
      selectR(videoStatusElem, '.comp-table__row__video-status__text').innerText = videoStatusTrans.desc;
    }
    
    // details
    const detailsRowElem = selectR(rowBlock, '.comp-table__details-row', 'tr');
    detailsRowElem.classList.add(evenOddClass);
    this.populateDetailsRow(detailsRowElem, gameComp);
    
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
    detailsRowElem: HTMLTableRowElement,
    gameComp      : IGameCompatibility
  ):void {
    // expand cell to fill row
    const cellElem = selectR(detailsRowElem, 'td');
    cellElem.colSpan = (
      Array.from(this.tableElem.rows[0].cells)
      .reduce((p, c) => p + c.colSpan, 0)
    );
    
    const gameContentElem = selectR(detailsRowElem, '.comp-table__details-row__game-content');
    const mainContentElem = selectR(detailsRowElem, '.comp-table__details-row__main-content' );
    
    if (gameComp.game) {
      gameContentElem.classList.add('hidden');
    }
    else {
      mainContentElem.classList.add('hidden');
      
      const gameListElem     = selectR(gameContentElem, '.comp-table__details-row__list--game');
      const sugGameTableElem = selectR(gameContentElem, '.comp-table__details-row__game-suggestion-table', 'table');
      
      gameListElem.appendChild(this.createDetailsListItem(
        `ROM "${gameComp.gameNameInput}" not found. Did you mean one of these?`,
        overallCompatibilityStatusEnum.UNKNOWN
      ));
      
      const gameSuggestions = gameUtil.getGameSuggestions(gameComp.gameNameInput, 10);
      
      for (const gameSuggestion of gameSuggestions) {
        const rowElem = sugGameTableElem.insertRow();
        
        const nameCellElem = rowElem.insertCell();
        nameCellElem.classList.add('comp-table__details-row__game-suggestion-table__name');
        nameCellElem.innerText = gameSuggestion.game.name;
        
        const descCellElem = rowElem.insertCell();
        descCellElem.classList.add('comp-table__details-row__game-suggestion-table__desc');
        descCellElem.innerText = gameSuggestion.game.description;
      }
    }
    
    // populate emulation details
    this.populateEmulationDetails(detailsRowElem, gameComp);
    
    // populate video details
    this.populateVideoDetails(detailsRowElem, gameComp);
    
    // populate controls details
    this.populateControlsDetails(detailsRowElem, gameComp);
    
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
          jsonView.format(this.getDetailsData(gameComp), jsonDataElem);
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
    gameComp      : IGameCompatibility
  ):void {
    const emuComp = gameComp.emuComp;
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
    detailsRowElem: HTMLTableRowElement,
    gameComp      : IGameCompatibility
  ):void {
    const videoComps = gameComp.videoComps;
    const controlsListElem = selectR(detailsRowElem, '.comp-table__details-row__list--video');
    
    for (const videoComp of videoComps) {
      const monitorConfig = videoComp.monitorConfig;
      const modelineCalc  = videoComp.modelineCalc;
      
      // create a header item if there are multiple monitor configurations
      if (videoComps.length > 1) {
        const text = `${monitorConfig.name || '<Unknown>'} (${monitorConfig.modelineConfig.preset} ${monitorConfig.modelineConfig.orientation.toString().toLowerCase()}):`;
        
        const itemElem = this.createDetailsListItem(text);
        itemElem.classList.add('comp-table__details-row__list__item--header');
        controlsListElem.appendChild(itemElem);
      }
      
      
      let text = 'Unable to check video compatability.';
      
      if (modelineCalc) {
        if (!modelineCalc.success) {
           text = 'Error checking video compatability.';
        }
        else if (!modelineCalc.modelineResult.inRange) {
          text = 'Out of Range - This monitor is incapable of displaying this game in any way.';
        }
        else if (modelineCalc.modelineResult.modeline.interlace) {
          text = 'Interlaced - Interlaced video modes flicker and cause other visual issues.';
        }
        else if (modelineCalc.modelineResult.resStretch) {
          text = 'Fractional Scaling - The image is stretched unevenly and becomes distorted.';
        }
        else if (modelineCalc.modelineResult.vfreqOff) {
          text = 'Vertical Frequency Off - This monitor is not able to match this game\'s refresh rate. This may cause significant tearing, sound issues, and/or the game running faster or slower.';
        }
        else if (
          //modelineResult.vDiff !== 0 ||
          videoComp.status === videoCompatibilityStatusEnum.VFREQ_SLIGHTLY_OFF
        ) {
          text = 'Vertical Frequency Slightly Off - This monitor is not able to match this game\'s refresh rate exactly, but it can get close. This may cause slight tearing, sound issues, and/or the game running faster or slower.';
        }
        else if (
          //modelineResult.xScale !== 1 ||
          //modelineResult.yScale !== 1 ||
          videoComp.status === videoCompatibilityStatusEnum.INT_SCALE
        ) {
          text = 'Integer Scaling - The image is scaled up evenly (2x, 3x, 4x, ...etc). The image is not distorted but multiple scanlines are present where only 1 was originally.';
        }
        else if (videoComp.status === videoCompatibilityStatusEnum.UNSUPPORTED) {
          text = 'Unsupported - This monitor is incapable of displaying this game in any way.';
        }
        else if (videoComp.status === videoCompatibilityStatusEnum.BAD) {
          text = 'Bad - This monitor has poor support for this game.';
        }
        else if (videoComp.status === videoCompatibilityStatusEnum.NATIVE) {
          text = 'Native - This monitor supports the native resolution and refresh rate of this game.';
        }
      }
      
      controlsListElem.appendChild(this.createDetailsListItem(
        text,
        videoToOverallCompatibilityStatus(videoComp.status)
      ));
      
      const videoModelinesTableElem = selectR(detailsRowElem, '.comp-table__details-row__data__modelines-table');
      
      if (modelineCalc && modelineCalc.success) {
        selectR(detailsRowElem, '.comp-table__details-row__data__modelines-table__value--desc').innerText = (
          (modelineCalc.modelineResult.description || '').trim()
        );
        selectR(detailsRowElem, '.comp-table__details-row__data__modelines-table__value--result').innerText = (
          (modelineCalc.modelineResult.details || '').trim()
        );
        selectR(detailsRowElem, '.comp-table__details-row__data__modelines-table__value--modeline').innerText = (
          (modelineCalc.modelineResult.modelineStr || '').trim()
        );
      }
      else {
        videoModelinesTableElem.classList.add('hidden');
      }
    }
  }
  
  private populateControlsDetails(
    detailsRowElem: HTMLTableRowElement,
    gameComp      : IGameCompatibility
  ): void {
    if (!gameComp.game) {
      return;
    }
    
    const controlsComps = gameComp.controlsComps;
    const controlsListElem = selectR(detailsRowElem, '.comp-table__details-row__list--controls');
    
    // check we have control information for the game
    if (!gameComp.game.controlInfo) {
      controlsListElem.appendChild(this.createDetailsListItem(
        'Unable to find control information for this game.',
        overallCompatibilityStatusEnum.UNKNOWN
      ));
      return;
    }
    
    for (const controlsComp of controlsComps) {
      // create a header item if there are multiple control panel configurations
      if (controlsComps.length > 1) {
        const text = `${controlsComp.cpConfig.name || '<Unknown>'}:`;
        
        const itemElem = this.createDetailsListItem(text);
        itemElem.classList.add('comp-table__details-row__list__item--header');
        controlsListElem.appendChild(itemElem);
      }
      
      const controlConfigComp = controlsComp.bestControlConfigComp;
      
      // check if control compatibility was able to be tested
      if (!controlConfigComp) {
        controlsListElem.appendChild(this.createDetailsListItem(
          'Unable to check control compatability.',
          overallCompatibilityStatusEnum.UNKNOWN
        ));
        continue;
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
          
          /*
          const gameControlLabels = [];
          for (const gameInput of controlComp.gameControl.outputToInputMap.values()) {
            if (!gameInput) continue;
            if (gameInput.label   ) gameControlLabels.push(gameInput.label   );
            if (gameInput.posLabel) gameControlLabels.push(gameInput.posLabel);
            if (gameInput.negLabel) gameControlLabels.push(gameInput.negLabel);
          }
          const gameControlLabelsStr = gameControlLabels.length > 0? `(${gameControlLabels.join('/')})` : '';
          */
          
          const gameControlDesc = controlComp.gameControl.controlDef.name;
          const gameControlButtonsDesc = `with ${pluralize(controlComp.gameControl.buttons.length, 'button', 'buttons', ' ')}`;
          
          const cpControlDesc = controlComp.cpControl? `${controlComp.cpControl.controlDef.name} (${controlComp.cpControl.name})` : '×';
          const cpControlButtonsDesc = controlComp.cpControl? `with ${pluralize(controlComp.cpControl.numButtons, 'button', 'buttons', ' ')}` : '';
          
          const text = [
            gameControlDesc,
            showControlButtonsDescs? gameControlButtonsDesc : '',
            //gameControlLabelsStr,
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
          /*
          const gameButtonLabels = (
            buttonsComp.gameButtons
            .map(x => x.input.label)
            .filter(x => x)
          );
          const gameButtonLabelsStr = gameButtonLabels.length > 0? `(${gameButtonLabels.join('/')})` : '';
          */
          
          const gameButtonsDesc = pluralize(buttonsComp.gameButtons.length, 'button', 'buttons', ' ');
          
          const cpButtonsDesc = (
            buttonsComp.cpButtonCluster
            ? `${pluralize(buttonsComp.cpButtonCluster.numButtons, 'button', 'buttons', ' ')} (${buttonsComp.cpButtonCluster.name})`
            : '×'
          );
          
          const text = [
            gameButtonsDesc,
            //gameButtonLabelsStr
            '→',
            cpButtonsDesc
          ].join(' ');
          const overallStatus = controlsToOverallCompatibilityStatus(buttonsComp.status);
          
          const itemElem = this.createDetailsListItem(text, overallStatus);
          itemElem.classList.add(...itemClasses);
          controlsListElem.appendChild(itemElem);
        }
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
    
    if (overallStatus === undefined) {
      iconElem.classList.add('hidden');
    }
    else {
      const {iconCSSClass} = this.translateOverallStatus(overallStatus);
      iconElem.classList.add(iconCSSClass);
    }
    
    return itemElem;
  }
  
  private getDetailsData(gameComp: IGameCompatibility): any { // eslint-disable-line @typescript-eslint/no-explicit-any
    return stringifyEnums({
      gameNameInput: gameComp.gameNameInput,
      status: gameComp.overallStatus,
      
      emuComp: {
        status: gameComp.emuComp.status
      },
      
      videoComps: gameComp.videoComps.map(videoComp => (
        !videoComp? undefined : {
          status: videoComp.status,
          monitorConfig: videoComp.monitorConfig,
          modelineCalc: videoComp.modelineCalc
        }
      )),
      
      controlsComps: gameComp.controlsComps.map(controlsComp => ({
        status: controlsComp.status,
        score : !controlsComp.bestControlConfigComp? undefined : formatDetailsScore(controlsComp.bestControlConfigComp.score),
        controlSetComps: !controlsComp.bestControlConfigComp? [] : controlsComp.bestControlConfigComp.controlSetComps.map(controlSetComp => ({
          status: controlSetComp.status,
          score: formatDetailsScore(controlSetComp.score),
          gameControlSet: {
            supportedPlayerNums: controlSetComp.gameControlSet.supportedPlayerNums.join(','),
            isOnOppositeScreenSide: controlSetComp.gameControlSet.isOnOppositeScreenSide,
            isRequired: controlSetComp.gameControlSet.isRequired
          },
          controlComps: controlSetComp.controlComps.map(controlComp => ({
            controlStatus: controlComp.controlStatus,
            buttonsStatus: controlComp.buttonsStatus,
            status: controlComp.status,
            score: formatDetailsScore(controlComp.score),
            gameControl: {
              type: controlComp.gameControl.controlDef.type,
              buttons: controlComp.gameControl.buttons.map(gameButton => 
                gameButton.input.label    ||
                gameButton.input.posLabel ||
                gameButton.input.negLabel ||
                (gameButton.controlsDatButton && gameButton.controlsDatButton.input.mameInputPort) ||
                gameButton.descriptor
              )
            },
            cpControl: !controlComp.cpControl? undefined : {
              type: controlComp.cpControl.controlDef.type,
              numButtons: controlComp.cpControl.numButtons
            }
          })),
          buttonsComp: {
            status: controlSetComp.buttonsComp.status,
            score: formatDetailsScore(controlSetComp.buttonsComp.score),
            gameButtons: controlSetComp.buttonsComp.gameButtons.map(gameButton => 
              gameButton.input.label    ||
              gameButton.input.posLabel ||
              gameButton.input.negLabel ||
              (gameButton.controlsDatButton && gameButton.controlsDatButton.input.mameInputPort) ||
              gameButton.descriptor
            ),
            cpButtonCluster: !controlSetComp.buttonsComp.cpButtonCluster? undefined : {
              name: controlSetComp.buttonsComp.cpButtonCluster.name,
              numButtons: controlSetComp.buttonsComp.cpButtonCluster.numButtons
            }
          }
        }))
      })),
      game: gameComp.game? {
        name            : gameComp.game.name,
        description     : gameComp.game.description,
        cloneOfGameName : gameComp.game.cloneOfGame? gameComp.game.cloneOfGame.name : undefined,
        displays: gameComp.game.displays.map(gameDisplay => ({
          type    : gameDisplay.type,
          rotation: gameDisplay.rotation.val,
          flipx   : gameDisplay.flipx,
          refresh : gameDisplay.refresh,
          width   : gameDisplay.width,
          height  : gameDisplay.height
        })),
        controlInfo: gameComp.game.controlInfo? {
          numPlayers     : gameComp.game.controlInfo.numPlayers,
          alternatesTurns: gameComp.game.controlInfo.alternatesTurns,
          controlConfigs : gameComp.game.controlInfo.controlConfigs.map(gameControlConfig => ({
            targetCabinetType: gameControlConfig.targetCabinetType,
            menuButtons      : gameControlConfig.menuButtons.map(formatGameButton),
            controlSets      : gameControlConfig.controlSets.map(gameControlSet => ({
              supportedPlayerNums   : gameControlSet.supportedPlayerNums.join(','),
              isRequired            : gameControlSet.isRequired,
              isOnOppositeScreenSide: gameControlSet.isOnOppositeScreenSide,
              controlPanelButtons   : gameControlSet.controlPanelButtons.map(formatGameButton),
              controls              : gameControlSet.controls.map(gameControl => ({
                controlDef: gameControl.controlDef,
                descriptor: gameControl.descriptor,
                buttons   : gameControl.buttons.map(formatGameButton),
                outputToInputMap: Object.fromEntries(Array.from(gameControl.outputToInputMap.entries()).map(([key, gameInput]) => ([
                  key,
                  gameInput? formatGameInput(gameInput): undefined
                ])))
              }))
            }))
          }))
        }: undefined
      }: undefined
    });
    
    function formatDetailsScore(
      score    : MultidimensionalScore,
      obj      : {[key:string]: number} = {},
      keyPrefix: string = ''
    ): {[key:string]: number} {
      if (!score) return score;
      
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
    
    function formatGameButton(gameButton: IGameButton): object {
      return {
        descriptor: gameButton.descriptor,
        input: formatGameInput(gameButton.input)
      };
    }
    
    function formatGameInput(gameInput: IGameInput): object {
      return {
        isAnalog: gameInput.isAnalog,
        label   : gameInput.label,
        negLabel: gameInput.negLabel,
        posLabel: gameInput.posLabel
      };
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
    }[overallStatus.val] || overallStatus.label;
    
    return {
      cssClass: `comp-table--${cssClassSuffix}`,
      iconCSSClass: `comp-table__icon--${cssClassSuffix}`,
      desc
    };
  }
}
