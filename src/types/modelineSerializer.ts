import {orientationEnum}        from './common';
import {IModelineConfiguration} from './modeline';
import {TJSONValue}             from './json';
import {
  deserializeString,
  deserializeBoolean,
  deserializeObject,
  deserializeArray
} from './jsonSerializer';


export function serializeModelineConfig(modelineConfig: IModelineConfiguration): TJSONValue {
  return {
    __version: 1,
    preset         : modelineConfig.preset,
    orientation    : modelineConfig.orientation.serialize(),
    ranges         : modelineConfig.ranges,
    allowInterlaced: modelineConfig.allowInterlaced,
    allowDoublescan: modelineConfig.allowDoublescan,
  };
}

export function deserializeModelineConfig(sModelineConfig: TJSONValue, propLabel: string): IModelineConfiguration {
  const modelineConfigJ = deserializeObject(sModelineConfig, propLabel);
  
  return {
    preset         : deserializeString          (modelineConfigJ.preset,          `${propLabel}.preset`         ),
    orientation    : orientationEnum.deserialize(modelineConfigJ.orientation,     `${propLabel}.orientation`    ),
    ranges         : deserializeArray           (modelineConfigJ.ranges,          `${propLabel}.ranges`,         deserializeString),
    allowInterlaced: deserializeBoolean         (modelineConfigJ.allowInterlaced, `${propLabel}.allowInterlaced`),
    allowDoublescan: deserializeBoolean         (modelineConfigJ.allowDoublescan, `${propLabel}.allowDoublescan`),
  };
}
