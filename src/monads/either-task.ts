import { NormalizedError } from 'class/normalized-error';

type Left<L> = { tag: 'Left'; value: L };
type Right<R> = { tag: 'Right'; value: R };
type Either<L, R> = Left<L> | Right<R>;

export const left = <L>(value: L): Left<L> => ({ tag: 'Left' as const, value });
export const right = <R>(value: R): Right<R> => ({
  tag: 'Right' as const,
  value,
});

export class EitherTask<L, R> {
  private constructor(private readonly task: () => Promise<Either<L, R>>) {}

  static of = <R>(task: () => Promise<R>): EitherTask<NormalizedError, R> => {
    return new EitherTask(() =>
      task()
        .then((value) => right<R>(value))
        .catch((error) => left(NormalizedError.from(error))),
    );
  };

  map<R1>(fn: (value: R) => R1): EitherTask<L | NormalizedError, R1> {
    const newTask = () =>
      this.task()
        .then((value) => {
          if (value.tag === 'Left') return value;
          return right(fn(value.value));
        })
        .catch((error) => left(NormalizedError.from(error)));
    return new EitherTask<L | NormalizedError, R1>(newTask);
  }

  chain = <L1 = never, R1 = never>(
    fn: (value: R) => EitherTask<L1, R1>,
  ): EitherTask<L | L1 | NormalizedError, R1> => {
    const newTask = () =>
      this.task()
        .then((value) => {
          if (value.tag === 'Left')
            return value as Either<L | L1 | NormalizedError, R1>;
          return fn(value.value).task();
        })
        .catch((error) => left(NormalizedError.from(error)));
    return new EitherTask<L | L1 | NormalizedError, R1>(newTask);
  };

  ap<A, B, L1>(
    this: EitherTask<L, (value: A) => B>,
    val: EitherTask<L1, A>,
  ): EitherTask<L | L1 | NormalizedError, B> {
    const newTask = () =>
      Promise.all([this.task(), val.task()])
        .then(([value1, value2]) => {
          if (value1.tag === 'Left')
            return value1 as Either<L | L1 | NormalizedError, B>;
          if (value2.tag === 'Left')
            return value2 as Either<L | L1 | NormalizedError, B>;
          return right(value1.value(value2.value));
        })
        .catch((error) => left(NormalizedError.from(error)));
    return new EitherTask<L | L1 | NormalizedError, B>(newTask);
  }

  run(): Promise<Either<L, R>> {
    return this.task();
  }

  fold = <TLeft, TRight>(
    onLeft: (value: L | NormalizedError) => TLeft,
    onRight: (value: R) => TRight,
  ): Promise<TLeft | TRight> => {
    return this.task()
      .then((value) => {
        if (value.tag === 'Left') return onLeft(value.value);
        return onRight(value.value);
      })
      .catch((error) => onLeft(NormalizedError.from(error)));
  };
}
