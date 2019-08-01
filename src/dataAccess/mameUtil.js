import {TJSONValue} from '../types/json';
import {
  IMAMEList,
  IMachine,
  IMachineDisplay,
  IMachineDriver
} from '../types/mame';
import {
  displayTypeEnum,
  displayRotationEnum
} from '../types/commonEnums';
import {
  machineDriverStatusEnum,
  machineDriverSaveStateStatusEnum
} from '../types/mameEnums';
import {
  deserializeOptional,
  deserializeString,
  deserializeStringOptional,
  deserializeNumber,
  deserializeNumberOptional,
  deserializeBoolean,
  deserializeObject,
  deserializeArray
} from '../types/jsonSerializer';


/** @type {IMAMEList | null} */
let mameList = null;
/** @type {Map<string, IMachine> | null} */
let machineMap = null;

async function _init() {
  /** @type {TJSONValue} */
  const sMAMEList = (await import(
    /* webpackChunkName: "mameList" */
    '../../data/mameList.filtered.partial.min.json' + '' // avoid loading large types
  )).default;
  
  /** @type {IMAMEList} */
  mameList = deserialize(sMAMEList);
  
  /** @type {Map<string, IMachine>} */
  machineMap = new Map();
  for (const machine of mameList.machines) {
    machineMap.set(machine.name, machine);
  }
}

/** @type {Promise<void> | null} */
let initPromise = null;
export async function init() {
  return (initPromise = initPromise || _init());
}

export function getList() {
  if (!mameList) throw new Error(`Attempting to access before initialized.`);
  
  return mameList;
}

export function getMachineMap() {
  if (!machineMap) throw new Error(`Attempting to access before initialized.`);
  
  return machineMap;
}

/** @param {string} name */
export function getMachineByName(name) {
  if (!machineMap) {
    throw new Error(`Attempting to access before initialized.`);
  }
  
  return machineMap.get(name);
}






/**
 * @param {TJSONValue} sMAMEList 
 * @returns {IMAMEList}
 */
function deserialize(sMAMEList) {
  return deserializeMAMEList(sMAMEList, 'sMameList');
}

/**
 * @param {TJSONValue} sMAMEList 
 * @param {string}     propLabel 
 * @returns {IMAMEList}
 */
function deserializeMAMEList(sMAMEList, propLabel) {
  const mameListJ = deserializeObject(sMAMEList, propLabel);
  return {
    build   : deserializeString (mameListJ.build,    `${propLabel}.build`   ),
    debug   : deserializeBoolean(mameListJ.debug,    `${propLabel}.debug`   ),
    machines: deserializeArray  (mameListJ.machines, `${propLabel}.machines`, deserializeMachine),
  };
}

/**
 * @param {TJSONValue} sMachine 
 * @param {string}     propLabel 
 * @returns {IMachine}
 */
function deserializeMachine(sMachine, propLabel) {
  const machineJ = deserializeObject(sMachine, propLabel);
  return {
    name        : deserializeString        (machineJ.name,         `${propLabel}.name`        ),
    description : deserializeString        (machineJ.description,  `${propLabel}.description` ),
    year        : deserializeStringOptional(machineJ.year,         `${propLabel}.year`        ),
    manufacturer: deserializeStringOptional(machineJ.manufacturer, `${propLabel}.manufacturer`),
    cloneof     : deserializeStringOptional(machineJ.cloneof,      `${propLabel}.cloneof`     ),
    displays    : deserializeArray         (machineJ.displays,     `${propLabel}.displays`,     deserializeMachineDisplay),
    driver      : deserializeMachineDriver (machineJ.driver,       `${propLabel}.driver`      ),
  };
}

/**
 * @param {TJSONValue} sDisplay 
 * @param {string}     propLabel 
 * @returns {IMachineDisplay}
 */
function deserializeMachineDisplay(sDisplay, propLabel) {
  const displayJ = deserializeObject(sDisplay, propLabel);
  return {
    tag     : deserializeStringOptional      (displayJ.tag,      `${propLabel}.tag`     ),
    type    : displayTypeEnum.deserialize    (displayJ.type,     `${propLabel}.type`    ),
    rotate  : displayRotationEnum.deserialize(displayJ.rotate,   `${propLabel}.rotate`  ),
    flipx   : deserializeBoolean             (displayJ.flipx,    `${propLabel}.flipx`   ),
    width   : deserializeNumberOptional      (displayJ.width,    `${propLabel}.width`   ),
    height  : deserializeNumberOptional      (displayJ.height,   `${propLabel}.height`  ),
    refresh : deserializeNumber              (displayJ.refresh,  `${propLabel}.refresh` ),
    pixclock: deserializeNumberOptional      (displayJ.pixclock, `${propLabel}.pixclock`),
    htotal  : deserializeNumberOptional      (displayJ.htotal,   `${propLabel}.htotal`  ),
    hbend   : deserializeNumberOptional      (displayJ.hbend,    `${propLabel}.hbend`   ),
    hbstart : deserializeNumberOptional      (displayJ.hbstart,  `${propLabel}.hbstart` ),
    vtotal  : deserializeNumberOptional      (displayJ.vtotal,   `${propLabel}.vtotal`  ),
    vbend   : deserializeNumberOptional      (displayJ.vbend,    `${propLabel}.vbend`   ),
    vbstart : deserializeNumberOptional      (displayJ.vbstart,  `${propLabel}.vbstart` ),
  };
}

/**
 * @param {TJSONValue} sDriver 
 * @param {string}     propLabel 
 * @returns {IMachineDriver}
 */
function deserializeMachineDriver(sDriver, propLabel) {
  const driverJ = deserializeObject(sDriver, propLabel);
  return {
    status          : machineDriverStatusEnum.deserialize         (driverJ.status,           `${propLabel}.status`          ),
    emulation       : machineDriverStatusEnum.deserialize         (driverJ.emulation,        `${propLabel}.emulation`       ),
    color           : machineDriverStatusEnum.deserialize         (driverJ.color,            `${propLabel}.color`           ),
    sound           : machineDriverStatusEnum.deserialize         (driverJ.sound,            `${propLabel}.sound`           ),
    graphic         : machineDriverStatusEnum.deserialize         (driverJ.graphic,          `${propLabel}.graphic`         ),
    drivercocktail  : deserializeOptional                         (driverJ.drivercocktail,   `${propLabel}.drivercocktail`,   machineDriverStatusEnum.deserialize),
    driverprotection: deserializeOptional                         (driverJ.driverprotection, `${propLabel}.driverprotection`, machineDriverStatusEnum.deserialize),
    savestate       : machineDriverSaveStateStatusEnum.deserialize(driverJ.savestate,        `${propLabel}.savestate`       ),
  };
}
