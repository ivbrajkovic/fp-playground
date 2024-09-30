/**
 * @module EitherMonadTests
 *
 * This module contains a suite of tests for the Either Monad implementation.
 * The Either Monad is a powerful functional programming construct that represents
 * a value that can be one of two types: a Left value (typically representing an error)
 * or a Right value (representing a successful computation).
 *
 * The tests cover various functionalities of the Either Monad, including:
 *
 * - **Creation**: Tests for creating Left and Right values.
 * - **GetOrDefault**: Verifies the behavior of retrieving values or defaults.
 * - **Ap**: Tests for applying functions to values within the Either context.
 * - **Map**: Ensures correct mapping over Right values and handling of Left values.
 * - **Chain**: Tests chaining operations while preserving the Either structure.
 * - **Fold**: Validates folding over Left and Right values to produce results.
 * - **Map and Chain**: Combines mapping and chaining to ensure correct propagation.
 * - **OfTryCatch**: Tests for executing functions with error handling.
 *
 * Each test case uses the Vitest framework for assertions and mocking, ensuring
 * that the Either Monad behaves as expected in various scenarios, including
 * error handling and value transformations.
 */

import { NormalizedError } from 'class/normalized-error';
import { Either } from 'monads/either';
import { random } from 'utils';
import {
  describe,
  it,
  expect,
  vi,
  afterEach,
  beforeEach,
  afterAll,
  assert,
} from 'vitest';

describe('Either Monad', () => {
  const LEFT = 'Left';
  const RIGHT = 'Right';
  const ERROR_MESSAGE = 'Test error';
  const BAD_LUCK_ERROR = 'Bad luck, number is too large';

  let addOneFn: (x: number) => number;
  let doubleFn: (x: number) => number;
  let addOneEitherFn: (x: number) => Either<never, number>;
  let addOTwoEitherFn: (x: number) => Either<never, number>;
  let doubleEitherFn: (x: number) => Either<never, number>;
  let throwErrorFn: () => never;

  beforeEach(() => {
    addOneFn = vi.fn((x: number) => x + 1);
    doubleFn = vi.fn((x: number) => x * 2);
    addOneEitherFn = vi.fn((x: number) => Either.ofRight(x + 1));
    addOTwoEitherFn = vi.fn((x: number) => Either.ofRight(x + 2));
    doubleEitherFn = vi.fn((x: number) => Either.ofRight(x * 2));
    throwErrorFn = vi.fn(() => {
      throw new Error(ERROR_MESSAGE);
    });
  });

  afterEach(() => {
    vi.resetAllMocks();
  });

  afterAll(() => {
    vi.clearAllMocks();
  });

  describe('Creation', () => {
    it('should create a Left value', () => {
      const either = Either.ofLeft(ERROR_MESSAGE);
      expect(either.container._tag).toBe(LEFT);
      expect(either.container.value).toBe(ERROR_MESSAGE);
    });

    it('should create a Right value', () => {
      const either = Either.ofRight(42);
      expect(either.container._tag).toBe(RIGHT);
      expect(either.container.value).toBe(42);
    });
  });

  describe('GetOrDefault', () => {
    it('should return default value for Left in getOrDefault', () => {
      const either = Either.ofLeft(ERROR_MESSAGE);
      expect(either.getOrDefault(100)).toBe(100);
    });

    it('should return value for Right in getOrDefault', () => {
      const either = Either.ofRight(42);
      expect(either.getOrDefault(100)).toBe(42);
    });
  });

  describe('Ap', () => {
    it('should correctly apply function with ap', () => {
      const result = Either.ofRight(addOneFn).ap(Either.ofRight(2));
      expect(result.container._tag).toBe(RIGHT);
      expect(result.container.value).toBe(3);
    });

    it('should return Left if either is Left in ap', () => {
      const result = Either.ofLeft(ERROR_MESSAGE).ap(Either.ofRight(2));
      expect(result.container._tag).toBe(LEFT);
      expect(result.container.value).toBe(ERROR_MESSAGE);
    });

    it('should resolve curried function with ap', () => {
      const sumThreeNumbers = (x: number) => (y: number) => (z: number) =>
        x + y + z;
      const result = Either.ofRight(sumThreeNumbers)
        .ap(Either.ofRight(1))
        .ap(Either.ofRight(2))
        .ap(Either.ofRight(3));
      expect(result.container._tag).toBe(RIGHT);
      expect(result.container.value).toBe(6);
    });

    it("should short-circuit and return Left if either's function is Left in ap", () => {
      const sumThreeNumbers = (x: number) => (y: number) => (z: number) =>
        x + y + z;
      const result = Either.ofRight(sumThreeNumbers)
        .ap(Either.ofRight(1))
        .ap(Either.ofLeft(ERROR_MESSAGE))
        .ap(Either.ofRight(2));
      expect(result.container._tag).toBe(LEFT);
      expect(result.container.value).toBe(ERROR_MESSAGE);
    });
  });

  describe('Map', () => {
    it('should correctly map over Right value', () => {
      const result = Either.ofRight(42);
      expect(result.container._tag).toBe(RIGHT);
      expect(result.container.value).toBe(42);
    });

    it('should handle multiple map operations', () => {
      const result = Either.ofRight(10)
        .map(addOneFn)
        .map(addOneFn)
        .map(doubleFn)
        .map(doubleFn);
      expect(result.container._tag).toBe(RIGHT);
      expect(result.container.value).toBe(48);
    });

    it('should return same Left when mapping over Left', () => {
      const result = Either.ofLeft(ERROR_MESSAGE) //
        .map(addOneFn)
        .map(doubleFn);
      expect(addOneFn).not.toHaveBeenCalled();
      expect(doubleFn).not.toHaveBeenCalled();
      expect(result.container._tag).toBe(LEFT);
      expect(result.container.value).toBe(ERROR_MESSAGE);
    });

    it('should handle errors in safeMap without executing subsequent maps', () => {
      const result = Either.ofRight(42) //
        .map(addOneFn)
        .tryMap(throwErrorFn)
        .map(doubleFn);
      expect(doubleFn).not.toHaveBeenCalled();
      assert(result.container.value instanceof NormalizedError);
      expect(result.container._tag).toBe(LEFT);
      expect(result.container.value.message).toBe(ERROR_MESSAGE);
    });

    it('should correctly handle errors during safe mapping while preserving types', () => {
      const randomNumber = random(0, 10);
      const result = Either.ofRight(randomNumber) //
        .map(addOneFn)
        .tryMap((value) => {
          if (value > 5) throw new Error(BAD_LUCK_ERROR);
          return value;
        })
        .map(doubleFn);
      if (result.container.value instanceof NormalizedError) {
        expect(result.container._tag).toBe(LEFT);
        expect(result.container.value.message).toBe(BAD_LUCK_ERROR);
      } else {
        expect(result.container._tag).toBe(RIGHT);
        expect(result.container.value).toBe((randomNumber + 1) * 2);
      }
    });
  });

  describe('Chain', () => {
    it('should correctly chain on Right value', () => {
      const result = Either.ofRight(42)
        .chain(addOneEitherFn)
        .chain(addOneEitherFn)
        .chain(doubleEitherFn);
      expect(result.container._tag).toBe(RIGHT);
      expect(result.container.value).toBe(88);
    });

    it('should return same Left when chaining over Left', () => {
      const result = Either.ofLeft(ERROR_MESSAGE)
        .chain(addOneEitherFn)
        .chain(doubleEitherFn)
        .chain(doubleEitherFn);
      expect(result.container._tag).toBe(LEFT);
      expect(result.container.value).toBe(ERROR_MESSAGE);
    });

    it('should safely chain and catch errors', () => {
      const result = Either.ofRight(42)
        .chain(addOneEitherFn)
        .tryChain(throwErrorFn)
        .chain(doubleEitherFn);
      expect(doubleEitherFn).not.toHaveBeenCalled();
      assert(result.container.value instanceof NormalizedError);
      expect(result.container._tag).toBe(LEFT);
      expect(result.container.value.message).toBe(ERROR_MESSAGE);
    });

    it('should catch errors when chaining with a condition on Right values', () => {
      const result = Either.ofRight(42)
        .chain(addOneEitherFn)
        .chain(addOTwoEitherFn)
        .tryChain((value) => {
          const randomNumber = random(0, 10);
          if (randomNumber > 5) throw new Error(BAD_LUCK_ERROR);
          return Either.ofRight(value);
        });
      if (result.container._tag === LEFT) {
        expect(result.container._tag).toBe(LEFT);
        expect(result.container.value).toBeInstanceOf(NormalizedError);
        expect(result.container.value.message).toBe(BAD_LUCK_ERROR);
      } else {
        expect(result.container._tag).toBe(RIGHT);
        expect(result.container.value).toBe(45);
      }
    });
  });

  describe('Fold', () => {
    it('should fold correctly over Left', () => {
      const result = Either.ofLeft(ERROR_MESSAGE).fold(
        (error) => `Left: ${error}`,
        (value) => `Right: ${value}`,
      );
      expect(result).toBe(`Left: ${ERROR_MESSAGE}`);
    });

    it('should fold correctly over Right', () => {
      const result = Either.ofRight(42).fold(
        (error) => `Left: ${error}`,
        (value) => `Right: ${value}`,
      );
      expect(result).toBe('Right: 42');
    });
  });

  describe('Map and Chain', () => {
    it('should handle multiple chain and map operations', () => {
      const result = Either.ofRight(10)
        .map(addOneFn)
        .map(addOneFn)
        .chain(addOneEitherFn)
        .chain(doubleEitherFn)
        .map(doubleFn);
      expect(result.container._tag).toBe(RIGHT);
      expect(result.container.value).toBe(52);
    });

    it('should handle Left propagation through chain and map', () => {
      const result = Either.ofRight(10)
        .map(addOneFn)
        .chain((_value) => Either.ofLeft(ERROR_MESSAGE))
        .chain(doubleEitherFn)
        .map(doubleFn);
      expect(result.container._tag).toBe(LEFT);
      expect(result.container.value).toBe(ERROR_MESSAGE);
    });
  });

  describe('OfTryCatch', () => {
    it('should execute ofTryCatch and return Right on success', () => {
      const result = Either.ofTryCatch(() => 42);
      expect(result.container._tag).toBe(RIGHT);
      expect(result.container.value).toBe(42);
    });

    it('should execute ofTryCatch and catch errors', () => {
      const result = Either.ofTryCatch(() => {
        throw new Error(ERROR_MESSAGE);
      });
      expect(result.container._tag).toBe(LEFT);
      expect(result.container.value).toBeInstanceOf(NormalizedError);
      expect(result.container.value.message).toBe(ERROR_MESSAGE);
    });
  });
});
