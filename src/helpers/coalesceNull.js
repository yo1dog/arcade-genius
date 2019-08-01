/**
 * @template T1
 * @template T2
 * @param {T1 | null} val 
 * @param {T2} defaultVal 
 * @returns {T1|T2}
 */
export default function coalesceNull(val, defaultVal) {
  return val === null? defaultVal : val;
}