import mameList from './mameList';

/** @type {import('./mameList').Machine} */
const mameListMap = {};
for (const machine of mameList.machines) {
  mameListMap[machine.name] = machine;
}

export default mameListMap;