/**
 * @template T
 * @param {ArrayLike<T | undefined>} arrayLike 
 * @returns {T[]}
 */
export default function filterUndefined(arrayLike) {
  return /** @type {T[]} */(
    Array.from(arrayLike)
    .filter(v => v)
  );
}
