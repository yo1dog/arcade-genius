export declare function select<K extends keyof HTMLElementTagNameMap>(
  parentNode: ParentNode,
  selectors : K
): HTMLElementTagNameMap[K] | undefined;
export declare function select(
  parentNode: ParentNode,
  selectors : string
): HTMLElement | undefined;
export declare function select<K extends keyof HTMLElementTagNameMap>(
  parentNode: ParentNode,
  selectors : string,
  tag?      : K
): HTMLElementTagNameMap[K] | undefined;

export declare function selectR<K extends keyof HTMLElementTagNameMap>(
  parentNode: ParentNode,
  selectors : K
): HTMLElementTagNameMap[K];
export declare function selectR(
  parentNode: ParentNode,
  selectors : string
): HTMLElement;
export declare function selectR<K extends keyof HTMLElementTagNameMap>(
  parentNode: ParentNode,
  selectors : string,
  tag?      : K
): HTMLElementTagNameMap[K];

export declare function selectAll<K extends keyof HTMLElementTagNameMap>(
  parentNode: ParentNode,
  selectors : K
): HTMLElementTagNameMap[K][];
export declare function selectAll(
  parentNode: ParentNode,
  selectors : string
): HTMLElement[];
export declare function selectAll<K extends keyof HTMLElementTagNameMap>(
  parentNode: ParentNode,
  selectors : string,
  tag?      : K
): HTMLElementTagNameMap[K][];

export declare function firstChild(
  parentNode: ParentNode,
): HTMLElement | undefined;
export declare function firstChild<K extends keyof HTMLElementTagNameMap>(
  parentNode: ParentNode,
  tag?      : K
): HTMLElementTagNameMap[K] | undefined;

export declare function firstChildR(
  parentNode: ParentNode,
): HTMLElement;
export declare function firstChildR<K extends keyof HTMLElementTagNameMap>(
  parentNode: ParentNode,
  tag?      : K
): HTMLElementTagNameMap[K];

export declare function cloneElem<K extends HTMLElement>(
  elem: K,
  deep?: boolean
): K;