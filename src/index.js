import './index.less';
import mameList from './dataAccess/mameList';
import controlsDat from './dataAccess/controlsDat';
import MonitorConfigurator from './components/monitorConfigurator/monitorConfigurator';
import MachineNameList from './components/machineNameList/machineNameList';
import SupportTable from './components/supportTable/supportTable';
import * as supportChecker from './supportChecker';
import * as modelineCalculator from './dataAccess/modelineCalculator';


document.addEventListener('DOMContentLoaded', onLoad, false);

async function onLoad() {
  populateMetaData();
  await modelineCalculator.init();
  
  const machineNameList = new MachineNameList();
  document.getElementById('machine-name-list-container').appendChild(machineNameList.block);
  
  const monitorConfigurator = new MonitorConfigurator();
  document.getElementById('monitor-configurator-container').appendChild(monitorConfigurator.block);
  
  const supportTable = new SupportTable();
  document.getElementById('support-table-container').appendChild(supportTable.block);
  
  let refreshIsPending = false;
  supportTable.on('refresh', async () => {
    monitorConfigurator.saveState();
    machineNameList.saveState();
    
    if (refreshIsPending) return;
    try {
      refreshIsPending = true;
      supportTable.disableRefresh();
      
      // get the machine name imputs
      const machineNameInputs = machineNameList.getMachineNameInputs();
      
      // check the support of each machine name input
      const modelineConfig = monitorConfigurator.getModelineConfig();
      const supportResults = await supportChecker.checkBulk(modelineConfig, machineNameInputs);
      
      // update the support table
      supportTable.update(supportResults);
    }
    finally {
      refreshIsPending = false;
      supportTable.enableRefresh();
    }
  });
  
  monitorConfigurator.init();
  machineNameList.init();
  supportTable.refresh();
}

function populateMetaData() {
   const metaData = {
    mameList: {...mameList},
    controlsDat: {...controlsDat.meta}
  };
  delete metaData.mameList.machines;
  
  document.getElementById('metadata__text').value = JSON.stringify(metaData, null, 2);
}