import './index.less';
import * as preload             from './preload';
import * as mameUtil            from '../dataAccess/mameUtil';
import * as controlsDatUtil     from '../dataAccess/controlsDatUtil';
import * as controlDefUtil      from '../dataAccess/controlDefUtil';
import * as modelineCaculator   from '../dataAccess/modelineCalculator';
import MonitorConfiguratorGroup from '../components/monitorConfiguratorGroup/monitorConfiguratorGroup';
import ControlPanelConfigurator from '../components/controlPanelConfigurator/controlPanelConfigurator';
import MachineNameList          from '../components/machineNameList/machineNameList';
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
  void (mameUtil.init());
  void (controlsDatUtil.init());
  void (controlDefUtil.init());
  void (modelineCaculator.init());
  
  
  void (populateMetadata());
  
  const machineNameList = new MachineNameList();
  const monitorConfiguratorGroup = new MonitorConfiguratorGroup();
  const controlPanelConfigurator = new ControlPanelConfigurator('__single');
  const compTable = new CompatibilityTable();
  
  let refreshIsPending = false;
  compTable.on('refresh', () => void (async () => {
    monitorConfiguratorGroup.saveState();
    controlPanelConfigurator.saveState();
    machineNameList.saveState();
    
    if (refreshIsPending) return;
    try {
      refreshIsPending = true;
      compTable.disableRefresh();
      
      // get the machine name imputs
      const machineNameInputs = machineNameList.getMachineNameInputs();
      
      // get the modeline configs
      const monitorConfigTitles = [];
      const modelineConfigs = [];
      for (let i = 0; i < monitorConfiguratorGroup.items.length; ++i) {
        monitorConfigTitles[i] = monitorConfiguratorGroup.items[i].getTitle();
        modelineConfigs    [i] = monitorConfiguratorGroup.items[i].configurator.getModelineConfig();
      }
      
      // get the control panel config
      const cpConfig = controlPanelConfigurator.getControlPanelConfig();
      
      // check the compatibility of each machine name input
      await Promise.all([
        mameUtil.init(),
        controlsDatUtil.init(),
        modelineCaculator.init()
      ]);
      const machineComps = await compUtil.checkMachineBulk(machineNameInputs, modelineConfigs, cpConfig);
      
      // update the compatibility table
      compTable.update(machineComps, monitorConfigTitles);
    }
    finally {
      refreshIsPending = false; // eslint-disable-line require-atomic-updates
      compTable.enableRefresh();
    }
  })());
  
  await Promise.all([
    machineNameList.init(),
    monitorConfiguratorGroup.init(),
    controlPanelConfigurator.init(),
    compTable.init()
  ]);
  
  replaceChildren(
    document.querySelector('.machine-name-list-container'),
    machineNameList.elem
  );
  replaceChildren(
    document.querySelector('.monitor-configurator-group-container'),
    monitorConfiguratorGroup.elem
  );
  replaceChildren(
    document.querySelector('.control-panel-configurator-container'),
    controlPanelConfigurator.elem
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
  
  await mameUtil.init();
  await controlsDatUtil.init();
  
  metadata.mame = {
    build: mameUtil.getList().build,
    debug: mameUtil.getList().debug
  };
  metadata.controlsDat = {
    ...controlsDatUtil.get().meta
  };
  metadataTextElem.value = JSON.stringify(metadata, null, 2);
}
