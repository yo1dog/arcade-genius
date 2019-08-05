export default function coalesceUndefined<T1, T2>(
  val       : T1 | undefined,
  defaultVal: T2
): T1 | T2 {
  return typeof val === 'undefined'? defaultVal : val;
}