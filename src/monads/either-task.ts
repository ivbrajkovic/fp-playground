import { NormalizedError } from 'class/normalized-error';

type Left<L> = { tag: 'Left'; value: L };
type Right<R> = { tag: 'Right'; value: R };
type Either<L, R> = Left<L> | Right<R>;

const left = <L>(value: L): Left<L> => ({ tag: 'Left' as const, value });
const right = <R>(value: R): Right<R> => ({ tag: 'Right' as const, value });

export class EitherTask<L, R> {
  private constructor(private readonly task: () => Promise<Either<L, R>>) {}

  static of = <R>(task: () => Promise<R>): EitherTask<NormalizedError, R> => {
    return new EitherTask(() =>
      task()
        .then((value) => right<R>(value))
        .catch((error) => left(NormalizedError.from(error))),
    );
  };

  map<T>(fn: (value: R) => T): EitherTask<L | NormalizedError, T> {
    const newTask = () =>
      this.task()
        .then((value) => {
          if (value.tag === 'Left') return value;
          return right(fn(value.value));
        })
        .catch((error) => left(NormalizedError.from(error)));
    return new EitherTask<L | NormalizedError, T>(newTask);
  }

  chain = <T>(
    fn: (value: R) => EitherTask<L | NormalizedError, T>,
  ): EitherTask<L | NormalizedError, T> => {
    const newTask = () =>
      this.task()
        .then((value) => {
          if (value.tag === 'Left') return value;
          return fn(value.value).task;
        })
        .catch((error) => left(NormalizedError.from(error)));

    return new EitherTask(newTask);
  };

  ap2<A, B>(
    this: EitherTask<L, (value: A) => B>,
    other: EitherTask<L | NormalizedError, A>,
  ) {
    const newPromise = this.task.then(
      (value) => {
        if (value.tag === 'Left') return value as Left<L | NormalizedError>;
        return other.task.then((val) => {
          if (val.tag === 'Left') return val as Left<L | NormalizedError>;
          return right(value.value(val.value));
        });
      },
      (error) => left(NormalizedError.from(error)),
    );
    return new EitherTask(newPromise);
  }

  ap<A, B>(
    this: EitherTask<L, (value: A) => B>,
    other: EitherTask<L | NormalizedError, A>,
  ) {
    return new EitherTask(async () => {
      const [eitherFn, eitherValue] = await Promise.all([
        this.task,
        other.task,
      ]);
    });
  }

  fold<TLeft, TRight>(
    onLeft: (error: L | NormalizedError) => TLeft,
    onRight: (value: R) => TRight,
  ): Promise<TLeft | TRight> {
    return this.task()
      .then((either) => {
        if (either.tag === 'Left') return onLeft(either.value);
        return onRight(either.value);
      })
      .catch((error) => onLeft(NormalizedError.from(error)));
  }
}
