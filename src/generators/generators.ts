/* eslint-disable @typescript-eslint/no-explicit-any */
import { NormalizedError } from 'class/normalized-error';
import { wait } from 'utils';

export const fromPromise = <TArgs, TReturn>(
  fn: (...args: TArgs[]) => Promise<TReturn>,
) =>
  async function* (...args: TArgs[]) {
    while (true) yield await fn(...args);
  };

export const fromPromiseTryCatch = <TArgs, TReturn>(
  fn: (...args: TArgs[]) => Promise<TReturn>,
) =>
  async function* (
    ...args: TArgs[]
  ): AsyncGenerator<TReturn | NormalizedError> {
    try {
      while (true) yield await fn(...args);
    } catch (error) {
      yield NormalizedError.from(error);
    }
  };

export const interval =
  (mils: number) =>
  <TArgs, TReturn>(generator: (...args: TArgs[]) => AsyncGenerator<TReturn>) =>
    async function* (...args: TArgs[]): AsyncGenerator<TReturn> {
      for await (const result of generator(...args)) {
        yield result;
        await wait(mils);
      }
    };

export const take =
  (count: number) =>
  <TArgs, TReturn>(generator: (...args: TArgs[]) => AsyncGenerator<TReturn>) =>
    async function* (...args: TArgs[]): AsyncGenerator<TReturn> {
      if (count <= 0) return;
      for await (const result of generator(...args)) {
        yield result;
        if (!--count) break;
      }
    };

export const map =
  <TArgs, TValue, TReturn>(fn: (value: TValue) => TReturn) =>
  (generator: (...args: TArgs[]) => AsyncGenerator<TValue>) =>
    async function* (...args: TArgs[]): AsyncGenerator<TReturn> {
      for await (const result of generator(...args)) {
        yield fn(result);
      }
    };

export const catchError = <TArgs, TReturn>(
  generator: (...args: TArgs[]) => AsyncGenerator<TReturn>,
) =>
  async function* (): AsyncGenerator<TReturn | NormalizedError> {
    try {
      for await (const result of generator()) {
        yield result;
      }
    } catch (error) {
      yield NormalizedError.from(error);
    }
  };

export const chain =
  <TArgs, TValue, TReturn>(fn: (value: TValue) => AsyncGenerator<TReturn>) =>
  (generator: (...args: TArgs[]) => AsyncGenerator<TValue>) =>
    async function* (...args: TArgs[]): AsyncGenerator<TReturn> {
      for await (const result of generator(...args)) {
        const innerGenerator = fn(result);
        for await (const innerResult of innerGenerator) {
          yield innerResult;
        }
      }
    };

/**
 * Iterates over each value yielded by an async generator, applying a callback.
 * If the callback returns `false`, the iteration stops.
 *
 * @typeParam TArgs - Tuple of argument types for the generator function.
 * @typeParam TReturn - The type of values yielded by the generator.
 * @param callback - A function applied to each yielded value.
 * @returns A function that takes generator arguments and returns a Promise.
 */
export const forEach =
  <TArgs extends any[], TReturn>(callback: (value: TReturn) => boolean) =>
  (generator: (...args: TArgs) => AsyncGenerator<TReturn>) =>
  async (...args: TArgs): Promise<void> => {
    for await (const value of generator(...args)) {
      callback(value);
    }
  };
