export default function coalesceNull<T1, T2>(
  val       : T1 | null,
  defaultVal: T2
): T1 | T2 {
  return val === null? defaultVal : val;
}