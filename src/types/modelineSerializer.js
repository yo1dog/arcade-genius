import {orientationEnum} from './commonEnums';
import {IModelineConfig} from './modeline';
import {TJSONValue}      from './json';
import {
  deserializeString,
  deserializeBoolean,
  deserializeObject,
  deserializeArray
} from './jsonSerializer';


/**
 * @param {IModelineConfig} modelineConfig
 * @returns {TJSONValue}
 */
export function serializeModelineConfig(modelineConfig) {
  return {
    __version: 1,
    preset         : modelineConfig.preset,
    orientation    : modelineConfig.orientation.serialize(),
    ranges         : modelineConfig.ranges,
    allowInterlaced: modelineConfig.allowInterlaced,
    allowDoublescan: modelineConfig.allowDoublescan,
  };
}

/**
 * @param {TJSONValue} sModelineConfig
 * @param {string}     propLabel
 * @returns {IModelineConfig}
 */
export function deserializeModelineConfig(sModelineConfig, propLabel) {
  const modelineConfigJ = deserializeObject(sModelineConfig, propLabel);
  
  return {
    preset         : deserializeString          (modelineConfigJ.preset,          `${propLabel}.preset`         ),
    orientation    : orientationEnum.deserialize(modelineConfigJ.orientation,     `${propLabel}.orientation`    ),
    ranges         : deserializeArray           (modelineConfigJ.ranges,          `${propLabel}.ranges`,         deserializeString),
    allowInterlaced: deserializeBoolean         (modelineConfigJ.allowInterlaced, `${propLabel}.allowInterlaced`),
    allowDoublescan: deserializeBoolean         (modelineConfigJ.allowDoublescan, `${propLabel}.allowDoublescan`),
  };
}
