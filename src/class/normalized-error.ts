export class NormalizedError extends Error {
  type = 'NormalizedError';

  static from(error: unknown): NormalizedError {
    if (error instanceof NormalizedError) return error;
    if (error instanceof Error)
      return new NormalizedError(error.message, { cause: error });
    if (typeof error === 'string') return new NormalizedError(error);

    if (typeof error === 'object' && error !== null) {
      try {
        return new NormalizedError(JSON.stringify(error));
      } catch (jsonError) {
        return new NormalizedError(
          `An error occurred while serializing the object: ${
            (jsonError as Error).message
          }`,
        );
      }
    }

    const unsupportedType = typeof error;
    return unsupportedType === 'function' ||
      unsupportedType === 'boolean' ||
      unsupportedType === 'number' ||
      unsupportedType === 'bigint' ||
      unsupportedType === 'symbol'
      ? new NormalizedError(`Unsupported error type: ${unsupportedType}`)
      : new NormalizedError('An unknown error occurred.');
  }

  constructor(public message: string, options?: ErrorOptions) {
    super(message, options);
  }
}
