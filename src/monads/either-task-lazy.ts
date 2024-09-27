import { NormalizedError } from 'class/normalized-error';

type Left<L> = { tag: 'Left'; value: L };
type Right<R> = { tag: 'Right'; value: R };
type Either<L, R> = Left<L> | Right<R>;

const Left = <L>(value: L): Left<L> => ({ tag: 'Left', value });
const Right = <R>(value: R): Right<R> => ({ tag: 'Right', value });

export class EitherTaskLazy<L extends NormalizedError, R> {
  private constructor(private promiseThunk: () => Promise<Either<L, R>>) {}

  static from<R>(
    promiseThunk: () => Promise<R>,
  ): EitherTaskLazy<NormalizedError, R> {
    const wrappedPromiseThunk = () =>
      promiseThunk().then(
        (value) => Right<R>(value),
        (error) => Left(NormalizedError.from(error)),
      );
    return new EitherTaskLazy(wrappedPromiseThunk);
  }

  public map<T>(fn: (value: R) => T): EitherTaskLazy<L, T> {
    const newPromiseThunk = () =>
      this.run().then(
        (either) => {
          if (either.tag === 'Left') return either;
          try {
            const result = fn(either.value);
            return Right(result);
          } catch (error) {
            return Left(NormalizedError.from(error) as L);
          }
        },
        (error) => Left(NormalizedError.from(error) as L),
      );
    return new EitherTaskLazy(newPromiseThunk);
  }

  public chain<T>(
    fn: (value: R) => EitherTaskLazy<L, T>,
  ): EitherTaskLazy<L, T> {
    const newPromiseThunk = () =>
      this.run().then(
        (either) => {
          if (either.tag === 'Left') return either as Either<L, T>;
          try {
            return fn(either.value).run();
          } catch (error) {
            return Promise.resolve(Left(NormalizedError.from(error) as L));
          }
        },
        (error) => Promise.resolve(Left(NormalizedError.from(error) as L)),
      );
    return new EitherTaskLazy(newPromiseThunk);
  }

  public run(): Promise<Either<L, R>> {
    return this.promiseThunk();
  }

  public fold<TLeft, TRight>(
    onLeft: (error: L) => TLeft,
    onRight: (value: R) => TRight,
  ): Promise<TLeft | TRight> {
    return this.run().then(
      (either) => {
        if (either.tag === 'Left') return onLeft(either.value);
        return onRight(either.value);
      },
      (error) => onLeft(error as L),
    );
  }
}
