export type TJSONValue = (
  | string
  | number
  | boolean
  | IJSONObject
  | IJSONArray
  | null
  | undefined
);

export interface IJSONObject {
  [x: string]: TJSONValue;
}
export interface IJSONArray extends Array<TJSONValue> {} // eslint-disable-line @typescript-eslint/no-empty-interface
