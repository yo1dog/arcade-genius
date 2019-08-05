export function htmlToBlock(htmlStr: string): DocumentFragment {
  const template = document.createElement('template');
  template.innerHTML = htmlStr;
  return template.content;
}

export function replaceChildren(node: Node|null|undefined, ...childNodes: Node[]) {
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


export function select<K extends keyof HTMLElementTagNameMap>(
  parentNode: ParentNode,
  selectors : K
): HTMLElementTagNameMap[K] | undefined;
export function select(
  parentNode: ParentNode,
  selectors : string
): HTMLElement | undefined;
export function select<K extends keyof HTMLElementTagNameMap>(
  parentNode: ParentNode,
  selectors : string,
  tag?      : K
): HTMLElementTagNameMap[K] | undefined;
export function select(
  parentNode: ParentNode,
  selectors : string,
  tag?      : keyof HTMLElementTagNameMap
): HTMLElement | undefined {
  const elem = parentNode.querySelector(selectors);
  if (!(elem instanceof HTMLElement)) {
    return;
  }
  if (tag && tag.toUpperCase() !== elem.tagName) {
    return;
  }
  
  return elem;
}


export function selectR<K extends keyof HTMLElementTagNameMap>(
  parentNode: ParentNode,
  selectors : K
): HTMLElementTagNameMap[K];
export function selectR(
  parentNode: ParentNode,
  selectors : string
): HTMLElement;
export function selectR<K extends keyof HTMLElementTagNameMap>(
  parentNode: ParentNode,
  selectors : string,
  tag?      : K
): HTMLElementTagNameMap[K];
export function selectR(
  parentNode: ParentNode,
  selectors: string,
  tag?: keyof HTMLElementTagNameMap
): HTMLElement {
  const elem = select(parentNode, selectors, tag);
  if (!elem) throw new Error(`Required element not found${tag? ` or not correct tag '${tag}'` : ''}: ${selectors}`);
  return elem;
}


export function selectAll<K extends keyof HTMLElementTagNameMap>(
  parentNode: ParentNode,
  selectors : K
): HTMLElementTagNameMap[K][];
export function selectAll(
  parentNode: ParentNode,
  selectors : string
): HTMLElement[];
export function selectAll<K extends keyof HTMLElementTagNameMap>(
  parentNode: ParentNode,
  selectors : string,
  tag?      : K
): HTMLElementTagNameMap[K][];
export function selectAll(
  parentNode: ParentNode,
  selectors : string,
  tag?      : keyof HTMLElementTagNameMap
  ): HTMLElement[] {
  return (
    Array.from(parentNode.querySelectorAll(selectors))
    .filter(elem =>
      elem instanceof HTMLElement &&
      (!tag || elem.tagName === tag.toUpperCase())
    ) as HTMLElement[]
  );
}


export function firstChild(
  parentNode: ParentNode,
): HTMLElement | undefined;
export function firstChild<K extends keyof HTMLElementTagNameMap>(
  parentNode: ParentNode,
  tag?      : K
): HTMLElementTagNameMap[K] | undefined;
export function firstChild(
  parentNode: ParentNode,
  tag?      : keyof HTMLElementTagNameMap
): HTMLElement | undefined {
  const elem = parentNode.firstElementChild;
  if (!(elem instanceof HTMLElement)) {
    return;
  }
  if (tag && tag.toUpperCase() !== elem.tagName) {
    return;
  }
  
  return elem;
}


export function firstChildR(
  parentNode: ParentNode,
): HTMLElement;
export function firstChildR<K extends keyof HTMLElementTagNameMap>(
  parentNode: ParentNode,
  tag?      : K
): HTMLElementTagNameMap[K];
export function firstChildR(
  parentNode: ParentNode,
  tag?      : keyof HTMLElementTagNameMap
): HTMLElement {
  const elem = firstChild(parentNode, tag);
  if (!elem) throw new Error(`Required first element child not found${tag? ` or not correct tag '${tag}'` : ''}.`);
  return elem;
}


export function cloneElem<K extends HTMLElement>(
  elem : K,
  deep?: boolean
): K;
export function cloneElem(
  elem : HTMLElement,
  deep?: boolean
): HTMLElement {
  return (elem.cloneNode(deep)) as HTMLElement;
}
