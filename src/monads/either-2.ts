abstract class Either<TLeft, TRight> {
  static fromTryCatch<TLeft, TRight>(
    fn: () => TRight,
    onError: (error: unknown) => TLeft,
  ): Either<TLeft, TRight> {
    try {
      return Right.from(fn());
    } catch (error) {
      return Left.from(onError(error));
    }
  }

  protected abstract readonly _tag: 'Left' | 'Right';
  protected _value: TLeft | TRight;

  get value(): TLeft | TRight {
    return this._value;
  }

  get [Symbol.toStringTag]() {
    return `${this._tag === 'Left' ? 'Left' : 'Right'}(${String(this._value)})`;
  }

  protected constructor(value: TLeft | TRight) {
    this._value = value;
  }

  abstract fold<TErrorResult, TResult>(
    onError: (error: TLeft) => TErrorResult,
    onSuccess: (value: TRight) => TResult,
  ): TErrorResult | TResult;

  abstract map<TResult>(fn: (value: TRight) => TResult): Either<TLeft, TResult>;

  abstract flatMap<TLeftResult, TRightResult>(
    fn: (value: TRight) => Either<TLeftResult, TRightResult>,
  ): Either<TLeft | TLeftResult, TRightResult>;

  isLeft(): this is this & { _tag: 'Left' } {
    return this._tag === 'Left';
  }

  isRight(): this is this & { _tag: 'Right' } {
    return this._tag === 'Right';
  }
}

export class Left<TLeft> extends Either<TLeft, never> {
  protected readonly _tag = 'Left' as const;
  static from = <TLeft>(value: TLeft) => new Left(value);

  private constructor(value: TLeft) {
    super(value);
  }

  fold<TErrorResult, TResult>(
    onError: (error: TLeft) => TErrorResult,
    _onSuccess: (value: never) => TResult,
  ): TErrorResult {
    return onError(this._value);
  }

  map<TResult>(_fn: (value: never) => TResult): Either<TLeft, TResult> {
    // Since this is a Left, we return it unchanged
    return this;
  }

  flatMap<TLeftResult, TRightResult>(
    _fn: (value: never) => Either<TLeftResult, TRightResult>,
  ): Either<TLeft | TLeftResult, TRightResult> {
    // Since this is a Left, we return it unchanged
    return this;
  }
}

export class Right<TRight> extends Either<never, TRight> {
  protected readonly _tag = 'Right' as const;
  static from = <TRight>(value: TRight) => new Right(value);

  private constructor(value: TRight) {
    super(value);
  }

  fold<TErrorResult, TResult>(
    _onError: (error: never) => TErrorResult,
    onSuccess: (value: TRight) => TResult,
  ): TResult {
    return onSuccess(this._value);
  }

  map<TResult>(fn: (value: TRight) => TResult): Either<never, TResult> {
    // Apply the function to the value and wrap it in a Right
    return new Right(fn(this._value));
  }

  flatMap<TLeftResult, TRightResult>(
    fn: (value: TRight) => Either<TLeftResult, TRightResult>,
  ): Either<TLeftResult, TRightResult> {
    // Apply the function to the value and return the resulting Either
    return fn(this._value);
  }
}

export type EitherType<TLeft, TRight> = Left<TLeft> | Right<TRight>;
