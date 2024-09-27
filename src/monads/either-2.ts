/* eslint-disable @typescript-eslint/no-explicit-any */
import { NormalizedError } from 'class/normalized-error';

type Left<L> = { _tag: 'Left'; value: L };
type Right<R> = { _tag: 'Right'; value: R };
// type Either<L, R> = Left<L> | Right<R>;

type IsNever<T> = [T] extends [never] ? true : false;
type IsNotNever<T> = [T] extends [never] ? false : true;

type A = IsNever<never>; // true
type B = IsNever<string>; // false

export class Either<L, R> {
  #value: Left<L> | Right<R>;

  private constructor(value: Left<L> | Right<R>) {
    this.#value = value;
  }

  static left<L>(value: L): Either<L, never> {
    return new Either<L, never>({ _tag: 'Left', value });
  }

  static right<R>(value: R): Either<never, R> {
    return new Either<never, R>({ _tag: 'Right', value });
  }

  get [Symbol.toStringTag]() {
    return `${this.#value._tag === 'Left' ? 'Left' : 'Right'}(${String(
      this.#value.value,
    )})`;
  }

  getTag() {
    return this.#value._tag;
  }

  get() {
    return this.#value.value;
  }

  getOrElse = <const T>(
    defaultValue: T,
  ): [L] extends [never] ? R : [R] extends [never] ? T : T | R =>
    (this.#value._tag === 'Left' ? defaultValue : this.#value.value) as any;

  map = <T>(
    fn: (value: R) => T,
  ): [L] extends [never]
    ? Either<never, T>
    : [R] extends [never]
    ? Either<L, never>
    : Either<L, T> =>
    (this.#value._tag === 'Left'
      ? this
      : Either.right(fn(this.#value.value))) as any;

  // chain = <L1, T1>(
  //   fn: (value: R) => Either<L1, T1>,
  // ): [L1] extends [never]
  //   ? Either<L, T1>
  //   : [L] extends [never]
  //   ? Either<L1, R>
  //   : Either<L | L1, T1> =>
  //   (this.#value._tag === 'Left' ? this : fn(this.#value.value)) as any;

  chain = <L1, T1>(
    fn: (value: R) => Either<L1, T1>,
  ): IsNotNever<L> extends true
    ? Either<L, R>
    : IsNotNever<L1> extends true
    ? Either<L1, never>
    : IsNotNever<T1> extends true
    ? Either<never, T1>
    : Either<L | L1, T1> =>
    (this.#value._tag === 'Left'
      ? (this as unknown as Either<L, never>)
      : fn(this.#value.value)) as any;

  safeMap = <T>(fn: (value: R) => T): Either<NormalizedError, T> => {
    if (this.#value._tag === 'Left') return this as any;
    try {
      return Either.right(fn(this.#value.value));
    } catch (error) {
      return Either.left(NormalizedError.from(error));
    }
  };

  safeChain = <T>(
    fn: (value: R) => Either<NormalizedError, T>,
  ): Either<NormalizedError, T> => {
    if (this.#value._tag === 'Left') return this as any;
    try {
      return fn(this.#value.value);
    } catch (error) {
      return Either.left(NormalizedError.from(error));
    }
  };

  fold = <TOnLeftResult, TOnRightResult>(
    onLeft: (value: L) => TOnLeftResult,
    onRight: (value: R) => TOnRightResult,
  ) => {
    return this.#value._tag === 'Left'
      ? onLeft(this.#value.value)
      : onRight(this.#value.value);
  };

  safeFold = <TOnLeftResult, TOnRightResult>(
    onLeft: (value: L) => TOnLeftResult,
    onRight: (value: R) => TOnRightResult,
  ) => {
    return this.#value._tag === 'Left'
      ? onLeft(this.#value.value)
      : onRight(this.#value.value);
  };
}
