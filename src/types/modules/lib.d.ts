declare module 'lib/jsonview/jsonview.js' {
  interface IJSONView {
    format: (json: object, targetElem: Element) => void;
  }
  
  const content:IJSONView;
  export default content;
}

declare module 'lib/get_uuid.js' {
  function createUUID(): string;
  export default createUUID;
}

declare module 'lib/levenshtein.js' {
  function calcLevenshteinDistance(a: string, b:string): number;
  export default calcLevenshteinDistance;
}