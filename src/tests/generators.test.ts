// asyncGeneratorUtils.test.ts

import {
  describe,
  it,
  expect,
  vi,
  beforeEach,
  afterEach,
  afterAll,
  assert,
} from 'vitest';
import {
  fromPromiseTryCatch,
  interval,
  take,
  map,
  catchError,
  chain,
  fromPromise,
  forEach,
} from 'generators/generators';
import { NormalizedError } from 'class/normalized-error';

describe('Generators', () => {
  const SUCCESS_MESSAGE = 'Test success';
  const ERROR_MESSAGE = 'Test error';

  let addOneAsync: (num: number) => Promise<number>;
  const mockGenerator = async function* () {
    let i = 1;
    while (true) yield i++;
  };
  const promiseIncrementGenerator = () => {};

  beforeEach(() => {
    addOneAsync = vi.fn(async (num: number) => num + 1);
  });

  afterEach(() => {
    vi.resetAllMocks();
  });

  afterAll(() => {
    vi.restoreAllMocks();
  });

  describe.only('fromPromise', () => {
    it('should repeatedly yield results from the promise function', async () => {
      const generator = fromPromise(addOneAsync);
      const genInstance = generator(3);
      const results: number[] = [];

      for (let i = 0; i < 3; i++) {
        const { value, done } = await genInstance.next();
        expect(done).toBe(false);
        results.push(value);
      }

      for await (const value of genInstance) {
        results.push(value);
      }

      expect(results).toEqual([4, 4, 4]);
      expect(addOneAsync).toHaveBeenCalledTimes(3);
    });
  });

  describe.only('fromPromiseTryCatch', () => {
    it('should yield results until an error occurs, then yield NormalizedError', async () => {
      let count = 0;
      const mockFn = vi.fn(async () => {
        if (count++ < 2) return SUCCESS_MESSAGE;
        else throw new Error(ERROR_MESSAGE);
      });
      const generator = fromPromiseTryCatch(mockFn);
      const genInstance = generator();
      const results: (string | NormalizedError)[] = [];

      for (let i = 0; i < 3; i++) {
        const { value, done } = await genInstance.next();
        expect(done).toBe(false);
        results.push(value);
      }

      expect(results[0]).toBe(SUCCESS_MESSAGE);
      expect(results[1]).toBe(SUCCESS_MESSAGE);
      assert(results[2] instanceof NormalizedError);
      expect(results[2].message).toBe(ERROR_MESSAGE);
      expect(mockFn).toHaveBeenCalledTimes(3);
    });
  });

  describe.only('interval', () => {
    it('should yield results with the specified interval', async () => {
      const mils = 10; // Use a small interval to keep the test fast

      const intervalGenerator = interval(mils)(mockGenerator);
      const results: number[] = [];

      const genInstance = intervalGenerator();

      for await (const value of genInstance) {
        results.push(value);
        if (value === 3) break;
      }

      expect(results).toEqual([1, 2, 3]);
    });
  });

  describe.only('take', () => {
    it('should yield only the specified number of items', async () => {
      const mockGenerator = async function* () {
        let i = 1;
        while (true) yield i++;
      };

      const takeGenerator = take(3)(mockGenerator);
      const genInstance = takeGenerator();
      const results: number[] = [];

      for await (const value of genInstance) {
        results.push(value);
      }

      expect(results).toEqual([1, 2, 3]);
    });
  });

  describe('map', () => {
    it('should apply the mapping function to each value', async () => {
      const mockGenerator = async function* () {
        yield 1;
        yield 2;
        yield 3;
      };

      const mapGenerator = map((x: number) => x * 2)(mockGenerator);

      const genInstance = mapGenerator();

      const results: number[] = [];

      for await (const value of genInstance) {
        results.push(value);
      }

      expect(results).toEqual([2, 4, 6]);
    });
  });

  describe('catchError', () => {
    it('should catch errors and yield NormalizedError', async () => {
      const mockGenerator = async function* () {
        yield 1;
        throw new Error('Test error');
      };

      const catchErrorGenerator = catchError(mockGenerator);

      const genInstance = catchErrorGenerator();

      const results: any[] = [];

      for await (const value of genInstance) {
        results.push(value);
      }

      expect(results[0]).toBe(1);
      expect(results[1]).toBeInstanceOf(NormalizedError);
      expect(results[1].message).toBe('Test error');
    });
  });

  describe('chain', () => {
    it('should flatten results from inner generators', async () => {
      const mockGenerator = async function* () {
        yield 1;
        yield 2;
      };

      const innerGeneratorFn = async function* (value: number) {
        yield value;
        yield value * 10;
      };

      const chainGenerator = chain(innerGeneratorFn)(mockGenerator);

      const genInstance = chainGenerator();

      const results: number[] = [];

      for await (const value of genInstance) {
        results.push(value);
      }

      expect(results).toEqual([1, 10, 2, 20]);
    });
  });

  describe('Function Composition', () => {
    it('should compose functions and produce correct results', async () => {
      vi.useFakeTimers();

      const mils = 100;
      let count = 0;

      const promiseFn = vi.fn(async () => count++);

      const composedGenerator = compose(
        interval(mils),
        take(3),
        map((x: number) => x * 2),
        fromPromise(promiseFn),
      )();

      const genInstance = composedGenerator;

      const results: number[] = [];

      const genNext = async () => {
        const { value, done } = await genInstance.next();
        if (!done) {
          results.push(value);
        }
      };

      // Start the generator
      genNext();

      // Advance time and collect results
      for (let i = 0; i < 3; i++) {
        vi.advanceTimersByTime(mils);
        await Promise.resolve();
        await genNext();
      }

      expect(results).toEqual([0, 2, 4]);
      expect(promiseFn).toHaveBeenCalledTimes(3);

      vi.useRealTimers();
    });
  });

  describe.only('forEach', () => {
    it('should apply the callback to each value from the generator', async () => {
      const mockGenerator = async function* () {
        yield 1;
        yield 2;
        yield 3;
      };

      const callback = vi.fn();
      const forEachFunction = forEach(callback)(mockGenerator);
      await forEachFunction();

      expect(callback).toHaveBeenCalledTimes(3);
      expect(callback).toHaveBeenNthCalledWith(1, 1);
      expect(callback).toHaveBeenNthCalledWith(2, 2);
      expect(callback).toHaveBeenNthCalledWith(3, 3);
    });
  });
});
