import { NormalizedError } from 'class/normalized-error';

type Left<L> = { tag: 'Left'; value: L };
type Right<R> = { tag: 'Right'; value: R };
type Either<L, R> = Left<L> | Right<R>;

const Left = <L>(value: L): Left<L> => ({ tag: 'Left', value });
const Right = <R>(value: R): Right<R> => ({ tag: 'Right', value });

export class EitherTask<L extends NormalizedError, R> {
  private constructor(private promise: Promise<Either<L, R>>) {}

  static from<R>(promise: Promise<R>): EitherTask<NormalizedError, R> {
    const wrappedPromise = promise.then(
      (value) => Right<R>(value),
      (error) => Left(NormalizedError.from(error)),
    );
    return new EitherTask(wrappedPromise);
  }

  public map<T>(fn: (value: R) => T) {
    const newPromise = this.promise.then(
      (either) => {
        if (either.tag === 'Left') return either;
        try {
          const result = fn(either.value);
          return Right(result);
        } catch (error) {
          return Left(NormalizedError.from(error));
        }
      },
      (error) => Left(NormalizedError.from(error)),
    );
    return new EitherTask(newPromise);
  }

  public chain<T>(fn: (value: R) => EitherTask<L, T>) {
    const newPromise = this.promise.then(
      (either) => {
        if (either.tag === 'Left') return either as Either<L, T>;
        try {
          const resultTask = fn(either.value);
          return resultTask.promise;
        } catch (error) {
          return Left(NormalizedError.from(error));
        }
      },
      (error) => Left(NormalizedError.from(error)),
    );
    return new EitherTask(newPromise);
  }

  public fold<TLeft, TRight>(
    onLeft: (error: L) => TLeft,
    onRight: (value: R) => TRight,
  ) {
    return this.promise.then(
      (either) => {
        if (either.tag === 'Left') return onLeft(either.value);
        return onRight(either.value);
      },
      (error) => onLeft(error),
    );
  }
}
