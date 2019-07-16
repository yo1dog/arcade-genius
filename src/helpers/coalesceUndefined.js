/**
 * @template T1
 * @template T2
 * @param {T1} val 
 * @param {T2} defaultVal 
 * @returns {T1|T2}
 */
export default function coalesceUndefined(val, defaultVal) {
  return typeof val === 'undefined'? defaultVal : val;
}