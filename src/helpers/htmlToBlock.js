/**
 * @param {str} htmlStr 
 * @returns {DocumentFragment}
 */
export default function htmlToNode(htmlStr) {
  const template = document.createElement('template');
  template.innerHTML = htmlStr;
  return template.content;
}