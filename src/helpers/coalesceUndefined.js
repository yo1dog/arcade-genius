export default function coalesceUndefined(val, defaultVal) {
  return typeof val === 'undefined'? defaultVal : val;
}