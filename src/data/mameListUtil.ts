import {TJSONValue} from '../types/json';
import {
  IMAMEList,
  IMAMEMachine,
  IMAMEMachineDisplay,
  IMAMEMachineDriver,
  mameMachineDriverStatusEnum,
  mameMachineDriverSaveStateStatusEnum,
  mameMachineDisplayTypeEnum,
  mameMachineDisplayRotationEnum
} from '../types/data/mame';
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


let mameList: IMAMEList | null = null;

async function _init(): Promise<void> {
  const sMAMEList: TJSONValue = (await import(
    /* webpackChunkName: "mameList" */
    'data/mameList.filtered.partial.min.json'
  )).default;
  
  mameList = deserialize(sMAMEList);
}

let initPromise: Promise<void> | null = null;
export async function init(): Promise<void> {
  return (initPromise = initPromise || _init());
}

export function get(): IMAMEList {
  if (!mameList) throw new Error(`Attempting to access before initialized.`);
  return mameList;
}



function deserialize(sMAMEList: TJSONValue): IMAMEList {
  return deserializeMAMEList(sMAMEList, 'sMameList');
}

function deserializeMAMEList(sMAMEList: TJSONValue, propLabel: string): IMAMEList {
  const mameListJ = deserializeObject(sMAMEList, propLabel);
  return {
    build   : deserializeString (mameListJ.build,    `${propLabel}.build`   ),
    debug   : deserializeBoolean(mameListJ.debug,    `${propLabel}.debug`   ),
    machines: deserializeArray  (mameListJ.machines, `${propLabel}.machines`, deserializeMAMEMachine),
  };
}

function deserializeMAMEMachine(sMAMEMachine: TJSONValue, propLabel: string): IMAMEMachine {
  const mameMachineJ = deserializeObject(sMAMEMachine, propLabel);
  
  return {
    name        : deserializeString           (mameMachineJ.name,         `${propLabel}.name`        ),
    description : deserializeString           (mameMachineJ.description,  `${propLabel}.description` ),
    year        : deserializeStringOptional   (mameMachineJ.year,         `${propLabel}.year`        ),
    manufacturer: deserializeStringOptional   (mameMachineJ.manufacturer, `${propLabel}.manufacturer`),
    cloneof     : deserializeStringOptional   (mameMachineJ.cloneof,      `${propLabel}.cloneof`     ),
    displays    : deserializeArray            (mameMachineJ.displays,     `${propLabel}.displays`,     deserializeMAMEMachineDisplay),
    driver      : deserializeMAMEMachineDriver(mameMachineJ.driver,       `${propLabel}.driver`      ),
  };
}

function deserializeMAMEMachineDisplay(sDisplay: TJSONValue, propLabel: string): IMAMEMachineDisplay {
  const displayJ = deserializeObject(sDisplay, propLabel);
  return {
    tag     : deserializeStringOptional                 (displayJ.tag,      `${propLabel}.tag`     ),
    type    : mameMachineDisplayTypeEnum.deserialize    (displayJ.type,     `${propLabel}.type`    ),
    rotate  : mameMachineDisplayRotationEnum.deserialize(displayJ.rotate,   `${propLabel}.rotate`  ),
    flipx   : deserializeBoolean                        (displayJ.flipx,    `${propLabel}.flipx`   ),
    width   : deserializeNumberOptional                 (displayJ.width,    `${propLabel}.width`   ),
    height  : deserializeNumberOptional                 (displayJ.height,   `${propLabel}.height`  ),
    refresh : deserializeNumber                         (displayJ.refresh,  `${propLabel}.refresh` ),
    pixclock: deserializeNumberOptional                 (displayJ.pixclock, `${propLabel}.pixclock`),
    htotal  : deserializeNumberOptional                 (displayJ.htotal,   `${propLabel}.htotal`  ),
    hbend   : deserializeNumberOptional                 (displayJ.hbend,    `${propLabel}.hbend`   ),
    hbstart : deserializeNumberOptional                 (displayJ.hbstart,  `${propLabel}.hbstart` ),
    vtotal  : deserializeNumberOptional                 (displayJ.vtotal,   `${propLabel}.vtotal`  ),
    vbend   : deserializeNumberOptional                 (displayJ.vbend,    `${propLabel}.vbend`   ),
    vbstart : deserializeNumberOptional                 (displayJ.vbstart,  `${propLabel}.vbstart` ),
  };
}

function deserializeMAMEMachineDriver(sDriver: TJSONValue, propLabel: string): IMAMEMachineDriver {
  const driverJ = deserializeObject(sDriver, propLabel);
  return {
    status          : mameMachineDriverStatusEnum.deserialize         (driverJ.status,           `${propLabel}.status`          ),
    emulation       : mameMachineDriverStatusEnum.deserialize         (driverJ.emulation,        `${propLabel}.emulation`       ),
    color           : mameMachineDriverStatusEnum.deserialize         (driverJ.color,            `${propLabel}.color`           ),
    sound           : mameMachineDriverStatusEnum.deserialize         (driverJ.sound,            `${propLabel}.sound`           ),
    graphic         : mameMachineDriverStatusEnum.deserialize         (driverJ.graphic,          `${propLabel}.graphic`         ),
    drivercocktail  : deserializeOptional                             (driverJ.drivercocktail,   `${propLabel}.drivercocktail`,   mameMachineDriverStatusEnum.deserialize),
    driverprotection: deserializeOptional                             (driverJ.driverprotection, `${propLabel}.driverprotection`, mameMachineDriverStatusEnum.deserialize),
    savestate       : mameMachineDriverSaveStateStatusEnum.deserialize(driverJ.savestate,        `${propLabel}.savestate`       ),
  };
}
