export class UnrecoverableJobError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'UnrecoverableJobError';
    
    // Captura o stack trace
    if (Error.captureStackTrace) {
      Error.captureStackTrace(this, UnrecoverableJobError);
    }
  }
}
