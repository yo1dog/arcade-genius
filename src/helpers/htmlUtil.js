/**
 * @param {string} htmlStr 
 * @returns {DocumentFragment}
 */
export function htmlToBlock(htmlStr) {
  const template = document.createElement('template');
  template.innerHTML = htmlStr;
  return template.content;
}

/**
 * @param {Node|null|undefined} node 
 * @param {...Node} childNodes 
 */
export function replaceChildren(node, ...childNodes) {
  if (!node) {
    return node;
  }
  
  while (node.firstChild) {
    node.removeChild(node.firstChild);
  }
  for (const childNode of childNodes) {
    node.appendChild(childNode);
  }
  
  return node;
}

/**
 * @param {ParentNode} parentNode 
 * @param {string} selectors 
 * @param {string} [tag] 
 * @returns {HTMLElement | undefined}
 */
function _select(parentNode, selectors, tag) {
  const elem = parentNode.querySelector(selectors);
  if (!(elem instanceof HTMLElement)) {
    return;
  }
  if (tag && tag.toUpperCase() !== elem.tagName) {
    return;
  }
  
  return elem;
}
export const select = /** @type {import('./htmlUtil_').select} */(_select);

/**
 * @param {ParentNode} parentNode 
 * @param {string} selectors 
 * @param {string} [tag] 
 * @returns {HTMLElement}
 */
function _selectR(parentNode, selectors, tag) {
  const elem = _select(parentNode, selectors, tag);
  if (!elem) throw new Error(`Required element not found${tag? ` or not correct tag '${tag}'` : ''}: ${selectors}`);
  return elem;
}
export const selectR = /** @type {import('./htmlUtil_').selectR} */(_selectR);

/**
 * @param {ParentNode} parentNode 
 * @param {string} selectors 
 * @param {string} [tag] 
 * @returns {HTMLElement[]}
 */
function _selectAll(parentNode, selectors, tag) {
  return /** @type {HTMLElement[]} */(
    Array.from(parentNode.querySelectorAll(selectors))
    .filter(elem =>
      elem instanceof HTMLElement &&
      (!tag || elem.tagName === tag.toUpperCase())
    )
  );
}
export const selectAll = /** @type {import('./htmlUtil_').selectAll} */(_selectAll);

/**
 * @param {ParentNode} parentNode 
 * @param {string} [tag] 
 * @returns {HTMLElement | undefined}
 */
function _firstChild(parentNode, tag) {
  const elem = parentNode.firstElementChild;
  if (!(elem instanceof HTMLElement)) {
    return;
  }
  if (tag && tag.toUpperCase() !== elem.tagName) {
    return;
  }
  
  return elem;
}
export const firstChild = /** @type {import('./htmlUtil_').firstChild} */(_firstChild);

/**
 * @param {ParentNode} parentNode 
 * @param {string} [tag] 
 * @returns {HTMLElement}
 */
function _firstChildR(parentNode, tag) {
  const elem = _firstChild(parentNode, tag);
  if (!elem) throw new Error(`Required first element child not found${tag? ` or not correct tag '${tag}'` : ''}.`);
  return elem;
}
export const firstChildR = /** @type {import('./htmlUtil_').firstChildR} */(_firstChildR);

/**
 * @param {HTMLElement} elem 
 * @param {boolean} [deep] 
 * @returns {HTMLElement}
 */
function _cloneElem(elem, deep) {
  return /** @type {HTMLElement} */(
    elem.cloneNode(deep)
  );
}
export const cloneElem = /** @type {import('./htmlUtil_').cloneElem} */(_cloneElem);