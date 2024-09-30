import { NormalizedError } from 'class/normalized-error';

type Left<L> = { tag: 'Left'; value: L };
type Right<R> = { tag: 'Right'; value: R };
type Either<L, R> = Left<L> | Right<R>;

export const eitherTaskLeft = <L>(value: L): Left<L> => ({
  tag: 'Left' as const,
  value,
});
export const eitherTaskRight = <R>(value: R): Right<R> => ({
  tag: 'Right' as const,
  value,
});

export class EitherTask<L, R> {
  private constructor(private readonly task: () => Promise<Either<L, R>>) {}

  static of = <R>(task: () => Promise<R>): EitherTask<NormalizedError, R> => {
    return new EitherTask(() =>
      task()
        .then((value) => eitherTaskRight<R>(value))
        .catch((error) => eitherTaskLeft(NormalizedError.from(error))),
    );
  };

  map<R1>(fn: (value: R) => R1): EitherTask<L | NormalizedError, R1> {
    const newTask = () =>
      this.task()
        .then((value) => {
          if (value.tag === 'Left') return value;
          return eitherTaskRight(fn(value.value));
        })
        .catch((error) => eitherTaskLeft(NormalizedError.from(error)));
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
        .catch((error) => eitherTaskLeft(NormalizedError.from(error)));
    return new EitherTask<L | L1 | NormalizedError, R1>(newTask);
  };

  run(): Promise<Either<L, R>> {
    return this.task();
  }
}
