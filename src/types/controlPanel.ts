import {IControlDef} from './controlDef';


export interface ICPConfiguration {
  readonly controls      : ICPControl[];
  readonly buttonClusters: ICPButtonCluster[];
  readonly controlSets   : ICPControlSet[];
}

export interface ICPControl {
  readonly id                    : string;
  readonly name                  : string;
  readonly controlDef            : IControlDef;
  readonly numButtons            : number;
  readonly isOnOppositeScreenSide: boolean;
}

export interface ICPButtonCluster {
  readonly id                    : string;
  readonly name                  : string;
  readonly numButtons            : number;
  readonly isOnOppositeScreenSide: boolean;
  
}

export interface ICPControlSet {
  readonly controls      : ICPControl[];
  readonly buttonCluster?: ICPButtonCluster;
}
