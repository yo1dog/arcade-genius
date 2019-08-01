export type TJSONValue = (
  | string
  | number
  | boolean
  | IJSONObject
  | IJSONArray
  | null
  | undefined
);

interface IJSONObject {
  [x: string]: TJSONValue;
}
interface IJSONArray extends Array<TJSONValue> {}
