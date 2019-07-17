/**
 * @template T1
 * @template T2
 * @param {number} num 
 * @param {T1} singularVal 
 * @param {T2} pluralVal 
 * @param {string} [separatorStr]
 * @returns {T1 | T2 | string}
 */
export default function pluralize(num, singularVal, pluralVal, separatorStr) {
  const val = num === 1? singularVal : pluralVal;
  
  if (typeof separatorStr === 'string') {
    return num + separatorStr + val;
  }
  
  return val;
}