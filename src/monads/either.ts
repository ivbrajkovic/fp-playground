import { NormalizedError } from 'class/normalized-error';

export type Left<L> = { _tag: 'Left'; value: L };
export type Right<R> = { _tag: 'Right'; value: R };

export class Either<L, R> {
  private constructor(public container: Left<L> | Right<R>) {}

  static ofLeft = <L>(value: L): Either<L, never> =>
    new Either<L, never>({ _tag: 'Left', value });

  static ofRight = <R>(value: R): Either<never, R> =>
    new Either<never, R>({ _tag: 'Right', value });

  static ofTryCatch = <R>(fn: () => R): Either<NormalizedError, R> => {
    try {
      return Either.ofRight(fn());
    } catch (error) {
      return Either.ofLeft(NormalizedError.from(error));
    }
  };

  getOrDefault = <T>(defaultValue: T): [L] extends [never] ? R : R | T => {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    if (this.container._tag === 'Left') return defaultValue as any;
    return this.container.value;
  };

  ap<A, B, L1>(
    this: Either<L, (value: A) => B>,
    val: Either<L1, A>,
  ): Either<L1 | L, B> {
    if (this.container._tag === 'Left') return this as Either<L, B>;
    if (val.container._tag === 'Left') return val as unknown as Either<L1, B>;
    return Either.ofRight(this.container.value(val.container.value));
  }

  map = <R1>(fn: (value: R) => R1): Either<L, R1> => {
    if (this.container._tag === 'Left') return this as unknown as Either<L, R1>;
    return Either.ofRight(fn(this.container.value));
  };

  tryMap = <R1>(fn: (value: R) => R1): Either<L | NormalizedError, R1> => {
    if (this.container._tag === 'Left') return this as unknown as Either<L, R1>;
    try {
      return Either.ofRight(fn(this.container.value));
    } catch (error) {
      return Either.ofLeft(NormalizedError.from(error));
    }
  };

  chain = <L1, R1>(fn: (value: R) => Either<L1, R1>): Either<L | L1, R1> => {
    if (this.container._tag === 'Left') return this as unknown as Either<L, R1>;
    return fn(this.container.value);
  };

  tryChain = <L1 = never, R1 = never>(
    fn: (value: R) => Either<L1, R1>,
  ): Either<L | L1 | NormalizedError, R1> => {
    if (this.container._tag === 'Left') return this as unknown as Either<L, R1>;
    try {
      return fn(this.container.value);
    } catch (error) {
      return Either.ofLeft(NormalizedError.from(error));
    }
  };

  fold = <TLeftResult, TRightResult>(
    onLeft: (value: L) => TLeftResult,
    onRight: (value: R) => TRightResult,
  ) => {
    if (this.container._tag === 'Left') return onLeft(this.container.value);
    return onRight(this.container.value);
  };
}
