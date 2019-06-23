import mameList from './mameList';

/** @type {Object<string, import('./mameList').Machine>} */
const machineMap = {};
for (const machine of mameList.machines) {
  machineMap[machine.name] = machine;
}

export default machineMap;