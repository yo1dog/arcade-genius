import './index.less';
import npmPackage from '../../package.json';
import * as mameListUtil from '../dataAccess/mameListUtil';
import * as controlsDatUtil from '../dataAccess/controlsDatUtil';
import * as controlDefUtil from '../dataAccess/controlDefUtil';
import * as modelineCaculator from '../dataAccess/modelineCalculator';
import MonitorConfiguratorGroup from '../components/monitorConfiguratorGroup/monitorConfiguratorGroup';
import ControlPanelConfigurator from '../components/controlPanelConfigurator/controlPanelConfigurator';
import MachineNameList from '../components/machineNameList/machineNameList';
import CompatibilityTable from '../components/compatibilityTable/compatibilityTable';
import * as compChecker from '../compatibilityChecker';
import replaceNodeChildren from '../helpers/replaceNodeChildren';


if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', onLoad, false);
}
else {
  onLoad();
}

async function onLoad() {
  // pre initialize data
  mameListUtil.init();
  controlsDatUtil.init();
  controlDefUtil.init();
  modelineCaculator.init();
  
  
  populateMetadata();
  
  const machineNameList = new MachineNameList();
  const monitorConfiguratorGroup = new MonitorConfiguratorGroup();
  const controlPanelConfigurator = new ControlPanelConfigurator('__single');
  const compTable = new CompatibilityTable();
  
  let refreshIsPending = false;
  compTable.on('refresh', async () => {
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
        monitorConfigTitles[i] = monitorConfiguratorGroup.items[i].title;
        modelineConfigs    [i] = monitorConfiguratorGroup.items[i].configurator.getModelineConfig();
      }
      
      // get the control panel config
      const cpConfig = controlPanelConfigurator.getControlPanelConfig();
      
      // check the compatibility of each machine name input
      await Promise.all([
        mameListUtil.init(),
        controlsDatUtil.init(),
        modelineCaculator.init()
      ]);
      const machineComps = await compChecker.checkMachineBulk(machineNameInputs, modelineConfigs, cpConfig);
      
      // update the compatibility table
      compTable.update(machineComps, monitorConfigTitles);
    }
    finally {
      refreshIsPending = false; // eslint-disable-line require-atomic-updates
      compTable.enableRefresh();
    }
  });
  
  await Promise.all([
    machineNameList.init(),
    monitorConfiguratorGroup.init(),
    controlPanelConfigurator.init(),
    compTable.init()
  ]);
  
  replaceNodeChildren(
    document.querySelector('.machine-name-list-container'),
    machineNameList.elem
  );
  replaceNodeChildren(
    document.querySelector('.monitor-configurator-group-container'),
    monitorConfiguratorGroup.elem
  );
  replaceNodeChildren(
    document.querySelector('.control-panel-configurator-container'),
    controlPanelConfigurator.elem
  );
  replaceNodeChildren(
    document.querySelector('.comp-table-container'),
    compTable.elem
  );
  
  window.doneLoading();
  
  compTable.refresh();
}

async function populateMetadata() {
  const metadataTextElem = document.querySelector('.metadata__text');
  
  const metadata = {
    mameGenius: {
      version: npmPackage.version
    }
  };
  metadataTextElem.value = JSON.stringify(metadata, null, 2);
  
  await mameListUtil.init();
  await controlsDatUtil.init();
  
  metadata.mameList = {
    build: mameListUtil.get().build,
    debug: mameListUtil.get().debug
  };
  metadata.controlsDat = {
    ...controlsDatUtil.get().meta
  };
  metadataTextElem.value = JSON.stringify(metadata, null, 2);
}
