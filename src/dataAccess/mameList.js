/**
 * @typedef MAMEList
 * @property {string} build
 * @property {boolean} debug
 * @property {Machine[]} machines
 * 
 * @typedef Machine
 * @property {string} name
 * @property {string} description
 * @property {string} [year]
 * @property {string} [manufacturer]
 * @property {string} cloneof
 * @property {MachineDisplay[]} displays
 * @property {MachineDriver} driver
 * 
 * @typedef MachineDisplay
 * @property {string} [tag]
 * @property {'raster'|'vector'|'lcd'|'unknown'} type
 * @property {0|90|180|270} rotate
 * @property {boolean} flipx
 * @property {number} [width]
 * @property {number} [height]
 * @property {number} refresh
 * @property {number} [pixclock]
 * @property {number} [htotal]
 * @property {number} [hbend]
 * @property {number} [hbstart]
 * @property {number} [vtotal]
 * @property {number} [vbend]
 * @property {number} [vbstart]
 * 
 * @typedef MachineDriver
 * @property {MachineDriverStatus} status
 * @property {MachineDriverStatus} emulation
 * @property {MachineDriverStatus} color
 * @property {MachineDriverStatus} sound
 * @property {MachineDriverStatus} graphic
 * @property {MachineDriverStatus} [drivercocktail]
 * @property {MachineDriverStatus} [driverprotection]
 * @property {MachineDriverStatus} savestate
 * 
 * @typedef {'good'|'imperfect'|'preliminary'} MachineDriverStatus
 */

import _mameList from '../../data/mameList.filtered.partial.min.json';

/** @type {MAMEList} */
const mameList = _mameList;

export default mameList;