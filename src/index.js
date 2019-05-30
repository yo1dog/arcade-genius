import mameList from './mameList';
import machineMap from './machineMap';
import controlsDat from './controlsDat';
import htmlToNode from './helpers/htmlToNode';
import clearNodeChildren from './helpers/clearNodeChildren';
import escapeHtml from './helpers/escapeHtml';


document.addEventListener('DOMContentLoaded', onLoad, false);

function onLoad() {
  populateMetaData();
  
  document.getElementById('machineNamesRefreshButton').addEventListener('click', refreshMachineList);
}

function populateMetaData() {
   const metaData = {
    mameList: {...mameList},
    controlsDat: {...controlsDat.meta}
  };
  delete metaData.mameList.machines;
  
  document.getElementById('metaData').innerText = JSON.stringify(metaData, null, 2);
}

function refreshMachineList() {
  /** @type {string} */
  const machineNamesInput = document.getElementById('machineNamesInput').value;
  
  // parse input into machine names
  const machineNames = (
    machineNamesInput
    .replace(/,/g, '\n')           // replace commas with newlines
    .split('\n')                   // split by lines
    .map(str => str.trim())        // trim lines
    .filter(str => str.length > 0) // remove empty lines
    .filter((str, i, strs) =>      // remove duplicates
      strs.indexOf(str) === i
    )
  );
  
  // create row nodes for each machine name
  const machineRowNodes = machineNames.map((machineName, i) =>
    createMachineRowNode(machineName, i)
  );
  
  // replace rows
  const machineResultTableBodyElem = document.getElementById('machineResultTable').getElementsByTagName('tbody')[0];
  
  clearNodeChildren(machineResultTableBodyElem);
  for (const machineResultNode of machineRowNodes) {
    machineResultTableBodyElem.appendChild(machineResultNode);
  }
}

function createMachineRowNode(machineName, rowIndex) {
  // get machine and control
  const machine = machineMap[machineName];
  const controlGame = machine && (
    controlsDat.gameMap[machine.name] ||
    controlsDat.gameMap[machine.cloneof]
  );
  
  const evenOddClass = rowIndex % 2 === 0? 'odd' : 'even';
  
  // translate statuses
  const {emuStatus, emuStatusDesc, emuStatusClass} = translateMachineEmuStatus(machine);
  const {controlsStatus, controlsStatusDesc, controlsStatusClass} = translateControlStatus(machine);
  
  const details = machine? JSON.stringify({machine, controlGame}, null, 2) : '';
  
  // create node
  const node = htmlToNode(`
    <tr class="machine-row ${evenOddClass} ${!machine? 'invalid-machine-name' : ''} ${emuStatusClass} ${controlsStatusClass}">
      <td class="machine-name"><code>${escapeHtml(machine? machine.name : machineName)}</code></td>
      <td class="machine-desc">${escapeHtml(machine? machine.description : 'machine not found')}</td>
      <td class="machine-emu-status-icon"><span class="icon"></span></td>
      <td class="machine-emu-status">${escapeHtml(emuStatusDesc)}</td>
      <td class="machine-controls-status-icon"><span class="icon"></span></td>
      <td class="machine-controls-status">${escapeHtml(controlsStatusDesc)}</td>
      <td><button class="toggle-expand-button hidden-state ${!details? 'hidden' : ''}">details</button></td>
    </tr>
    <tr class="machine-details-row ${evenOddClass} hidden">
      <td colspan="7"><pre>${escapeHtml(details)}</pre></td>
    </tr>
  `);
  
  // attach event listener to expand button
  const detailsRowElem      = node.querySelector('.machine-details-row');
  const toggleDetailsButton = node.querySelector('.toggle-expand-button');
  if (toggleDetailsButton) {
    attachToggleExpandButtonEvents(toggleDetailsButton, detailsRowElem);
  }
  
  return node;
}

function translateMachineEmuStatus(machine) {
  const emuStatus = machine? machine.driver.status : 'notfound';
  const emuStatusDesc = {
    good       : 'Good',
    imperfect  : 'Imperfect',
    preliminary: 'Preliminary',
    notfound   : 'Not Found'
  }[emuStatus] || emuStatus;
  const emuStatusClass = {
    good       : 'emu-status-good',
    imperfect  : 'emu-status-imperfect',
    preliminary: 'emu-status-preliminary',
    notfound   : 'emu-status-not-found'
  }[emuStatus] || 'emu-status-unknown';
  
  return {
    emuStatus,
    emuStatusDesc,
    emuStatusClass
  };
}

function translateControlStatus(controlGame) {
  const controlsStatus = ['good', 'ok', 'bad', 'missing'][Math.floor(Math.random() * 4)];
  
  const controlsStatusDesc = {
    good   : 'Good',
    ok     : 'OK',
    bad    : 'Bad',
    missing: 'Missing'
  }[controlsStatus] || controlsStatus;
  const controlsStatusClass = {
    good   : 'controls-status-good',
    ok     : 'controls-status-ok',
    bad    : 'controls-status-bad',
    missing: 'controls-status-missing'
  }[controlsStatus] || 'controls-status-unknown';
  
  return {
    controlsStatus,
    controlsStatusDesc,
    controlsStatusClass
  };
}

/**
 * @param {HTMLElement} toggleExpandButton 
 * @param {HTMLElement} targetElem 
 */
function attachToggleExpandButtonEvents(toggleExpandButton, targetElem) {
  toggleExpandButton.addEventListener('click', () => {
    if (targetElem.classList.contains('hidden')) {
      targetElem.classList.remove('hidden');
      toggleExpandButton.classList.remove('hidden-state');
    }
    else {
      targetElem.classList.add('hidden');
      toggleExpandButton.classList.add('hidden-state');
    }
  });
}