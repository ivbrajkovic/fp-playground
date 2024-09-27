import { Left, Right, type Either } from './Either';
import { GeneratorError } from './GeneratorError';

export const fromPromiseEither = <TArgs, TReturn, E, R>(
  fn: (...args: TArgs[]) => Promise<TReturn>
) =>
  async function* (...args: TArgs[]) {
    try {
      while (true) yield Right.from(await fn(...args));
    } catch (error) {
      yield Left.from(GeneratorError.from(error));
    }
  };

export const fromGeneratorFuncEither = <TArgs, TReturn>(
  generatorRn: (...args: TArgs[]) => AsyncGenerator<TReturn>
) =>
  async function* (...args: TArgs[]) {
    try {
      for await (const result of generatorRn(...args)) {
        yield Right.from(result);
      }
    } catch (error) {
      yield Left.from(GeneratorError.from(error));
    }
  };

export const takeUntilLeftEither = <TArgs, L, R>(
  generatorFn: (...args: TArgs[]) => AsyncGenerator<Left<L> | Right<R>>
) =>
  async function* (...args: TArgs[]) {
    for await (const result of generatorFn(...args)) {
      yield result;
      if (result.isLeft) break;
    }
  };
