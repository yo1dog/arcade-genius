import {TJSONValue} from './json';
import {
  ISwitchResInput,
  ISwitchResConfiguration,
  ISwitchResMachineInput,
  ISwitchResDisplay,
  TSwitchResOutput,
  ISwitchResOutputSuccess,
  ISwitchResOutputFailure,
  ISwitchResModeline,
} from './switchres';
import {
  deserializeObject,
  deserializeString,
  deserializeBoolean,
  deserializeNumber
} from './jsonSerializer';


export function serializeSwitchResInput(input: ISwitchResInput): TJSONValue {
  return {
    config  : serializeSwitchResConfig(input.config),
    machines: input.machines.map(serializeSwitchResMachineInput)
  };
}

export function serializeSwitchResConfig(switchResConfig: ISwitchResConfiguration): TJSONValue {
  return {
    preset         : switchResConfig.preset,
    orientation    : switchResConfig.orientation.serialize(),
    ranges         : switchResConfig.ranges,
    allowInterlaced: switchResConfig.allowInterlaced,
    allowDoublescan: switchResConfig.allowDoublescan,
  };
}

export function serializeSwitchResMachineInput(machineInput: ISwitchResMachineInput): TJSONValue {
  return {
    name   : machineInput.name,
    display: serializeSwitchResDisplay(machineInput.display)
  };
}

export function serializeSwitchResDisplay(display: ISwitchResDisplay): TJSONValue {
  return {
    type   : display.type.serialize(),
    rotate : display.rotate.serialize(),
    flipx  : display.flipx,
    refresh: display.refresh,
    width  : display.width,
    height : display.height
  };
}

export function deserializeSwitchResOutput(sOutput: TJSONValue, propLabel: string): TSwitchResOutput {
  const outputJ = deserializeObject(sOutput, propLabel);
  
  if (typeof outputJ.err === 'string') {
    return deserializeSwitchResOutputFailure(sOutput, propLabel);
  }
  return deserializeSwitchResOutputSucess(sOutput, propLabel);
}

export function deserializeSwitchResOutputFailure(sOutput: TJSONValue, propLabel: string): ISwitchResOutputFailure {
  const outputJ = deserializeObject(sOutput, propLabel);
  
  return {
    err: deserializeString(outputJ.err, `${propLabel}.err`)
  };
}

export function deserializeSwitchResOutputSucess(sOutput: TJSONValue, propLabel: string): ISwitchResOutputSuccess {
  const outputJ = deserializeObject(sOutput, propLabel);
  
  return {
    inRange    : deserializeBoolean         (outputJ.inRange,     `${propLabel}.inRange`    ),
    description: deserializeString          (outputJ.description, `${propLabel}.description`),
    modelineStr: deserializeString          (outputJ.modelineStr, `${propLabel}.modelineStr`),
    details    : deserializeString          (outputJ.details,     `${propLabel}.details`    ),
    vfreqOff   : deserializeBoolean         (outputJ.vfreqOff,    `${propLabel}.vfreqOff`   ),
    resStretch : deserializeBoolean         (outputJ.resStretch,  `${propLabel}.resStretch` ),
    weight     : deserializeNumber          (outputJ.weight,      `${propLabel}.weight`     ),
    xScale     : deserializeNumber          (outputJ.xScale,      `${propLabel}.xScale`     ),
    yScale     : deserializeNumber          (outputJ.yScale,      `${propLabel}.yScale`     ),
    vScale     : deserializeNumber          (outputJ.vScale,      `${propLabel}.vScale`     ),
    xDiff      : deserializeNumber          (outputJ.xDiff,       `${propLabel}.xDiff`      ),
    yDiff      : deserializeNumber          (outputJ.yDiff,       `${propLabel}.yDiff`      ),
    vDiff      : deserializeNumber          (outputJ.vDiff,       `${propLabel}.vDiff`      ),
    xRatio     : deserializeNumber          (outputJ.xRatio,      `${propLabel}.xRatio`     ),
    yRatio     : deserializeNumber          (outputJ.yRatio,      `${propLabel}.yRatio`     ),
    vRatio     : deserializeNumber          (outputJ.vRatio,      `${propLabel}.vRatio`     ),
    rotated    : deserializeBoolean         (outputJ.rotated,     `${propLabel}.rotated`    ),
    modeline   : deserializeSwithResModeline(outputJ.modeline,    `${propLabel}.modeline`   ),
  };
}

export function deserializeSwithResModeline(sModeline: TJSONValue, propLabel: string): ISwitchResModeline {
  const modelineJ = deserializeObject(sModeline, propLabel);
  
  return {
    pclock    : deserializeNumber(modelineJ.pclock,     `${propLabel}.pclock`    ),
    hactive   : deserializeNumber(modelineJ.hactive,    `${propLabel}.hactive`   ),
    hbegin    : deserializeNumber(modelineJ.hbegin,     `${propLabel}.hbegin`    ),
    hend      : deserializeNumber(modelineJ.hend,       `${propLabel}.hend`      ),
    htotal    : deserializeNumber(modelineJ.htotal,     `${propLabel}.htotal`    ),
    vactive   : deserializeNumber(modelineJ.vactive,    `${propLabel}.vactive`   ),
    vbegin    : deserializeNumber(modelineJ.vbegin,     `${propLabel}.vbegin`    ),
    vend      : deserializeNumber(modelineJ.vend,       `${propLabel}.vend`      ),
    vtotal    : deserializeNumber(modelineJ.vtotal,     `${propLabel}.vtotal`    ),
    interlace : deserializeNumber(modelineJ.interlace,  `${propLabel}.interlace` ),
    doublescan: deserializeNumber(modelineJ.doublescan, `${propLabel}.doublescan`),
    hsync     : deserializeNumber(modelineJ.hsync,      `${propLabel}.hsync`     ),
    vsync     : deserializeNumber(modelineJ.vsync,      `${propLabel}.vsync`     ),
    vfreq     : deserializeNumber(modelineJ.vfreq,      `${propLabel}.vfreq`     ),
    hfreq     : deserializeNumber(modelineJ.hfreq,      `${propLabel}.hfreq`     ),
    width     : deserializeNumber(modelineJ.width,      `${propLabel}.width`     ),
    height    : deserializeNumber(modelineJ.height,     `${propLabel}.height`    ),
    refresh   : deserializeNumber(modelineJ.refresh,    `${propLabel}.refresh`   ),
    type      : deserializeNumber(modelineJ.type,       `${propLabel}.type`      ),
    range     : deserializeNumber(modelineJ.range,      `${propLabel}.range`     ),
  };
}