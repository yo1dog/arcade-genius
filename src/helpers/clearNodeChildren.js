/**
 * @param {Node} node 
 */
export default function clearNodeChildren(node) {
  while (node.firstChild) {
    node.removeChild(node.firstChild);
  }
  return node;
}
