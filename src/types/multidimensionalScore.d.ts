export interface IMultidimensionalScore {
  readonly dims: IScoreDimension[];
}
export default IMultidimensionalScore;

export interface IScoreDimension {
  readonly key: string;
  val: number | IMultidimensionalScore;
}
