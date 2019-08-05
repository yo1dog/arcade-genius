declare module 'lib/jsonview/jsonview.js' {
  interface IJSONView {
    format: (json: object, targetElem: Element) => void;
  }
  
  const content:IJSONView;
  export default content;
}

declare module 'lib/get_uuid.js' {
  const content:() => string;
  export default content;
}