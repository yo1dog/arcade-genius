import './index.less';
import mameList from './dataAccess/mameList';
import controlsDat from './dataAccess/controlsDat';
import MachineNameList from './components/machineNameList/machineNameList';
import SupportTable from './components/supportTable/supportTable';
import * as supportChecker from './supportChecker';


document.addEventListener('DOMContentLoaded', onLoad, false);

function onLoad() {
  populateMetaData();
  
  const machineNameList = new MachineNameList();
  document.getElementById('machine-name-list-container').appendChild(machineNameList.block);
  
  const supportTable = new SupportTable();
  document.getElementById('support-table-container').appendChild(supportTable.block);
  
  machineNameList.on('refreshed', () => {
    // get the machine name imputs
    const machineNameInputs = machineNameList.machineNameInputs;
    
    // check the support of each machine name input
    const supportResults = (
      machineNameInputs
      .map(machineMapInput => supportChecker.check(machineMapInput))
    );
    
    // update the support table
    supportTable.supportResults = supportResults;
    supportTable.update();
  });
  
  machineNameList.init();
}

function populateMetaData() {
   const metaData = {
    mameList: {...mameList},
    controlsDat: {...controlsDat.meta}
  };
  delete metaData.mameList.machines;
  
  document.getElementById('metadata__text').value = JSON.stringify(metaData, null, 2);
}