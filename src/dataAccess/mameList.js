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
 * @property {Display[]} displays
 * @property {Driver} driver
 * 
 * @typedef Display
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
 * @typedef Driver
 * @property {DriverStatus} status
 * @property {DriverStatus} emulation
 * @property {DriverStatus} color
 * @property {DriverStatus} sound
 * @property {DriverStatus} graphic
 * @property {DriverStatus} [drivercocktail]
 * @property {DriverStatus} [driverprotection]
 * @property {DriverStatus} savestate
 * 
 * @typedef {'good'|'imperfect'|'preliminary'} DriverStatus
 */

import _mameList from '../../data/mameList.filtered.partial.min.json';

/** @type {MAMEList} */
const mameList = _mameList;

export default mameList;