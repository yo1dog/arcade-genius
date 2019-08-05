export default function pluralize<T1, T2>(
  num          : number,
  singularVal  : T1,
  pluralVal    : T2,
  separatorStr?: string
): T1 | T2 | string {
  const val = num === 1? singularVal : pluralVal;
  
  if (typeof separatorStr === 'string') {
    return String(num) + separatorStr + String(val);
  }
  
  return val;
}
