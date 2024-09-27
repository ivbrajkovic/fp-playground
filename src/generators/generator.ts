import { NormalizedError } from './NormalizedError';
import { wait } from './utils';

export const fromPromise = <TArgs, TReturn>(
  fn: (...args: TArgs[]) => Promise<TReturn>
) =>
  async function* (...args: TArgs[]) {
    while (true) yield await fn(...args);
  };

export const fromPromiseTryCatch = <TArgs, TReturn>(
  fn: (...args: TArgs[]) => Promise<TReturn>
) =>
  async function* (...args: TArgs[]) {
    try {
      while (true) yield await fn(...args);
    } catch (error) {
      yield NormalizedError.from(error);
    }
  };

export const interval =
  (mils: number) =>
  <TArgs, TReturn>(generator: (...args: TArgs[]) => AsyncGenerator<TReturn>) =>
    async function* (...args: TArgs[]) {
      for await (const result of generator(...args)) {
        yield result;
        await wait(mils);
      }
    };

export const take =
  (count: number) =>
  <TArgs, TReturn>(generator: (...args: TArgs[]) => AsyncGenerator<TReturn>) =>
    async function* (...args: TArgs[]) {
      if (count <= 0) return;
      for await (const result of generator(...args)) {
        yield result;
        if (!--count) break;
      }
    };

export const map =
  <TArgs, TReturn, R>(fn: (value: TReturn) => R) =>
  (generator: (...args: TArgs[]) => AsyncGenerator<TReturn>) =>
    async function* (...args: TArgs[]) {
      for await (const result of generator(...args)) {
        yield fn(result);
      }
    };

export const catchError = <TArgs, TReturn>(
  generator: (...args: TArgs[]) => AsyncGenerator<TReturn>
) =>
  async function* () {
    try {
      for await (const result of generator()) {
        yield result;
      }
    } catch (error) {
      yield NormalizedError.from(error);
    }
  };

export const chain =
  <TArgs, TReturn, R>(fn: (value: TReturn) => AsyncGenerator<R>) =>
  (generator: (...args: TArgs[]) => AsyncGenerator<TReturn>) =>
    async function* (...args: TArgs[]) {
      for await (const result of generator(...args)) {
        const innerGenerator = fn(result);
        for await (const innerResult of innerGenerator) {
          yield innerResult;
        }
      }
    };
