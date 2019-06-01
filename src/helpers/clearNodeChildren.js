/**
 * @param {Node} node 
 * @returns {Node}
 */
export default function clearNodeChildren(node) {
  while (node.firstChild) {
    node.removeChild(node.firstChild);
  }
  return node;
}
