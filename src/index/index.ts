import './index.less';
import * as preload             from './preload';
import * as modelineCaculator   from '../modelineCalculator';
import * as controlDefUtil      from '../controlDefUtil';
import * as gameUtil            from '../gameUtil';
import * as mameListUtil        from '../data/mameListUtil';
import * as controlsDatUtil     from '../data/controlsDatUtil';
import MonitorConfiguratorGroup from '../components/monitorConfiguratorGroup/monitorConfiguratorGroup';
import CPConfiguratorGroup      from '../components/controlPanelConfiguratorGroup/controlPanelConfiguratorGroup';
import GameNameList             from '../components/gameNameList/gameNameList';
import CompatibilityTable       from '../components/compatibilityTable/compatibilityTable';
import * as compUtil            from '../compatibilityUtil';
import npmPackage               from '../../package.json';
import {IJSONObject}            from '../types/json';
import {
  replaceChildren,
  selectR
} from '../helpers/htmlUtil';


if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', () => void (onLoad()), false);
}
else {
  void (onLoad());
}

async function onLoad(): Promise<void> {
  // pre initialize data
  void (gameUtil.init());
  void (controlDefUtil.init());
  void (modelineCaculator.init());
  
  
  void (populateMetadata());
  
  const gameNameList = new GameNameList();
  const monitorConfiguratorGroup = new MonitorConfiguratorGroup();
  const cpConfiguratorGroup = new CPConfiguratorGroup();
  const compTable = new CompatibilityTable();
  
  let refreshIsPending = false;
  compTable.on('refresh', () => void (async () => {
    monitorConfiguratorGroup.saveState();
    cpConfiguratorGroup.saveState();
    gameNameList.saveState();
    
    if (refreshIsPending) return;
    try {
      refreshIsPending = true;
      compTable.disableRefresh();
      
      // get the game name imputs
      const gameNameInputs = gameNameList.getGameNameInputs();
      
      // get the modeline configs
      const monitorConfigs = monitorConfiguratorGroup.getMonitorConfigs();
      
      // get the control panel configs
      const cpConfigs = cpConfiguratorGroup.getControlPanelConfigs();
      
      // check the compatibility of each game name input
      await Promise.all([
        gameUtil.init(),
        modelineCaculator.init()
      ]);
      const gameComps = await compUtil.checkGameBulk(gameNameInputs, monitorConfigs, cpConfigs);
      
      // update the compatibility table
      compTable.update(gameComps, cpConfigs, monitorConfigs);
    }
    finally {
      refreshIsPending = false; // eslint-disable-line require-atomic-updates
      compTable.enableRefresh();
    }
  })());
  
  await Promise.all([
    gameNameList.init(),
    monitorConfiguratorGroup.init(),
    cpConfiguratorGroup.init(),
    compTable.init()
  ]);
  
  replaceChildren(
    document.querySelector('.game-name-list-container'),
    gameNameList.elem
  );
  replaceChildren(
    document.querySelector('.monitor-configurator-group-container'),
    monitorConfiguratorGroup.elem
  );
  replaceChildren(
    document.querySelector('.control-panel-configurator-group-container'),
    cpConfiguratorGroup.elem
  );
  replaceChildren(
    document.querySelector('.comp-table-container'),
    compTable.elem
  );
  
  preload.doneLoading();
  
  compTable.refresh();
}

async function populateMetadata() {
  const metadataTextElem = selectR(document, '.metadata__text', 'textarea');
  
  const metadata: IJSONObject = {
    arcadeGenius: {
      version: npmPackage.version
    }
  };
  metadataTextElem.value = JSON.stringify(metadata, null, 2);
  
  await mameListUtil.init();
  await controlsDatUtil.init();
  
  metadata.mame = {
    build: mameListUtil.get().build,
    debug: mameListUtil.get().debug
  };
  metadata.controlsDat = {
    ...controlsDatUtil.get().meta
  };
  metadataTextElem.value = JSON.stringify(metadata, null, 2);
}
