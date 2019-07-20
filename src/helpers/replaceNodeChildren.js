/**
 * @param {Node} parentNode 
 * @param  {...Node} childNodes 
 */
export default function replaceNodeChildren(parentNode, ...childNodes) {
  while (parentNode.firstChild) {
    parentNode.removeChild(parentNode.firstChild);
  }
  for (const childNode of childNodes) {
    parentNode.appendChild(childNode);
  }
}