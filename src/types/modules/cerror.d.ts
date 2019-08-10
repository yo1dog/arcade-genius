declare module '@yo1dog/cerror' {
  class CError extends Error {
    /**
     * Chains together errors such that the first error is the root cause
     * and the last error is the result.
     * 
     * Returns the last error.
     */
    public static link(...errs: Error[]): Error;
    
    /**
     * Creates an error with a cause.
     * 
     * Equivalent to `CError.chain(cause, new Error(message))`
     */
    public constructor(cause: Error, message: string);
    
    /**
     * Returns the cause of the given error (the next error in the chain).
     * 
     * Equivalent to `err[CError.causeSymbol]` or `CError.getChain(err)[1]`
     */
    public static getCause(err: Error): Error | undefined;
    
    /**
     * Returns the given error's chain of errors.
     * 
     * *Note:* the chain contains the given error at index 0.
     */
    public static getChain(err: Error): Error[];
    
    /**
     * Returns the root error of the given error's chain.
     * 
     * *Note:* If the given error does not have a cause, the given
     * error is the root and is returned.
     * 
     * Equivalent to `CError.getChain(err).pop()`
     */
    public static getRootError(err: Error): Error;
    
    /**
     * Returns the first error in the given error's chain that satisfies the
     * given testing function.
     * 
     * Similar to `CError.getChain(err).find(callback)` except the arguments
     * passed to `callback` differ slighty.
     */
    public static findInChain(err: Error, callback: (err: Error, depth: number) => unknown): Error | undefined;
    
    /**
     * Returns the first error in the given error's chain that is an instance
     * of the given constructor.
     * 
     * Equivalent to `CError.findInChain(err, err => err instanceof constructor)`
     */
    public static getFirstInstanceOf(err: Error, constructor: Function): Error | undefined
    
    /**
     * Returns the error in the given depth in the given error's chain.
     * 
     * A depth of 0 will return the given error. 1 will return
     * the given error's cause. etc.
     * 
     * Similar to `CError.getChain(err)[depth]` except this function
     * will traverse circular references (won't throw an error).
     */
    public static getErrorAt(err: Error, depth: number): Error | undefined;
    
    /**
     * Returns an interator that traverses the given error's chain.
     */
    public static getChainIterator(err: Error, checkCircular?: boolean): IterableIterator<Error>;
  }
  
  export default CError;
}