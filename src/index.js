import './index.less';
import npmPackage from '../package.json';
import mameList from './dataAccess/mameList';
import controlsDat from './dataAccess/controlsDat';
import MonitorConfiguratorGroup from './components/monitorConfiguratorGroup/monitorConfiguratorGroup';
import ControlPanelConfigurator from './components/controlPanelConfigurator/controlPanelConfigurator';
import MachineNameList from './components/machineNameList/machineNameList';
import CompatibilityTable from './components/compatibilityTable/compatibilityTable';
import * as compChecker from './compatibilityChecker';
import * as modelineCalculator from './dataAccess/modelineCalculator';


document.addEventListener('DOMContentLoaded', onLoad, false);

async function onLoad() {
  document.querySelector('.title-version-tag__number').innerText = `v${npmPackage.version}`;
  
  const loadingTimerId = startLoading();
  await modelineCalculator.init();
  doneLoading(loadingTimerId);
  
  populateMetaData();
  
  const machineNameList = new MachineNameList();
  document.querySelector('.machine-name-list-container').appendChild(machineNameList.elem);
  
  const monitorConfiguratorGroup = new MonitorConfiguratorGroup();
  document.querySelector('.monitor-configurator-group-container').appendChild(monitorConfiguratorGroup.elem);
  
  const controlPanelConfigurator = new ControlPanelConfigurator('__single');
  document.querySelector('.control-panel-configurator-container').appendChild(controlPanelConfigurator.elem);
  
  const compTable = new CompatibilityTable();
  document.querySelector('.comp-table-container').appendChild(compTable.elem);
  
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
      const machineComps = await compChecker.checkMachineBulk(machineNameInputs, modelineConfigs, cpConfig);
      
      // update the compatibility table
      compTable.update(machineComps, monitorConfigTitles);
    }
    finally {
      refreshIsPending = false;
      compTable.enableRefresh();
    }
  });
  
  monitorConfiguratorGroup.init();
  controlPanelConfigurator.init();
  machineNameList.init();
  compTable.refresh();
}

function populateMetaData() {
  const metaData = {
    mameGenius: {
      version: npmPackage.version
    },
    mameList: {...mameList},
    controlsDat: {...controlsDat.meta}
  };
  delete metaData.mameList.machines;
  
  document.querySelector('.metadata__text').value = JSON.stringify(metaData, null, 2);
}

function startLoading() {
  const ellipsisElem = document.querySelector('.loading-indicator__ellipsis');
  const ellipsisStr = '...';
  let len = 0;
  
  const loadingTimerId = window.setInterval(() => {
    ellipsisElem.innerText = ellipsisStr.substring(0, len);
    len = (len + 1) % (ellipsisStr.length + 1);
  }, 200);
  
  return loadingTimerId;
}

function doneLoading(loadingTimerId) {
  window.clearInterval(loadingTimerId);
  document.querySelector('.loading-indicator').classList.add('hidden');
  document.querySelector('.content').classList.remove('hidden');
}